import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUser } from "../../auth";
import { getDb } from "../../../db";
import { ensurePaperAccount } from "../../../db/paper-account";
import { exchangeConnections, kycApplications, testnetOrders } from "../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const db = getDb();
  const [{ settings }, applications, connections, orders] = await Promise.all([
    ensurePaperAccount(user.email, user.displayName),
    db.select().from(kycApplications).where(eq(kycApplications.userEmail, user.email)).limit(1),
    db.select().from(exchangeConnections).where(eq(exchangeConnections.userEmail, user.email)).limit(1),
    db.select().from(testnetOrders).where(eq(testnetOrders.userEmail, user.email)),
  ]);
  const application = applications[0], connection = connections[0], active = orders.filter(item => ["open", "protected", "unprotected", "pending"].includes(item.status)), closed = orders.filter(item => item.status === "closed"), protectedCount = orders.filter(item => Boolean(item.protectionOrderListId)).length, protectionHealthy = active.every(item => item.status === "protected" && Boolean(item.protectionOrderListId));
  let spotPermission = false;
  try { spotPermission = (JSON.parse(connection?.permissions || "[]") as string[]).includes("SPOT"); } catch { /* An invalid old snapshot fails the connection gate safely. */ }
  const checks = [
    { id: "kyc", title: "KYC identity review", detail: application?.status === "approved" ? `Approved · ${application.reference}` : application ? `Current status: ${application.status}` : "Submit and complete the KYC review", passed: application?.status === "approved", href: "/kyc/status", action: application ? "Review KYC" : "Start KYC", category: "technical" },
    { id: "risk", title: "Saved risk controls", detail: `Max risk ${settings.maxRiskPct}% · daily loss ${settings.dailyLossPct}% · ${settings.maxPositions} positions`, passed: settings.maxRiskPct <= 1 && settings.dailyLossPct <= 3 && settings.stopLossRequired && settings.takeProfitRequired && settings.dailyStopRequired && settings.volatilityProtection, href: "/trade/settings", action: "Review limits", category: "technical" },
    { id: "connection", title: "Binance Spot Testnet connection", detail: connection?.canTrade && connection.environment === "testnet" ? `Verified ${connection.apiKeyHint} · SPOT permission` : "Connect a trade-enabled Spot Testnet key", passed: Boolean(connection?.canTrade && connection.environment === "testnet" && spotPermission), href: "/trade/wallet", action: "Open Wallet", category: "technical" },
    { id: "validation", title: "Protected Testnet validation", detail: `${closed.length} closed · ${protectedCount} protected · minimum 3 closed required`, passed: closed.length >= 3 && protectedCount >= 3 && protectionHealthy, href: "/trade/testnet", action: "Continue Testnet", category: "technical" },
    { id: "audit", title: "Saved execution audit", detail: `${orders.length} Testnet record${orders.length === 1 ? "" : "s"} saved with server status`, passed: orders.length >= 3, href: "/trade/history?tab=testnet", action: "Open history", category: "technical" },
    { id: "owner", title: "Two-step owner verification", detail: "Production credentials and sensitive actions require independent MFA", passed: false, href: "/trade/profile", action: "Pending security integration", category: "external" },
    { id: "legal", title: "India legal and compliance sign-off", detail: "Qualified counsel must confirm VDA, AML, tax, custody and exchange obligations", passed: false, href: "/compliance#roadmap", action: "Open compliance", category: "external" },
  ];
  const technical = checks.filter(item => item.category === "technical"), passed = technical.filter(item => item.passed).length;
  return NextResponse.json({ checks, summary: { technicalPassed: passed, technicalTotal: technical.length, technicalScore: Math.round(passed / technical.length * 100), technicalComplete: passed === technical.length, liveEligible: false, emergencyStop: settings.emergencyStop, testnetOrders: orders.length, closedTestnetOrders: closed.length }, generatedAt: Date.now() });
}
