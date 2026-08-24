import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { kycApplications } from "../../../db/schema";

export const dynamic = "force-dynamic";

const safeApplication = (application: typeof kycApplications.$inferSelect) => ({
  id: application.id,
  reference: application.reference,
  userEmail: application.userEmail,
  fullName: application.fullName,
  birthYear: application.birthYear,
  nationality: application.nationality,
  panLast4: application.panLast4,
  mobileLast4: application.mobileLast4,
  city: application.city,
  state: application.state,
  pincode: application.pincode,
  idType: application.idType,
  evidenceSummary: JSON.parse(application.evidenceSummary) as Record<string, boolean>,
  status: application.status,
  riskLevel: application.riskLevel,
  reviewNote: application.reviewNote,
  submittedAt: application.submittedAt,
  updatedAt: application.updatedAt,
  reviewedAt: application.reviewedAt,
});

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const [application] = await getDb().select().from(kycApplications).where(eq(kycApplications.userEmail, user.email)).limit(1);
  return NextResponse.json({ application: application ? safeApplication(application) : null });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const fullName = String(body.fullName ?? "").trim();
  const dob = String(body.dob ?? "");
  const birthYear = Number(dob.slice(0, 4));
  const pan = String(body.pan ?? "").trim().toUpperCase();
  const mobileDigits = String(body.mobile ?? "").replace(/\D/g, "");
  const city = String(body.city ?? "").trim();
  const state = String(body.state ?? "").trim();
  const pincode = String(body.pincode ?? "").trim();
  const nationality = String(body.nationality ?? "").trim();
  const idType = String(body.idType ?? "").trim();
  const evidence = body.evidence as Record<string, unknown> | undefined;
  const evidenceSummary = {
    identityDocumentSelected: Boolean(evidence?.identityDocumentSelected),
    addressDocumentSelected: Boolean(evidence?.addressDocumentSelected),
    selfieCheckReady: Boolean(evidence?.selfieCheckReady),
    bankCheckReady: Boolean(evidence?.bankCheckReady),
  };
  const valid = fullName.length >= 3 && birthYear >= 1900 && birthYear <= new Date().getUTCFullYear() - 18 && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan) && mobileDigits.length >= 10 && city.length >= 2 && state.length >= 2 && /^\d{6}$/.test(pincode) && nationality.length >= 2 && ["Aadhaar", "Passport", "Driving licence", "Voter ID"].includes(idType) && Object.values(evidenceSummary).every(Boolean) && body.consent === true && body.declaration === true;
  if (!valid) return NextResponse.json({ error: "Complete every required KYC field and verification checkpoint." }, { status: 400 });

  const db = getDb();
  const [existing] = await db.select().from(kycApplications).where(eq(kycApplications.userEmail, user.email)).limit(1);
  if (existing?.status === "approved") return NextResponse.json({ error: "Your KYC is already approved." }, { status: 409 });
  const now = Date.now();
  const id = existing?.id ?? crypto.randomUUID();
  const reference = existing?.reference ?? `KYC-${new Date(now).getUTCFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const values = {
    id,
    reference,
    userEmail: user.email,
    userDisplayName: user.displayName,
    fullName,
    birthYear,
    nationality,
    panLast4: pan.slice(-4),
    mobileLast4: mobileDigits.slice(-4),
    city,
    state,
    pincode,
    idType,
    evidenceSummary: JSON.stringify(evidenceSummary),
    status: "pending",
    riskLevel: "unrated",
    reviewNote: null,
    reviewChecks: "[]",
    reviewedBy: null,
    submittedAt: existing?.submittedAt ?? now,
    updatedAt: now,
    reviewedAt: null,
  };
  await db.insert(kycApplications).values(values).onConflictDoUpdate({ target: kycApplications.userEmail, set: values });
  return NextResponse.json({ ok: true, application: safeApplication(values) });
}

