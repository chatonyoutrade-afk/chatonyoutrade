"use client";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

type View = "login" | "signup" | "forgot" | "sent";

export default function Login(){
 const searchParams=useSearchParams();
 const requested=searchParams.get("return_to")||"";
 const returnTo=requested.startsWith("/")&&!requested.startsWith("//")?requested:"/trade";
 const [view,setView]=useState<View>(searchParams.get("view")==="signup"?"signup":"login");
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState("");
 const [show,setShow]=useState(false),[agree,setAgree]=useState(true),[loading,setLoading]=useState(false),[notice,setNotice]=useState("");

 const submit=async(event:FormEvent)=>{
  event.preventDefault();
  setLoading(true);setNotice("");
  if(view==="forgot"){
   try{
    const response=await fetch("/api/auth/reset",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"A reset link could not be requested.");
    setView("sent");
   }catch(reason){setNotice(reason instanceof Error?reason.message:"A reset link could not be requested.")}
   finally{setLoading(false)}
   return;
  }
  try{
   const endpoint=view==="signup"?"/api/auth/register":"/api/auth/login";
   const payload=view==="signup"?{email,password,displayName:name,accepted:agree}:{email,password};
   const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||"Sign-in could not be completed.");
   // A new account has no KYC yet, so send it to the KYC flow instead.
   window.location.href=view==="signup"?"/kyc":returnTo;
  }catch(reason){
   setNotice(reason instanceof Error?reason.message:"Sign-in could not be completed.");
   setLoading(false);
  }
 };

 return <main className="login-shell">
  <header className="login-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><div><span>Paper trading only</span><a href="/">Back to home</a></div></header>
  <section className="login-layout">
   <aside className="login-story"><div className="login-grid"/><div className="login-orb"/><div className="login-story-copy"><span><i/> AI PAPER TRADING</span><h1>Control the risk.<br/><em>Understand every trade.</em></h1><p>Start with virtual capital, transparent AI decisions and hard safety limits.</p></div><div className="login-demo-card"><header><span>AI PAPER ACCOUNT</span><i>LIVE DEMO</i></header><strong>₹10,842.00</strong><small>Started with ₹10,000</small><div className="login-mini-chart"><i/><b>+8.42%</b></div><footer><span>Win rate<b>61.7%</b></span><span>Drawdown<b>-2.8%</b></span><span>Risk status<b>Protected</b></span></footer></div><div className="login-proof"><span><i>◇</i><b>No real money</b></span><span><i>✦</i><b>Every AI decision explained</b></span><span><i>✓</i><b>Stop-loss protected</b></span></div></aside>
   <section className="login-panel">
    <div className="login-card">
     {view==="sent"?<div className="email-sent"><i>✓</i><span>CHECK YOUR EMAIL</span><h2>Reset link sent.</h2><p>If <b>{email}</b> has an account, a reset link is on its way. It expires in an hour and works once.</p><button onClick={()=>setView("login")}>Back to sign in</button></div>:<>
      <header><span>{view==="signup"?"CREATE PAPER ACCOUNT":view==="forgot"?"ACCOUNT RECOVERY":"WELCOME BACK"}</span><h2>{view==="signup"?"Start trading safely.":view==="forgot"?"Reset your password.":"Sign in to Trade."}</h2><p>{view==="signup"?"Set up your virtual balance and risk rules in minutes.":view==="forgot"?"Enter your email and we will send a link to choose a new password.":"Continue to your AI paper-trading workspace."}</p></header>
      <form onSubmit={submit}>
       {view==="signup"&&<label>Full name<div><i>◎</i><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name" required minLength={2}/></div></label>}
       <label>Email address<div><i>✉</i><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@email.com" autoComplete="email" required/></div></label>
       {view!=="forgot"&&<label>Password<div><i>⌁</i><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={view==="signup"?"At least 10 characters":"Enter your password"} autoComplete={view==="signup"?"new-password":"current-password"} required minLength={view==="signup"?10:1}/><button type="button" onClick={()=>setShow(!show)}>{show?"Hide":"Show"}</button></div></label>}
       {view==="login"&&<div className="login-options"><label><input type="checkbox" defaultChecked disabled/> Keep me signed in</label><button type="button" onClick={()=>setView("forgot")}>Forgot password?</button></div>}
       {view==="signup"&&<label className="terms-check"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/><span>I agree to the Terms and acknowledge that paper results do not guarantee future returns.</span></label>}
       {notice&&<div className="login-notice" role="alert"><i>!</i>{notice}</div>}
       <button className="login-submit" disabled={loading||(view==="signup"&&!agree)}>{loading?<><i/>{view==="signup"?"Creating account…":view==="forgot"?"Sending…":"Signing in…"}</>:<>{view==="signup"?"Create account":view==="forgot"?"Send reset link":"Sign in"}<span>→</span></>}</button>
      </form>
      {view==="forgot"?<button className="login-switch" onClick={()=>setView("login")}>← Back to sign in</button>:<p className="login-switch">{view==="signup"?"Already have an account?":"New to ChatOnYou Trade?"}<button onClick={()=>{setView(view==="signup"?"login":"signup");setNotice("")}}>{view==="signup"?"Sign in":"Create account"}</button></p>}
      <a className="guest-trade" href="/create-account"><i>◇</i><span><b>How the account flow works</b><small>Create account → KYC → paper-account setup.</small></span><em>→</em></a>
     </>}
    </div>
    <footer><span>Protected by ChatOnYou</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/risk-disclosure">Risk disclosure</a></div></footer>
   </section>
  </section>
 </main>
}
