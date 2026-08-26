import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getUser } from "../../../auth";
import { getDb } from "../../../../db";
import { exchangeConnections, kycApplications, ownerSecurity, readinessDrills, testnetOrders, tradingEvents } from "../../../../db/schema";
import { isKycAdmin } from "../../../../lib/kyc-admin";

export const dynamic = "force-dynamic";
const manualIds = ["incident_contacts", "notification_delivery", "reconciliation", "recovery_review"] as const;

async function automaticChecks(email: string) {
  const db = getDb();
  const [applications, connections, securityRows, orders, safetyEvents] = await Promise.all([
    db.select().from(kycApplications).where(eq(kycApplications.userEmail, email)).limit(1),
    db.select().from(exchangeConnections).where(eq(exchangeConnections.userEmail, email)).limit(1),
    db.select().from(ownerSecurity).where(eq(ownerSecurity.userEmail, email)).limit(1),
    db.select().from(testnetOrders).where(eq(testnetOrders.userEmail, email)),
    db.select().from(tradingEvents).where(eq(tradingEvents.userEmail, email)).orderBy(desc(tradingEvents.createdAt)).limit(200),
  ]);
  const closed = orders.filter(item => item.status === "closed"), protectedCount = orders.filter(item => Boolean(item.protectionOrderListId)).length;
  const stop = safetyEvents.find(item => item.category === "safety" && item.action === "STOP");
  const resume = safetyEvents.find(item => item.category === "safety" && item.action === "RESUME" && (!stop || item.createdAt > stop.createdAt));
  return [
    { id: "kyc", label: "Approved KYC decision exists", passed: applications[0]?.status === "approved", detail: applications[0]?.reference || "No KYC application" },
    { id: "testnet", label: "Spot Testnet connection verified", passed: Boolean(connections[0]?.canTrade && connections[0]?.environment === "testnet"), detail: connections[0]?.apiKeyHint || "No connection" },
    { id: "orders", label: "Protected-order lifecycle sampled", passed: closed.length >= 3 && protectedCount >= 3, detail: `${closed.length} closed · ${protectedCount} protected` },
    { id: "owner", label: "Owner two-step verification enabled", passed: Boolean(securityRows[0]?.enabled && securityRows[0]?.verifiedAt), detail: securityRows[0]?.verifiedAt ? new Date(securityRows[0].verifiedAt).toLocaleDateString("en-IN") : "Not verified" },
    { id: "stop", label: "Emergency stop and safe resume exercised", passed: Boolean(stop && resume), detail: stop && resume ? `Last pair ${new Date(resume.createdAt).toLocaleDateString("en-IN")}` : "Run stop, then confirmed resume" },
  ];
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!isKycAdmin(user)) return NextResponse.json({ error: "Readiness reviewer access required" }, { status: 403 });
  const db = getDb(), applications = await db.select().from(kycApplications).orderBy(desc(kycApplications.updatedAt)).limit(200), drills = await db.select().from(readinessDrills).orderBy(desc(readinessDrills.conductedAt)).limit(100);
  return NextResponse.json({ applications: applications.map(item => ({ userEmail: item.userEmail, fullName: item.fullName, reference: item.reference, status: item.status })), drills: drills.map(item => ({ ...item, automaticChecks: JSON.parse(item.automaticChecks), manualChecks: JSON.parse(item.manualChecks) })) });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!isKycAdmin(user)) return NextResponse.json({ error: "Readiness reviewer access required" }, { status: 403 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>, userEmail = String(body.userEmail ?? "").trim().toLowerCase(), note = String(body.note ?? "").trim().slice(0, 1000);
  const manualChecks = Array.isArray(body.manualChecks) ? body.manualChecks.map(String).filter((item): item is typeof manualIds[number] => manualIds.includes(item as typeof manualIds[number])) : [];
  const [application] = await getDb().select().from(kycApplications).where(eq(kycApplications.userEmail, userEmail)).limit(1);
  if (!application) return NextResponse.json({ error: "Select a submitted KYC client." }, { status: 400 });
  if (manualIds.some(item => !manualChecks.includes(item))) return NextResponse.json({ error: "Complete every manual rehearsal check before recording the drill." }, { status: 400 });
  if (note.length < 30) return NextResponse.json({ error: "Add a useful drill note with observations and follow-up actions." }, { status: 400 });
  const checks = await automaticChecks(userEmail), passed = checks.every(item => item.passed), now = Date.now();
  const drill = { id: crypto.randomUUID(), userEmail, status: passed ? "passed" : "failed", automaticChecks: JSON.stringify(checks), manualChecks: JSON.stringify(manualChecks), note, conductedBy: user.email, conductedAt: now };
  await getDb().insert(readinessDrills).values(drill);
  return NextResponse.json({ ok: true, status: drill.status, checks, conductedAt: now }, { status: 201 });
}
