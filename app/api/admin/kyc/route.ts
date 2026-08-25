import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getUser } from "../../../auth";
import { getD1, getDb } from "../../../../db";
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
  const eventId = crypto.randomUUID();
  const d1 = getD1();
  const [updateResult, eventResult] = await d1.batch([
    d1.prepare("UPDATE kyc_applications SET status = ?, risk_level = ?, review_note = ?, review_checks = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ? AND updated_at = ?").bind(decision, riskLevel, note || null, JSON.stringify(checks), user.email, now, now, applicationId, application.updatedAt),
    d1.prepare("INSERT INTO kyc_review_events (id, application_id, actor_email, action, note, checks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(eventId, applicationId, user.email, decision, note || null, JSON.stringify(checks), now),
  ]);
  // A resubmission between the read and the write changes updated_at, so the
  // decision does not land on evidence the reviewer never saw.
  if (Number(updateResult.meta.changes) !== 1 || Number(eventResult.meta.changes) !== 1) return NextResponse.json({ error: "This application changed while you were reviewing it. Reload the queue and decide again." }, { status: 409 });
  return NextResponse.json({ ok: true, status: decision, reviewedAt: now });
}
