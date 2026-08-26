import type { Metadata } from "next";
import { requireUser } from "../admin/auth";
import { isKycAdmin } from "../../lib/kyc-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compliance Workspace — NEOCRAFT LLP",
  description: "Restricted internal preparation workspace for ChatOnYou Trade.",
  robots: { index: false, follow: false },
};

const readyNow = [
  { title: "Service facts pack", status: "Internal draft ready", text: "Paper trading and Binance Spot Testnet are the current product scope. Real deposits, withdrawals, custody and production execution remain disabled.", items: ["Business and service description", "Non-custodial product boundary", "Systems-demonstration notes"] },
  { title: "AML/CFT working pack", status: "Internal draft ready", text: "The control framework can be prepared now, but board approval and independent review remain external actions.", items: ["Customer risk-rating and CDD workflow", "Sanctions/PEP alert escalation", "Travel Rule, STR and five-year record procedures"] },
  { title: "Custody and customer-funds model", status: "Boundary documented", text: "The present operating model does not accept, hold, pool or transfer customer money or VDAs.", items: ["No hosted wallets or private-key custody", "Future segregation and daily reconciliation design", "Maker-checker and exception workflow"] },
  { title: "Security preparation", status: "Checklist ready", text: "Operational security controls can be documented and tested before the independent CERT-In audit.", items: ["Credential-vault and access review", "Incident detection, containment and evidence plan", "Backup, recovery and audit-trail checks"] },
  { title: "Tax review brief", status: "Questions ready for CA", text: "GST registration is recorded. Product-specific treatment must be confirmed by the CA before live services.", items: ["Fee invoice and GST mapping", "VDA TDS/withholding questions", "Period-end tax reconciliation design"] },
  { title: "Production KYC requirements", status: "Vendor checklist ready", text: "Provider due diligence can be completed now; production activation needs an executed agreement and verified credentials.", items: ["PAN, identity, liveness and bank-name checks", "AML/sanctions screening and escalation", "DPA, retention, deletion and breach obligations"] },
];

const external = [
  { title: "Signed legal classification opinion", owner: "VDA/fintech lawyer" },
  { title: "FIU-IND registration, RE-ID and officer evidence", owner: "NEOCRAFT LLP + FIU-IND" },
  { title: "Approved AML/CFT policy and independent review", owner: "Board / compliance professional" },
  { title: "CERT-In empanelled security-audit report", owner: "CERT-In empanelled auditor" },
  { title: "Signed tax, custody and customer-funds opinion", owner: "CA + legal/control reviewer" },
  { title: "Executed production KYC-provider agreement", owner: "Approved KYC/AML provider" },
];

export default async function WorkspacePage() {
  const reviewer = await requireUser("/workspace");
  if (!isKycAdmin(reviewer)) return <main className="admin-kyc-shell"><header className="admin-kyc-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>KODO · WORKSPACE AUDIT</span><a href="/">Exit</a></header><section className="admin-access-denied"><i>◇</i><span>RESTRICTED OPERATIONS</span><h1>Workspace access required.</h1><p>Your signed-in email is not included in the authorised reviewer allowlist.</p><a href="/logout">Use another account</a></section></main>;

  return <main className="admin-kyc-shell launch-review-shell">
    <header className="admin-kyc-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>KODO · /WORKSPACE AUDIT</span><div><small>Authorised reviewer</small><b>{reviewer.email}</b><a href="/admin/launch-review">Launch review</a><a href="/logout">Sign out</a></div></header>

    <section className="launch-review-hero"><div><span>INTERNAL PREPARATION WORKSPACE</span><h1>Do today. Verify externally tomorrow.</h1><p>Internal drafts and technical preparation are separated from legal, regulatory, tax and independent-review evidence. Nothing on this page grants approval.</p></div><article><small>WORKSTREAMS PREPARED</small><b>{readyNow.length}/{readyNow.length}</b><em>External sign-offs still pending</em></article></section>

    <section className="launch-review-grid">
      <div className="launch-review-panel"><header><span>WHAT WE CAN COMPLETE NOW</span><b>Internal preparation</b></header>{readyNow.map((item,index)=><article className="passed" key={item.title}><i>✓</i><div><b>{String(index+1).padStart(2,"0")} · {item.title}</b><p>{item.text}</p><small>{item.status} · {item.items.join(" · ")}</small></div></article>)}</div>
      <aside className="launch-review-panel legal"><header><span>WHAT NEEDS EXTERNAL EVIDENCE</span><b>0/{external.length} verified here</b></header>{external.map((item,index)=><article key={item.title}><i>○</i><div><p>{String(index+1).padStart(2,"0")} · {item.title}</p><small>Owner: {item.owner}</small></div></article>)}<div className="launch-legal-note"><b>Safe document boundary</b><p>Store originals in NEOCRAFT LLP’s controlled document system. The website register stores references and review metadata only—never passwords, API secrets, private keys, seed phrases or complete Aadhaar details.</p></div></aside>
    </section>

    <section className="launch-decision"><div><span>NEXT ACTIONS</span><h2>PREPARED FOR DOCUMENT HANDOFF</h2><p>Technical preparation may continue in paper/Testnet mode. Real-money execution stays locked until every external item is independently verified.</p></div><nav><a href="/admin/compliance-evidence">Evidence register →</a><a href="/admin/readiness-drill">Controlled pilot →</a><a href="/admin/launch-review">Launch review →</a></nav></section>

    <footer className="admin-kyc-footer">KODO workspace · Internal preparation only · No regulatory, legal, tax or production-trading approval is claimed.</footer>
  </main>;
}
