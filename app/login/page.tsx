"use client";
import { FormEvent,useState } from "react";

type View="login"|"signup"|"forgot"|"sent";
export default function Login(){
 const [view,setView]=useState<View>("login"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[show,setShow]=useState(false),[agree,setAgree]=useState(true),[loading,setLoading]=useState(false),[notice,setNotice]=useState("");
 const secureDestination=()=>view==="signup"?"/signin-with-chatgpt?return_to=%2Fkyc":"/signin-with-chatgpt?return_to=%2Ftrade";
 const submit=(e:FormEvent)=>{e.preventDefault();if(view==="forgot"){setView("sent");return}setLoading(true);setNotice("");window.location.href=secureDestination()};
 const google=()=>{setLoading(true);window.location.href=secureDestination()};
 return <main className="login-shell">
  <header className="login-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><div><span>Paper trading only</span><a href="/">Back to home</a></div></header>
  <section className="login-layout">
   <aside className="login-story"><div className="login-grid"/><div className="login-orb"/><div className="login-story-copy"><span><i/> AI PAPER TRADING</span><h1>Control the risk.<br/><em>Understand every trade.</em></h1><p>Start with virtual capital, transparent AI decisions and hard safety limits.</p></div><div className="login-demo-card"><header><span>AI PAPER ACCOUNT</span><i>LIVE DEMO</i></header><strong>₹10,842.00</strong><small>Started with ₹10,000</small><div className="login-mini-chart"><i/><b>+8.42%</b></div><footer><span>Win rate<b>61.7%</b></span><span>Drawdown<b>-2.8%</b></span><span>Risk status<b>Protected</b></span></footer></div><div className="login-proof"><span><i>◇</i><b>No real money</b></span><span><i>✦</i><b>Every AI decision explained</b></span><span><i>✓</i><b>Stop-loss protected</b></span></div></aside>
   <section className="login-panel">
    <div className="login-card">
     {view==="sent"?<div className="email-sent"><i>✓</i><span>CHECK YOUR EMAIL</span><h2>Reset link prepared.</h2><p>A demo reset message has been prepared for <b>{email}</b>. Email delivery will activate when authentication APIs are connected.</p><button onClick={()=>setView("login")}>Back to sign in</button></div>:<>
      <header><span>{view==="signup"?"CREATE PAPER ACCOUNT":view==="forgot"?"ACCOUNT RECOVERY":"WELCOME BACK"}</span><h2>{view==="signup"?"Start trading safely.":view==="forgot"?"Reset your password.":"Sign in to Trade."}</h2><p>{view==="signup"?"Set up your virtual balance and risk rules in minutes.":view==="forgot"?"Enter your email and we’ll prepare a secure reset link.":"Continue to your AI paper-trading workspace."}</p></header>
      {view!=="forgot"&&<><button className="google-login" onClick={google}><i>✦</i>Continue securely with ChatGPT<span>→</span></button><div className="login-divider"><i/><span>SECURE PLATFORM SIGN-IN</span><i/></div></>}
      <form onSubmit={submit}>
       {view==="signup"&&<label>Full name<div><i>◎</i><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name"/></div></label>}
       <label>Email address<div><i>✉</i><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@email.com" autoComplete="email"/></div></label>
       {view!=="forgot"&&<label>Password<div><i>⌁</i><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={view==="signup"?"Create a strong password":"Enter your password"} autoComplete={view==="signup"?"new-password":"current-password"}/><button type="button" onClick={()=>setShow(!show)}>{show?"Hide":"Show"}</button></div></label>}
       {view==="login"&&<div className="login-options"><label><input type="checkbox" defaultChecked/> Keep me signed in</label><button type="button" onClick={()=>setView("forgot")}>Forgot password?</button></div>}
       {view==="signup"&&<label className="terms-check"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/><span>I agree to the Terms and acknowledge that paper results do not guarantee future returns.</span></label>}
       {notice&&<div className="login-notice"><i>!</i>{notice}</div>}
       <button className="login-submit" disabled={loading}>{loading?<><i/>Opening secure sign-in…</>:<>{view==="signup"?"Create secure account":view==="forgot"?"Prepare reset link":"Continue with ChatGPT"}<span>→</span></>}</button>
      </form>
      {view==="forgot"?<button className="login-switch" onClick={()=>setView("login")}>← Back to sign in</button>:<p className="login-switch">{view==="signup"?"Already have an account?":"New to ChatOnYou Trade?"}<button onClick={()=>{setView(view==="signup"?"login":"signup");setNotice("")}}>{view==="signup"?"Sign in":"Create account"}</button></p>}
      <a className="guest-trade" href="/signin-with-chatgpt?return_to=%2Fkyc"><i>◇</i><span><b>New account flow</b><small>Secure sign-in → KYC → paper-account setup.</small></span><em>→</em></a>
     </>}
    </div>
    <footer><span>Protected by ChatOnYou</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/risk-disclosure">Risk disclosure</a></div></footer>
   </section>
  </section>
 </main>
}
