"use client";

import { FormEvent, useState } from "react";

const categories = [
  { id: "Account", icon: "◎", text: "Sign-in or profile" },
  { id: "KYC", icon: "▣", text: "Identity verification" },
  { id: "Paper trade", icon: "↗", text: "Orders or portfolio" },
  { id: "AI & bots", icon: "✦", text: "Signals or automation" },
  { id: "Risk & safety", icon: "◇", text: "Limits or emergency stop" },
  { id: "Bug", icon: "⌁", text: "Something is not working" },
];

export default function SupportPage() {
  const [category, setCategory] = useState("Account");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [urgency, setUrgency] = useState("Normal");
  const [attachment, setAttachment] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.includes("@") || subject.trim().length < 5 || details.trim().length < 20) { setError("Add a valid email, clear subject and at least 20 characters of detail."); return; }
    setError("");
    setSubmitted(true);
  };

  const reset = () => { setSubmitted(false); setCategory("Account"); setEmail(""); setSubject(""); setDetails(""); setUrgency("Normal"); setAttachment(""); };

  if (submitted) return <main className="support-shell"><header className="support-top"><a className="support-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>Support request</span><a href="/">×</a></header><section className="support-success"><div>✓</div><span>TICKET CREATED</span><h1>We’ve received<br/><em>your request.</em></h1><p>Your demo ticket <b>CY-SUPPORT-2026</b> is ready. A production support system would send confirmation to <b>{email}</b>.</p><section><article><small>CATEGORY</small><b>{category}</b></article><article><small>PRIORITY</small><b>{urgency}</b></article><article><small>STATUS</small><b>Open · Unassigned</b></article></section><div className="support-ticket-timeline"><span className="done"><i>✓</i><b>Request received</b><small>Just now</small></span><span><i>2</i><b>Support review</b><small>Pending</small></span><span><i>3</i><b>Resolution</b><small>Pending</small></span></div><nav><a href="/help">Return to Help Center</a><button onClick={reset}>Create another ticket</button></nav><small>Demo only · This request was not transmitted to a support system.</small></section></main>;

  return <main className="support-shell">
    <header className="support-top"><a className="support-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>Support request</span><a href="/help">×</a></header>
    <section className="support-hero"><span>CHATONYOU SUPPORT</span><h1>How can we help?</h1><p>Create a support request for account, KYC, paper-trading, AI or safety questions.</p></section>
    <div className="support-layout">
      <form className="support-form" onSubmit={submit}><header><span>01 · CHOOSE A TOPIC</span><h2>What do you need help with?</h2></header><div className="support-categories">{categories.map(item=><button type="button" key={item.id} className={category===item.id?"selected":""} onClick={()=>setCategory(item.id)}><i>{item.icon}</i><span><b>{item.id}</b><small>{item.text}</small></span><em>{category===item.id?"✓":""}</em></button>)}</div><header><span>02 · REQUEST DETAILS</span><h2>Tell us what happened.</h2></header><div className="support-fields"><label>Email address<input type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email"/></label><label>Urgency<select value={urgency} onChange={event=>setUrgency(event.target.value)}><option>Normal</option><option>High — account blocked</option><option>Critical — security concern</option></select></label><label className="wide">Subject<input value={subject} onChange={event=>setSubject(event.target.value)} placeholder="Short summary of the issue"/></label><label className="wide">Details<textarea value={details} onChange={event=>setDetails(event.target.value)} placeholder="What were you trying to do? What did you expect, and what happened instead?"/><small>{details.length}/500 characters</small></label></div><label className="support-upload"><input type="file" accept="image/*,.pdf,.txt" onChange={event=>setAttachment(event.target.files?.[0]?.name||"")}/><i>＋</i><span><b>{attachment||"Attach a screenshot or file"}</b><small>{attachment?"Selected for demo":"PNG, JPG, PDF or TXT · no passwords or private keys"}</small></span></label><div className="support-safe"><i>◇</i><p><b>Protect sensitive information</b><small>Never include passwords, OTPs, recovery phrases, private keys or full bank credentials.</small></p></div>{error?<p className="support-error" role="alert">{error}</p>:null}<footer><span>Typical first response · 1 business day</span><button type="submit">Create support ticket <b>→</b></button></footer></form>
      <aside className="support-aside"><section><span>QUICK HELP</span><a href="/trade/guide"><i>?</i><p><b>Interactive AI Guide</b><small>Understand product flows</small></p><em>→</em></a><a href="/kyc/status"><i>▣</i><p><b>KYC status</b><small>Review verification progress</small></p><em>→</em></a><a href="/trade/emergency-stop"><i>Ⅱ</i><p><b>Emergency Stop</b><small>Pause paper automation</small></p><em>→</em></a><a href="/risk-disclosure"><i>◇</i><p><b>Risk disclosure</b><small>Understand product risks</small></p><em>→</em></a></section><div><i>✉</i><p><b>Prefer email?</b><small>support@chatonyou.com</small></p><a href="mailto:support@chatonyou.com">Email us</a></div><p>Support will never ask you to transfer crypto or share account credentials.</p></aside>
    </div>
  </main>;
}
