import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getUser } from "../../../auth";
import { getDb } from "../../../../db";
import { complianceEvidence } from "../../../../db/schema";
import { isKycAdmin } from "../../../../lib/kyc-admin";

export const dynamic = "force-dynamic";

const categories = ["legal", "fiu", "aml", "security", "operations"] as const;
const statuses = ["recorded", "reviewed", "expired", "superseded"] as const;

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!isKycAdmin(user)) return NextResponse.json({ error: "Compliance reviewer access required" }, { status: 403 });
  const evidence = await getDb().select().from(complianceEvidence).orderBy(desc(complianceEvidence.updatedAt)).limit(250);
  return NextResponse.json({ evidence });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!isKycAdmin(user)) return NextResponse.json({ error: "Compliance reviewer access required" }, { status: 403 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const category = String(body.category ?? "").toLowerCase();
  const status = String(body.status ?? "recorded").toLowerCase();
  const title = String(body.title ?? "").trim().slice(0, 140);
  const reference = String(body.reference ?? "").trim().slice(0, 140);
  const issuer = String(body.issuer ?? "").trim().slice(0, 140);
  const note = String(body.note ?? "").trim().slice(0, 800);
  const documentDate = body.documentDate ? Date.parse(String(body.documentDate)) : null;
  const expiresAt = body.expiresAt ? Date.parse(String(body.expiresAt)) : null;
  if (!categories.includes(category as typeof categories[number]) || !statuses.includes(status as typeof statuses[number])) return NextResponse.json({ error: "Choose a valid evidence category and review state." }, { status: 400 });
  if (title.length < 4 || reference.length < 3 || issuer.length < 3) return NextResponse.json({ error: "Add a clear title, controlled-document reference and issuer." }, { status: 400 });
  if (documentDate !== null && !Number.isFinite(documentDate)) return NextResponse.json({ error: "Document date is invalid." }, { status: 400 });
  if (expiresAt !== null && !Number.isFinite(expiresAt)) return NextResponse.json({ error: "Expiry date is invalid." }, { status: 400 });
  if (status === "reviewed" && note.length < 20) return NextResponse.json({ error: "Reviewed evidence requires a short note explaining what was checked." }, { status: 400 });
  const now = Date.now();
  const record = { id: crypto.randomUUID(), category, title, reference, issuer, status, documentDate, expiresAt, note: note || null, addedBy: user.email, createdAt: now, updatedAt: now };
  await getDb().insert(complianceEvidence).values(record);
  return NextResponse.json({ ok: true, evidence: record }, { status: 201 });
}
