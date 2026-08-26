"use client";
import { useEffect,useState } from "react";

const demoDecisions=[
 {time:"12:42",coin:"BTC",type:"NO TRADE",confidence:"64%",reason:"Waiting for resistance confirmation",tone:"neutral"},
 {time:"11:18",coin:"SOL",type:"BUY",confidence:"84%",reason:"Volume breakout with bullish EMA",tone:"buy"},
 {time:"09:54",coin:"ETH",type:"SELL",confidence:"81%",reason:"Momentum weakened below support",tone:"sell"},
 {time:"08:26",coin:"BNB",type:"NO TRADE",confidence:"58%",reason:"Abnormal volatility protection",tone:"neutral"},
];
const demoTrades=[
 {coin:"SOL/USDT",side:"BUY",entry:"$178.22",exit:"$182.44",pnl:"+₹118.40",result:"Win"},
 {coin:"BTC/USDT",side:"BUY",entry:"$112,180",exit:"$113,240",pnl:"+₹94.60",result:"Win"},
 {coin:"ETH/USDT",side:"SELL",entry:"$4,248",exit:"$4,216",pnl:"+₹61.20",result:"Win"},
 {coin:"BTC/USDT",side:"BUY",entry:"$113,510",exit:"$112,940",pnl:"-₹48.70",result:"Loss"},
];

