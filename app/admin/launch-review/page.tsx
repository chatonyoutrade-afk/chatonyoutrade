import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requireUser } from "../../auth";
import { getDb } from "../../../db";
import { complianceEvidence, exchangeConnections, kycApplications, ownerSecurity, paperSettings, testnetOrders } from "../../../db/schema";
import { isKycAdmin } from "../../../lib/kyc-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Launch Review — NEOCRAFT LLP",
  description: "Restricted production-readiness evidence review for ChatOnYou Trade.",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ client?: string }> };

export default async function LaunchReviewPage({ searchParams }: PageProps) {
  const reviewer = await requireUser("/admin/launch-review");
  if (!isKycAdmin(reviewer)) return <main className="admin-kyc-shell"><header className="admin-kyc-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>NEOCRAFT LLP · LAUNCH CONTROL</span><a href="/">Exit</a></header><section className="admin-access-denied"><i>◇</i><span>RESTRICTED OPERATIONS</span><h1>Launch-review access required.</h1><p>Your signed-in email is not included in the server-side reviewer allowlist.</p><a href="/logout">Use another account</a></section></main>;

  const db = getDb();
  const applications = await db.select().from(kycApplications);
  const requested = (await searchParams).client?.trim().toLowerCase();
  const selected = applications.find(item => item.userEmail.toLowerCase() === requested) || applications.find(item => item.status === "approved") || applications[0];

  if (!selected) return <main className="admin-kyc-shell"><header className="admin-kyc-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>NEOCRAFT LLP · LAUNCH CONTROL</span><div><a href="/admin/kyc">KYC queue</a><a href="/logout">Sign out</a></div></header><section className="admin-access-denied"><i>◇</i><span>NO CLIENT EVIDENCE</span><h1>No KYC application found.</h1><p>A client must submit KYC before a launch-readiness pack can be assembled.</p><a href="/admin/kyc">Open KYC queue</a></section></main>;

  const [settingsRows, connections, securityRows, orders, evidenceRows] = await Promise.all([
    db.select().from(paperSettings).where(eq(paperSettings.userEmail, selected.userEmail)).limit(1),
    db.select().from(exchangeConnections).where(eq(exchangeConnections.userEmail, selected.userEmail)).limit(1),
    db.select().from(ownerSecurity).where(eq(ownerSecurity.userEmail, selected.userEmail)).limit(1),
    db.select().from(testnetOrders).where(eq(testnetOrders.userEmail, selected.userEmail)),
    db.select().from(complianceEvidence),
  ]);
  const settings = settingsRows[0], connection = connections[0], security = securityRows[0];
  const closed = orders.filter(item => item.status === "closed");
  const protectedOrders = orders.filter(item => Boolean(item.protectionOrderListId));
  const active = orders.filter(item => ["open", "protected", "unprotected", "pending"].includes(item.status));
  let spotPermission = false;
  try { spotPermission = (JSON.parse(connection?.permissions || "[]") as string[]).includes("SPOT"); } catch { /* Invalid evidence fails closed. */ }

  const checks = [
    { title: "KYC accepted", detail: selected.status === "approved" ? `${selected.reference} · reviewer decision recorded` : `Current status: ${selected.status.replace("_", " ")}`, passed: selected.status === "approved", href: "/admin/kyc" },
    { title: "Risk policy saved", detail: settings ? `${settings.maxRiskPct}% per trade · ${settings.dailyLossPct}% daily stop · ${settings.maxPositions} positions` : "No saved server-side risk policy", passed: Boolean(settings && settings.maxRiskPct <= 1 && settings.dailyLossPct <= 3 && settings.stopLossRequired && settings.takeProfitRequired && settings.dailyStopRequired && settings.volatilityProtection), href: "/trade/settings" },
    { title: "Spot Testnet verified", detail: connection?.environment === "testnet" ? `${connection.apiKeyHint} · last checked ${new Date(connection.lastCheckedAt).toLocaleDateString("en-IN")}` : "No verified Binance Spot Testnet connection", passed: Boolean(connection?.canTrade && connection.environment === "testnet" && spotPermission), href: "/trade/wallet" },
    { title: "Protected-order evidence", detail: `${closed.length} closed · ${protectedOrders.length} protection records · minimum 3 each`, passed: closed.length >= 3 && protectedOrders.length >= 3 && active.every(item => item.status === "protected" && Boolean(item.protectionOrderListId)), href: "/trade/history?tab=testnet" },
    { title: "Owner two-step verified", detail: security?.verifiedAt ? `Email possession verified ${new Date(security.verifiedAt).toLocaleDateString("en-IN")}` : "Owner email verification is not enabled", passed: Boolean(security?.enabled && security.verifiedAt), href: "/trade/profile?tab=security" },
  ];
  const passed = checks.filter(item => item.passed).length;
  const legal = [
    { category: "legal", text: "Qualified counsel confirms the proposed VDA service classification" },
    { category: "fiu", text: "FIU-IND registration/RE-ID and responsible-officer evidence is on file" },
    { category: "aml", text: "AML/CFT, sanctions, Travel Rule and record-retention policies are approved" },
    { category: "security", text: "CERT-In security audit and incident-response evidence is current" },
    { category: "operations", text: "Custody, exchange, tax and customer-funds operating model is independently reviewed" },
  ];

  return <main className="admin-kyc-shell launch-review-shell">
    <header className="admin-kyc-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>NEOCRAFT LLP · LAUNCH CONTROL</span><div><small>Authorised reviewer</small><b>{reviewer.email}</b><a href="/admin/kyc">KYC queue</a><a href="/logout">Sign out</a></div></header>
    <section className="launch-review-hero"><div><span>PRODUCTION READINESS PACK</span><h1>Evidence before execution.</h1><p>Technical checks are calculated from saved server records. External legal approvals remain human-controlled and cannot be cleared by this website.</p></div><article><small>AUTOMATED GATES</small><b>{passed}/{checks.length}</b><em>{passed === checks.length ? "Technical evidence complete" : "Action still required"}</em></article></section>
    <nav className="launch-client-tabs" aria-label="Client readiness packs">{applications.map(item => <a className={item.id === selected.id ? "active" : ""} href={`/admin/launch-review?client=${encodeURIComponent(item.userEmail)}`} key={item.id}><b>{item.fullName}</b><small>{item.userEmail} · {item.status.replace("_", " ")}</small></a>)}</nav>
    <section className="launch-review-grid">
      <div className="launch-review-panel"><header><span>AUTOMATED TECHNICAL EVIDENCE</span><b>{selected.reference}</b></header>{checks.map(item => <article className={item.passed ? "passed" : "blocked"} key={item.title}><i>{item.passed ? "✓" : "!"}</i><div><b>{item.title}</b><p>{item.detail}</p></div><a href={item.href}>{item.passed ? "Review" : "Resolve"}</a></article>)}</div>
      <aside className="launch-review-panel legal"><header><span>EXTERNAL SIGN-OFF EVIDENCE</span><b>Human-reviewed</b></header>{legal.map(item => { const evidence = evidenceRows.find(row => row.category === item.category && row.status === "reviewed" && (!row.expiresAt || row.expiresAt > Date.now())); return <article key={item.category} className={evidence ? "passed" : ""}><i>{evidence ? "✓" : "○"}</i><div><p>{item.text}</p>{evidence ? <small>{evidence.reference} · {evidence.issuer}</small> : null}</div></article> })}<div className="launch-legal-note"><b>Evidence required</b><p>Original signed evidence stays in the organisation’s controlled document system. A saved reference documents review but does not itself grant legal approval.</p><a href="/admin/compliance-evidence">Open evidence register →</a></div></aside>
    </section>
    <section className="launch-decision document-handoff"><div><span>CA DOCUMENT HANDOFF</span><h2>DECLARED AVAILABLE · VERIFICATION PENDING</h2><p>When the signed documents are received, record the FIU/RE-ID, legal classification, AML policy, CERT-In audit, tax opinion and custody/customer-funds operating evidence. Never upload API keys, passwords, seed phrases or private keys.</p></div><nav><a href="/admin/compliance-evidence">Open evidence register →</a></nav></section>\n    <section className="launch-decision"><div><span>FINAL SYSTEM DECISION</span><h2>LIVE EXECUTION REMAINS LOCKED</h2><p>{passed === checks.length ? "Technical evidence is ready for independent compliance and legal review." : `${checks.length - passed} automated gate${checks.length - passed === 1 ? "" : "s"} must still be resolved before external review.`}</p></div><nav><a href="/admin/readiness-drill">Run controlled pilot →</a><button disabled>Enable real-money trading</button></nav></section>
    <footer className="admin-kyc-footer">Review pack generated {new Date().toLocaleString("en-IN")} · No production exchange endpoint or withdrawal capability is enabled.</footer>
  </main>;
}
