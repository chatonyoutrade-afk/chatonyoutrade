"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Verify(){
 const token=useSearchParams().get("token")||"";
 const [state,setState]=useState<"working"|"done"|"failed">("working");
 const [message,setMessage]=useState("");
 useEffect(()=>{
  if(!token){setState("failed");setMessage("This verification link is incomplete.");return}
  fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
   .then(async response=>{
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"This verification link could not be confirmed.");
    setState("done");
   })
   .catch(reason=>{setState("failed");setMessage(reason instanceof Error?reason.message:"This verification link could not be confirmed.")});
 },[token]);

 if(state==="working")return <main className="system-state-shell compact"><a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><section><div className="system-loader"><i/><i/><i/></div><span>CONFIRMING EMAIL</span><h1>Checking your link…</h1><p>This only takes a moment.</p></section></main>;

 return <main className="kyc-shell">
  <header className="kyc-top"><a href="/" className="kyc-logo"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>Email verification</span><a href="/">×</a></header>
  <section className="kyc-result">
   <div className="kyc-result-icon">{state==="done"?"✓":"!"}</div>
   <span>{state==="done"?"EMAIL CONFIRMED":"LINK NOT VALID"}</span>
   <h1>{state==="done"?<>Your email is confirmed.<br/><em>KYC is now open.</em></>:<>We could not confirm this link.<br/><em>Request a new one.</em></>}</h1>
   <p>{state==="done"?"Your address is verified, so you can start identity verification.":message}</p>
   <nav>{state==="done"?<a href="/kyc">Start KYC</a>:<a href="/login">Back to sign in</a>}<a href="/support">Get help</a></nav>
  </section>
 </main>;
}