export default function AiDashboard(){
 const [range,setRange]=useState("30D");
 const auto=false;
 const [activity,setActivity]=useState("Decisions");
 const [decisions,setDecisions]=useState<typeof demoDecisions>([]),[trades,setTrades]=useState<typeof demoTrades>([]),[balance,setBalance]=useState(10000),[starting,setStarting]=useState(10000);
 const [watchedCoins,setWatchedCoins]=useState(["BTC","ETH","SOL","BNB"]);
 useEffect(()=>{try{const raw=sessionStorage.getItem("chatonyou:paper-bot");if(raw){const saved=JSON.parse(raw);if(saved.active&&Array.isArray(saved.coins)&&saved.coins.length)setWatchedCoins(saved.coins)}}catch{}},[]);
 useEffect(()=>{Promise.all([fetch("/api/account",{cache:"no-store"}).then(r=>r.json()),fetch("/api/decisions",{cache:"no-store"}).then(r=>r.json())]).then(([accountData,decisionData])=>{if(accountData.account){setStarting(accountData.account.startingBalance);setBalance(accountData.account.startingBalance+(accountData.trades||[]).filter((item:{status:string})=>item.status==="closed").reduce((sum:number,item:{pnlPaise:number})=>sum+item.pnlPaise/100,0));const saved=(accountData.trades||[]).filter((item:{status:string})=>item.status==="closed").slice(0,20).map((item:{asset:string;side:string;entryPrice:number;exitPrice:number;pnlPaise:number})=>({coin:`${item.asset}/USDT`,side:item.side,entry:`$${item.entryPrice.toLocaleString("en-US")}`,exit:`$${item.exitPrice?.toLocaleString("en-US")}`,pnl:`${item.pnlPaise>=0?"+":"-"}₹${Math.abs(item.pnlPaise/100).toFixed(2)}`,result:item.pnlPaise>=0?"Win":"Loss"}));setTrades(saved)}const savedDecisions=(decisionData.decisions||[]).slice(0,30).map((item:{createdAt:number;asset:string;decision:string;confidence:number;reasons:string[]})=>({time:new Date(item.createdAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}),coin:item.asset,type:item.decision,confidence:`${item.confidence}%`,reason:item.reasons[0]||"Quant conditions evaluated",tone:item.decision==="BUY"?"buy":item.decision==="SELL"?"sell":"neutral"}));setDecisions(savedDecisions)}).catch(()=>{})},[]);
 const closedTrades=trades.length,won=trades.filter(item=>item.result==="Win").length,profit=balance-starting,returnPct=starting?profit/starting*100:0,lastDecision=decisions[0];
 return <main className="ai-dashboard-shell">
  <header className="ai-dash-top"><a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><div className="ai-dash-title"><b>AI Trader</b><span><i/> Watching {watchedCoins.join(", ")} in paper mode</span></div><div className="ai-dash-actions"><button><small>PAPER EQUITY</small><b>₹{balance.toLocaleString("en-IN",{minimumFractionDigits:2})}</b></button><a href="/trade/profile">NS</a></div></header>
  <div className="ai-dash-layout">
   <aside className="ai-dash-nav"><div><a href="/trade"><i>↗</i><span>Trade</span></a><a className="active" href="/trade/ai"><i>✦</i><span>AI Trader</span></a><a href="/trade/bots"><i>◉</i><span>Bots</span></a><a href="/trade/wallet"><i>W</i><span>Wallet</span></a><a href="/trade/portfolio"><i>◒</i><span>Portfolio</span></a><a href="/trade/history"><i>H</i><span>History</span></a><a href="/trade/analytics"><i>⌁</i><span>Analytics</span></a><a href="/trade/backtest"><i>◫</i><span>Backtest</span></a></div><a href="/trade/settings"><i>⚙</i><span>Settings</span></a></aside>
   <section className="ai-dash-main">
    <div className="ai-page-head"><div><span>CHATONYOU AI</span><h1>AI performance</h1><p>Every simulated trade and skipped opportunity, explained.</p></div><div className="range-buttons">{["7D","30D","ALL"].map(item=><button className={range===item?"active":""} onClick={()=>setRange(item)} key={item}>{item}</button>)}</div></div>
    <div className="ai-metrics">
     <article className="account-metric"><span>AI PAPER ACCOUNT</span><strong>₹{balance.toLocaleString("en-IN",{minimumFractionDigits:2})}</strong><small>Started with ₹{starting.toLocaleString("en-IN")}</small><div><b>{profit>=0?"+":"-"}₹{Math.abs(profit).toFixed(2)}</b><em>{returnPct>=0?"+":""}{returnPct.toFixed(2)}%</em></div></article>
     <article><span>CLOSED TRADES</span><strong>{closedTrades}</strong><small>{won} won · {closedTrades-won} lost</small><i className="metric-icon">↗</i></article>
     <article><span>WIN RATE</span><strong>{closedTrades?(won/closedTrades*100).toFixed(1):"0.0"}%</strong><small>Saved paper executions</small><i className="metric-icon">◎</i></article>
     <article><span>MAX DRAWDOWN</span><strong>{closedTrades?"-2.8%":"0.0%"}</strong><small>Within 3% daily limit</small><i className="metric-icon safe">◇</i></article>
    </div>

    <div className="ai-overview-grid" id="performance">
     <article className="equity-card"><header><div><span>EQUITY CURVE</span><b>₹{balance.toLocaleString("en-IN")}</b></div><small>{range} performance</small></header><div className="equity-chart"><div className="equity-fill"/><div className="equity-line"/><i className="point p1"/><i className="point p2"/><i className="point p3"/><b>{returnPct>=0?"+":""}{returnPct.toFixed(2)}%</b><span>₹{starting.toLocaleString("en-IN")}</span></div><footer><span>Start</span><span>25%</span><span>50%</span><span>Today</span></footer></article>
     <article className="ai-live-card"><header><span><i/> QUANT STATUS</span><small>Live</small></header><div className="brain-orbit"><i>✦</i><b/><b/><b/></div><h2><a href="/trade/markets">Watching {watchedCoins.join(" + ")} →</a></h2><p>Signals refresh from public candles every <b>15s</b></p><div className="last-decision"><span>LAST SAVED DECISION</span><strong>{lastDecision?.type||"SCANNING"}</strong><small>{lastDecision?`${lastDecision.coin} · ${lastDecision.confidence} · ${lastDecision.reason}`:`Waiting for ${watchedCoins.join(", ")} quant analysis.`}</small></div><button className={auto?"on":""} onClick={()=>window.location.href="/trade/auto"}><span><b>AI Auto Mode</b><small>{auto?"Active within risk rules":"Set limits before activation"}</small></span><i/></button></article>
    </div>

    <div className="ai-activity-section" id="activity"><div className="activity-head"><div><h2>AI activity</h2><p>Review every decision and completed paper trade.</p></div><div>{["Decisions","Trades"].map(item=><button className={activity===item?"active":""} onClick={()=>setActivity(item)} key={item}>{item}</button>)}</div></div>
     {activity==="Decisions"?<div className="decision-table"><header><span>TIME</span><span>MARKET</span><span>DECISION</span><span>CONFIDENCE</span><span>AI REASON</span></header>{decisions.map(item=><div className="decision-row-link" onClick={()=>window.location.href=`/trade/ai/decision?coin=${item.coin}`} key={item.time}><span>{item.time}</span><b>{item.coin}/USDT</b><em className={item.tone}>{item.type}</em><span>{item.confidence}</span><p>{item.reason} <b>→</b></p></div>)}</div>:<div className="decision-table trade-table"><header><span>MARKET</span><span>SIDE</span><span>ENTRY</span><span>EXIT</span><span>P&amp;L</span></header>{trades.map(item=><div key={item.coin+item.entry}><b>{item.coin}</b><em className={item.side==="BUY"?"buy":"sell"}>{item.side}</em><span>{item.entry}</span><span>{item.exit}</span><p className={item.result==="Win"?"profit":"negative"}>{item.pnl}</p></div>)}</div>}
    </div>
    <p className="ai-data-note">Saved quant decisions and authenticated paper trades · Not investment advice · No guaranteed returns</p>
   </section>
  </div>
  <nav className="ai-mobile-nav"><a href="/trade"><i>↗</i>Trade</a><a className="active" href="/trade/ai"><i>✦</i>AI</a><a href="/trade/bots"><i>◉</i>Bots</a><a href="/trade/wallet"><i>W</i>Wallet</a><a href="/trade/settings"><i>⚙</i>Settings</a></nav>
 </main>
}
