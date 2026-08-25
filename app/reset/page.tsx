"use client";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPassword(){
 const token=useSearchParams().get("token")||"";
 const [password,setPassword]=useState(""),[show,setShow]=useState(false);
 const [loading,setLoading]=useState(false),[notice,setNotice]=useState(""),[done,setDone]=useState(false);

 const submit=async(event:FormEvent)=>{
  event.preventDefault();setLoading(true);setNotice("");
  try{
   const response=await fetch("/api/auth/reset/confirm",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token,password})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||"This password could not be changed.");
   setDone(true);
  }catch(reason){setNotice(reason instanceof Error?reason.message:"This password could not be changed.");setLoading(false)}
 };

 if(done)return <main className="kyc-shell"><header className="kyc-top"><a href="/" className="kyc-logo"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>Password reset</span><a href="/">×</a></header><section className="kyc-result"><div className="kyc-result-icon">✓</div><span>PASSWORD CHANGED</span><h1>Your password is updated.<br/><em>Sign in to continue.</em></h1><p>Every other session was signed out, so only this new password works from now on.</p><nav><a href="/login">Sign in</a></nav></section></main>;

 return <main className="login-shell">
  <header className="login-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><div><span>Paper trading only</span><a href="/login">Back to sign in</a></div></header>
  <section className="login-layout">
   <aside className="login-story"><div className="login-grid"/><div className="login-orb"/><div className="login-story-copy"><span><i/> ACCOUNT SECURITY</span><h1>Choose a new<br/><em>password.</em></h1><p>The link works once and expires an hour after it was requested.</p></div></aside>
   <section className="login-panel">
    <div className="login-card">
     <header><span>RESET PASSWORD</span><h2>Set a new password.</h2><p>Signing out every device is part of the reset.</p></header>
     <form onSubmit={submit}>
      <label>New password<div><i>⌁</i><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 10 characters" autoComplete="new-password" required minLength={10}/><button type="button" onClick={()=>setShow(!show)}>{show?"Hide":"Show"}</button></div></label>
      {notice&&<div className="login-notice" role="alert"><i>!</i>{notice}</div>}
      <button className="login-submit" disabled={loading||!token}>{loading?<><i/>Saving…</>:<>Change password<span>→</span></>}</button>
     </form>
     {!token&&<p className="login-switch">This link is incomplete. <a href="/login">Request a new one</a></p>}
    </div>
    <footer><span>Protected by ChatOnYou</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></footer>
   </section>
  </section>
 </main>;
}
