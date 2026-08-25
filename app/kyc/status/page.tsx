"use client";

import { useCallback, useEffect, useState } from "react";

type KycApplication = {
  reference: string; userEmail: string; fullName: string; nationality: string; panLast4: string; mobileLast4: string; city: string; state: string; idType: string;
  status: "pending" | "action_required" | "approved" | "rejected"; riskLevel: string; reviewNote: string | null; submittedAt: number; reviewedAt: number | null;
};

const statusContent = {
  pending: { icon: "⌁", eyebrow: "KYC UNDER REVIEW", title: "Compliance review in progress.", description: "NEOCRAFT LLP’s authorised reviewer must complete identity, sanctions and risk checks.", badge: "Account remains locked", action: "Refresh status", tone: "review" },
  action_required: { icon: "!", eyebrow: "ACTION REQUIRED", title: "Your KYC needs an update.", description: "The reviewer needs corrected or clearer information before making a decision.", badge: "Account remains locked", action: "Update KYC", tone: "action" },
  approved: { icon: "✓", eyebrow: "KYC APPROVED", title: "Identity review completed.", description: "Your KYC was approved by an authorised NEOCRAFT LLP reviewer. Paper-account setup is now available.", badge: "Paper account eligible", action: "Continue account setup", tone: "verified" },
  rejected: { icon: "×", eyebrow: "KYC NOT APPROVED", title: "We could not approve this application.", description: "Review the reason below or contact support if this decision needs reconsideration.", badge: "Account remains locked", action: "Contact support", tone: "action" },
} as const;

export default function KycStatusPage() {
  const [application, setApplication] = useState<KycApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshed, setRefreshed] = useState(false);
  const [digiLocker, setDigiLocker] = useState<"not_started" | "pending" | "completed">("not_started");
  const load = useCallback(async () => {
    setError("");
    try {
      const [response, digiResponse] = await Promise.all([fetch("/api/kyc", { cache: "no-store" }), fetch("/api/kyc/digilocker", { cache: "no-store" })]);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "KYC status is unavailable.");
      setApplication(data.application);
      if (digiResponse.ok) { const digiData = await digiResponse.json(); setDigiLocker(digiData.completed ? "completed" : digiData.status === "not_started" ? "not_started" : "pending"); }
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : "KYC status is unavailable."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading) return <main className="system-state-shell compact"><a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><section><div className="system-loader"><i/><i/><i/></div><span>CHECKING KYC STATUS</span><h1>Loading securely…</h1><p>Retrieving your latest compliance-review decision.</p></section></main>;
  if (!application) return <main className="kyc-shell"><header className="kyc-top"><a href="/" className="kyc-logo"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>KYC Status</span><a href="/">×</a></header><section className="kyc-result"><div className="kyc-result-icon">1</div><span>NO APPLICATION YET</span><h1>Start your KYC.</h1><p>{error || "Submit the required verification information before paper-account activation."}</p><nav><a href="/kyc">Begin KYC</a><a href="/support">Get help</a></nav></section></main>;

  const content = statusContent[application.status] ?? statusContent.pending;
  const primaryAction = async () => {
    if (application.status === "action_required") { window.location.href = "/kyc"; return; }
    if (application.status === "approved") { window.location.href = "/setup"; return; }
    if (application.status === "rejected") { window.location.href = "/support"; return; }
    await load(); setRefreshed(true); window.setTimeout(() => setRefreshed(false), 2200);
  };
  const submitted = new Date(application.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const initials = application.fullName.split(/\s+/).slice(0, 2).map((item) => item[0]).join("").toUpperCase();

  return <main className="kyc-status-shell">
    <header className="kyc-top"><a href="/" className="kyc-logo"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>KYC Status</span><a href="/">×</a></header>
    <section className={`kyc-status-hero ${content.tone}`}><div className="kyc-status-orb"><i>{content.icon}</i></div><span>{content.eyebrow}</span><h1>{content.title}</h1><p>{content.description}</p><em>{content.badge}</em>{error ? <p className="kyc-error" role="alert">{error}</p> : null}<button type="button" onClick={primaryAction}>{content.action} <b>→</b></button></section>
    <section className="kyc-status-body"><div className="kyc-status-main"><header><span>APPLICATION PROGRESS</span><b>Reference · {application.reference}</b></header><div className="kyc-timeline">
      <article className="done"><i>✓</i><div><b>KYC submitted</b><p>Minimised identity and evidence-readiness metadata received.</p><small>{submitted}</small></div></article>
      <article className="done"><i>✓</i><div><b>Basic validation complete</b><p>PAN format, age, contact and evidence checkpoints passed.</p><small>System validation</small></div></article>
      <article className={digiLocker === "completed" || application.status === "approved" ? "done" : digiLocker === "pending" ? "active" : ""}><i>{digiLocker === "completed" || application.status === "approved" ? "✓" : "3"}</i><div><b>Document verification</b><p>{digiLocker === "completed" ? "DigiLocker consent received; the reviewer will validate document matches." : application.status === "approved" ? "Manual KYC review completed. Paid DigiLocker access is not required for paper trading." : "DigiLocker is optional. NEOCRAFT LLP can complete the manual KYC review without a paid provider connection."}</p><small>{digiLocker === "completed" ? "Consent completed" : application.status === "approved" ? "Manual review completed" : "Optional for paper trading"}</small>{application.status === "approved" && digiLocker !== "completed" ? <button type="button" className="kyc-inline-action" onClick={() => { window.location.href = "/setup"; }}>Continue free paper setup <b>→</b></button> : null}</div></article>
      <article className={application.status === "pending" ? "active" : application.status === "approved" ? "done" : "attention"}><i>{application.status === "pending" ? "⌁" : application.status === "approved" ? "✓" : "!"}</i><div><b>Authorised compliance review</b><p>{application.status === "pending" ? "Identity, sanctions and risk checks are pending." : application.reviewNote || "Reviewer decision recorded."}</p><small>{application.reviewedAt ? new Date(application.reviewedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Current step"}</small></div></article>
      <article className={application.status === "approved" ? "done" : ""}><i>{application.status === "approved" ? "✓" : "4"}</i><div><b>Paper-account decision</b><p>{application.status === "approved" ? "KYC approved; setup is unlocked." : "Account remains locked until approval."}</p><small>{application.status === "approved" ? "Approved" : "Pending"}</small></div></article>
    </div></div><aside className="kyc-status-side"><section><span>CLIENT</span><div><i>{initials || "CY"}</i><p><b>{application.fullName}</b><small>Individual · {application.nationality}</small></p></div><dl><dt>Email</dt><dd>{application.userEmail}</dd><dt>PAN</dt><dd>Ending {application.panLast4}</dd><dt>Mobile</dt><dd>Ending {application.mobileLast4}</dd><dt>Location</dt><dd>{application.city}, {application.state}</dd><dt>Identity type</dt><dd>{application.idType}</dd><dt>Risk rating</dt><dd>{application.riskLevel}</dd></dl></section><div className="kyc-status-lock"><i>◇</i><p><b>{application.status === "approved" ? "Paper setup unlocked" : "Account access locked"}</b><small>{application.status === "approved" ? "Continue to choose risk settings." : "Trading stays disabled until KYC approval."}</small></p></div></aside></section>
    <footer className="kyc-status-footer"><p>Approval is recorded by an authorised NEOCRAFT LLP reviewer. FIU-IND does not approve individual customer applications.</p><a href="/privacy">Privacy policy</a></footer>
    {refreshed ? <div className="toast"><span>✓</span>Status refreshed</div> : null}
  </main>;
}
