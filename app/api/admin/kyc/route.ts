import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getUser } from "../../../auth";
import { getDb } from "../../../../db";
import { kycApplications, kycReviewEvents } from "../../../../db/schema";
import { isKycAdmin } from "../../../../lib/kyc-admin";
import { getKycProviderStatus } from "../../../../lib/kyc-provider";

export const dynamic = "force-dynamic";
const reviewChecks = ["identity", "address", "pan", "liveness", "bank", "sanctions", "edd", "senior_management"] as const;
const standardApprovalChecks = reviewChecks.slice(0, 6);

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!isKycAdmin(user)) return NextResponse.json({ error: "KYC admin access required" }, { status: 403 });
  const db = getDb();
  const applications = await db.select().from(kycApplications).orderBy(desc(kycApplications.updatedAt)).limit(200);
  const events = await db.select().from(kycReviewEvents).orderBy(desc(kycReviewEvents.createdAt)).limit(300);
  return NextResponse.json({ applications: applications.map((item) => ({ ...item, evidenceSummary: JSON.parse(item.evidenceSummary), reviewChecks: JSON.parse(item.reviewChecks), providerChecks: item.providerChecks ? JSON.parse(item.providerChecks) : null })), events, provider: getKycProviderStatus() });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!isKycAdmin(user)) return NextResponse.json({ error: "KYC admin access required" }, { status: 403 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const applicationId = String(body.applicationId ?? "");
  const decision = String(body.decision ?? "");
  const riskLevel = String(body.riskLevel ?? "unrated");
  const note = String(body.note ?? "").trim().slice(0, 800);
  const checks = Array.isArray(body.checks) ? body.checks.map(String).filter((item): item is typeof reviewChecks[number] => reviewChecks.includes(item as typeof reviewChecks[number])) : [];
  if (!applicationId || !["approved", "action_required", "rejected"].includes(decision) || !["low", "medium", "high"].includes(riskLevel)) return NextResponse.json({ error: "Invalid KYC decision." }, { status: 400 });
  if (decision === "approved" && standardApprovalChecks.some((item) => !checks.includes(item))) return NextResponse.json({ error: "Complete all identity, sanctions and risk checks before approval." }, { status: 400 });
  if (decision === "approved" && riskLevel === "high" && (!checks.includes("edd") || !checks.includes("senior_management") || note.length < 20)) return NextResponse.json({ error: "High-risk approval requires EDD, source-of-funds review, senior-management approval and a clear decision note." }, { status: 400 });
  if (decision !== "approved" && note.length < 10) return NextResponse.json({ error: "Add a clear client-facing reason." }, { status: 400 });
  const [application] = await getDb().select().from(kycApplications).where(eq(kycApplications.id, applicationId)).limit(1);
  if (!application) return NextResponse.json({ error: "KYC application not found." }, { status: 404 });

  // When a provider is connected its verdict is a precondition for approval:
  // a failed run cannot be approved at all, and a run that needs review or is
  // missing entirely requires the reviewer to say why they are overriding it.
  if (decision === "approved") {
    const provider = getKycProviderStatus();
    if (provider.configured) {
      if (application.providerOutcome === "fail") {
        return NextResponse.json({ error: `${provider.name} failed this application. It cannot be approved; request corrected evidence or reject it.` }, { status: 400 });
      }
      if (application.providerOutcome !== "pass" && note.length < 20) {
        const state = application.providerOutcome ? `returned "${application.providerOutcome}"` : "has not run";
        return NextResponse.json({ error: `${provider.name} ${state} for this application. Record how each check was verified manually before approving.` }, { status: 400 });
      }
    }
  }
  const now = Date.now();
  const db = getDb();
  const updated = await db.transaction(async (tx) => {
    // A resubmission between the read and the write changes updated_at, so the
    // decision does not land on evidence the reviewer never saw.
    const rows = await tx.update(kycApplications).set({
      status: decision,
      riskLevel,
      reviewNote: note || null,
      reviewChecks: JSON.stringify(checks),
      reviewedBy: user.email,
      reviewedAt: now,
      updatedAt: now,
    }).where(and(eq(kycApplications.id, applicationId), eq(kycApplications.updatedAt, application.updatedAt))).returning({ id: kycApplications.id });

    if (rows.length !== 1) return false;

    await tx.insert(kycReviewEvents).values({
      id: crypto.randomUUID(),
      applicationId,
      actorEmail: user.email,
      action: decision,
      note: note || null,
      checks: JSON.stringify(checks),
      createdAt: now,
    });
    return true;
  });

  if (!updated) return NextResponse.json({ error: "This application changed while you were reviewing it. Reload the queue and decide again." }, { status: 409 });
  return NextResponse.json({ ok: true, status: decision, reviewedAt: now });
}
