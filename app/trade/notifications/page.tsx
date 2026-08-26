"use client";

import { useEffect, useMemo, useState } from "react";

type Alert = { id:string; asset:string; decision:"BUY"|"SELL"|"NO TRADE"; decisionId:string|null; confidence:number; status:string; createdAt:number; sentAt:number|null; readAt:number|null };
const filters=["All","Unread","BUY","SELL"] as const;
type Filter=typeof filters[number];

function age(timestamp:number){const diff=Math.max(0,Date.now()-timestamp),minutes=Math.floor(diff/60000);if(minutes<1)return"Just now";if(minutes<60)return`${minutes} min ago`;const hours=Math.floor(minutes/60);if(hours<24)return`${hours} hr ago`;return new Date(timestamp).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}

export default function NotificationsPage(){
 const [alerts,setAlerts]=useState<Alert[]>([]),[filter,setFilter]=useState<Filter>("All"),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{fetch("/api/notifications",{cache:"no-store"}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||"Alerts could not be loaded");setAlerts(data.alerts||[])}).catch(reason=>setError(reason instanceof Error?reason.message:"Alerts could not be loaded")).finally(()=>setLoading(false))},[]);
 const unread=alerts.filter(item=>!item.readAt).length;
 const visible=useMemo(()=>alerts.filter(item=>filter==="All"||filter==="Unread"?!item.readAt:item.decision===filter),[alerts,filter]);
 const markRead=async(id:string)=>{setAlerts(current=>current.map(item=>item.id===id?{...item,readAt:Date.now()}:item));await fetch("/api/notifications",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id})})};
 const markAll=async()=>{setAlerts(current=>current.map(item=>({...item,readAt:item.readAt||Date.now()})));await fetch("/api/notifications",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"mark_all_read"})})};
 return <main className="notification-shell"><header className="notification-top"><a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><div><b>Alert inbox</b><span><i/> Paper account</span></div><a href="/trade">×</a></header><section className="notification-main">
  <header className="notification-head"><div><span>SERVER-SAVED ACTIVITY</span><h1>Paper alerts</h1><p>High-confidence bot signals saved to your account and linked to their full decision audit.</p></div><div><a href="/trade/settings">Alert settings</a><button onClick={markAll} disabled={!unread}>Mark all as read</button></div></header>
  <div className="notification-summary"><article><i>●</i><span><small>UNREAD</small><b>{unread} alerts</b></span></article><article><i>✉</i><span><small>EMAIL</small><b>Connected</b></span></article><article><i>◇</i><span><small>EXECUTION</small><b>Manual confirmation</b></span></article></div>
  <nav className="notification-filters" aria-label="Notification filters">{filters.map(item=><button key={item} className={filter===item?"active":""} onClick={()=>setFilter(item)}>{item}{item==="Unread"&&unread?<i>{unread}</i>:null}</button>)}</nav>
  <div className="notification-layout"><section className="notification-list" aria-live="polite">{loading?<div className="notification-empty"><i>…</i><h2>Loading saved alerts</h2></div>:error?<div className="notification-empty"><i>!</i><h2>Alerts unavailable</h2><p>{error}</p></div>:visible.length?visible.map(item=><article key={item.id} className={item.readAt?"read":"unread"} onClick={()=>void markRead(item.id)}><i className="notice-ai">✦</i><div><header><span>AI PAPER ALERT</span><small>{age(item.createdAt)}</small></header><h2>{item.decision} {item.asset}/USDT · {item.confidence}%</h2><p>The daily server scan saved this signal. Review the reasoning and current live validation before preparing any paper order.</p><a href={item.decisionId?`/trade/ai/decision?id=${encodeURIComponent(item.decisionId)}`:"/trade/ai"}>Review saved decision <b>→</b></a></div>{!item.readAt?<em aria-label="Unread notification"/>:null}</article>):<div className="notification-empty"><i>✓</i><h2>You’re all caught up.</h2><p>No saved paper alerts match this filter.</p><button onClick={()=>setFilter("All")}>Show all alerts</button></div>}</section>
   <aside className="notification-side"><section><span>DELIVERY FLOW</span><div><i>1</i><p><b>Daily server scan</b><small>Active bot markets only</small></p><em>ON</em></div><div><i>2</i><p><b>Email + inbox</b><small>One alert per signal/day</small></p><em>ON</em></div><div><i>3</i><p><b>Manual review</b><small>No automatic order</small></p><em>SAFE</em></div></section><div className="notification-safety"><i>◇</i><p><b>Alerts never execute trades</b><small>A fresh live signal and server risk validation are required before manual paper confirmation.</small></p></div><a href="/trade/emergency-stop">Open Emergency Stop →</a></aside>
  </div><p className="notification-note">Real account data · Paper alerts only · No guaranteed returns</p>
 </section></main>
}
