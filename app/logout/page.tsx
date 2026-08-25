"use client";
import { useEffect } from "react";

// Sign-out is a state change, so it is performed as a POST from this page
// rather than by following a link, which any third-party page could trigger.
export default function Logout(){
 useEffect(()=>{
  fetch("/api/auth/logout",{method:"POST"})
   .finally(()=>{window.location.href="/login"});
 },[]);
 return <main className="system-state-shell compact">
  <a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a>
  <section><div className="system-loader"><i/><i/><i/></div><span>SIGNING OUT</span><h1>Ending your session…</h1><p>Your saved paper portfolio and KYC record remain unchanged.</p></section>
 </main>;
}
