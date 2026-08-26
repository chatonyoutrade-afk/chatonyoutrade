"use client";

import { useEffect, useState } from "react";

type Check={id:string;title:string;detail:string;passed:boolean;href:string;action:string;category:string};
type Readiness={checks:Check[];summary:{technicalPassed:number;technicalTotal:number;technicalScore:number;technicalComplete:boolean;liveEligible:boolean;emergencyStop:boolean;testnetOrders:number;closedTestnetOrders:number};generatedAt:number};

export default function LiveLaunchGate(){
 const [data,setData]=useState<Readiness|null>(null),[error,setError]=useState("");
 useEffect(()=>{fetch("/api/readiness",{cache:"no-store"}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error||"Readiness status unavailable");return body}).then(setData).catch(reason=>setError(reason instanceof Error?reason.message:"Readiness status unavailable"))},[]);
 const summary=data?.summary,checks=data?.checks||[];
 return <main className="live-gate-shell"><header><a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span><i/> LIVE MODE LOCKED</span><a href="/trade/testnet">×</a></header><section><div className="live-lock"><i>◇</i><span/><b/></div><span>CONTROLLED LAUNCH GATE</span><h1>Real money is not<br/><em>an automatic upgrade.</em></h1><p>Technical readiness is measured from your authenticated KYC, Testnet, risk and audit records. Legal approval remains a separate human decision.</p>
 {error?<div className="live-readiness-error">{error}</div>:<div className="live-readiness-summary"><div><span>TECHNICAL READINESS</span><strong>{summary?.technicalScore??0}%</strong><small>{summary?.technicalPassed??0} of {summary?.technicalTotal??5} automated gates passed</small></div><div><span>TESTNET EVIDENCE</span><strong>{summary?.closedTestnetOrders??0}</strong><small>Closed protected-order samples</small></div><div><span>SAFETY STATE</span><strong className={summary?.emergencyStop?"paused":"safe"}>{summary?.emergencyStop?"PAUSED":"READY"}</strong><small>{summary?.emergencyStop?"Emergency stop is active":"Emergency control available"}</small></div></div>}
 <div className="live-checklist">{checks.length?checks.map((item,index)=><article className={item.passed?"done":""} key={item.id}><i>{item.passed?"✓":index+1}</i><span><b>{item.title}</b><small>{item.detail}</small></span><a href={item.href}>{item.passed?"Complete":item.action}</a></article>):<article><i>…</i><span><b>Checking saved readiness</b><small>KYC, risk, Testnet and audit records are being verified.</small></span><em>Loading</em></article>}</div>
 <div className="live-gate-actions"><a href={summary?.technicalComplete?"/trade/analytics":"/trade/testnet"}>{summary?.technicalComplete?"Review Testnet performance":"Continue Testnet validation"} <b>→</b></a><button disabled>Live execution unavailable</button></div><small>No production Binance endpoint is connected. No real order or withdrawal can be sent from this build.</small></section></main>
}
