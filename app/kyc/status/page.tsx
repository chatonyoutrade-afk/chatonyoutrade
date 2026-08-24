"use client";

import { useState } from "react";

type VerificationState = "review" | "action" | "verified";

const statusContent = {
  review: {
    icon: "⌁", eyebrow: "KYC UNDER REVIEW", title: "Verification in progress.", description: "Your KYC information has been received. Identity, address, selfie and bank-account checks are being reviewed.", badge: "Estimated review · 1–2 business days", action: "Refresh status", tone: "review",
  },
  action: {
    icon: "!", eyebrow: "ACTION REQUIRED", title: "One document needs attention.", description: "The address proof could not be read clearly. Upload a recent, complete document to continue verification.", badge: "Account remains locked", action: "Update KYC document", tone: "action",
  },
  verified: {
    icon: "✓", eyebrow: "KYC VERIFIED", title: "Identity verified.", description: "Your KYC checks are complete. You can now continue to paper-account setup and configure your safety limits.", badge: "Paper account eligible", action: "Continue account setup", tone: "verified",
  },
} as const;

export default function KycStatusPage() {
  const [state, setState] = useState<VerificationState>("review");
  const [refreshed, setRefreshed] = useState(false);
  const content = statusContent[state];

  const primaryAction = () => {
    if (state === "action") { window.location.href = "/kyc"; return; }
    if (state === "verified") { window.location.href = "/setup"; return; }
    setRefreshed(true);
    window.setTimeout(() => setRefreshed(false), 2200);
  };

  return <main className="kyc-status-shell">
    <header className="kyc-top"><a href="/" className="kyc-logo"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>KYC Status</span><a href="/">×</a></header>
    <section className={`kyc-status-hero ${content.tone}`}>
      <div className="kyc-status-orb"><i>{content.icon}</i></div>
      <span>{content.eyebrow}</span>
      <h1>{content.title}</h1>
      <p>{content.description}</p>
      <em>{content.badge}</em>
      <button type="button" onClick={primaryAction}>{content.action} <b>→</b></button>
    </section>

    <section className="kyc-status-body">
      <div className="kyc-status-main">
        <header><span>APPLICATION PROGRESS</span><b>Reference · KYC-DEMO-2026</b></header>
        <div className="kyc-timeline">
          <article className="done"><i>✓</i><div><b>KYC submitted</b><p>Personal details and verification evidence received.</p><small>25 Aug 2026 · 10:42 AM</small></div></article>
          <article className="done"><i>✓</i><div><b>Basic checks complete</b><p>PAN format, contact details and document availability checked.</p><small>25 Aug 2026 · 10:43 AM</small></div></article>
          <article className={state==="review"?"active":state==="action"?"attention":"done"}><i>{state==="review"?"⌁":state==="action"?"!":"✓"}</i><div><b>{state==="action"?"Document update required":"Identity verification"}</b><p>{state==="action"?"Upload a clearer address proof to restart this check.":state==="verified"?"Identity, address, selfie and bank name verified.":"Automated and provider verification is in progress."}</p><small>{state==="verified"?"Completed":"Current step"}</small></div></article>
          <article className={state==="verified"?"done":""}><i>{state==="verified"?"✓":"4"}</i><div><b>KYC decision</b><p>{state==="verified"?"KYC approved for paper-account onboarding.":"Final status appears after all checks complete."}</p><small>{state==="verified"?"Verified":"Pending"}</small></div></article>
        </div>
      </div>

      <aside className="kyc-status-side">
        <section><span>CLIENT</span><div><i>NS</i><p><b>Demo client</b><small>Individual · India</small></p></div><dl><dt>PAN</dt><dd>Format checked</dd><dt>Identity proof</dt><dd>{state==="verified"?"Verified":"Received"}</dd><dt>Address proof</dt><dd>{state==="action"?"Update required":state==="verified"?"Verified":"In review"}</dd><dt>Selfie</dt><dd>{state==="verified"?"Verified":"Received"}</dd><dt>Bank name</dt><dd>{state==="verified"?"Matched":"In review"}</dd></dl></section>
        <div className="kyc-status-lock"><i>◇</i><p><b>{state==="verified"?"Paper setup unlocked":"Account access locked"}</b><small>{state==="verified"?"Continue to select AI mode and safety limits.":"Trading access stays disabled until KYC is verified."}</small></p></div>
      </aside>
    </section>

    <section className="kyc-state-preview"><span>DEMO STATUS PREVIEW</span><p>Preview the three client-facing outcomes.</p><div><button className={state==="review"?"active":""} onClick={()=>setState("review")}>Under review</button><button className={state==="action"?"active":""} onClick={()=>setState("action")}>Action required</button><button className={state==="verified"?"active":""} onClick={()=>setState("verified")}>Verified</button></div></section>
    <footer className="kyc-status-footer"><p>This page shows a demo verification status. Production status must come from the approved KYC provider.</p><a href="/privacy">Privacy policy</a></footer>
    {refreshed?<div className="toast"><span>✓</span>Status is already up to date</div>:null}
  </main>;
}
