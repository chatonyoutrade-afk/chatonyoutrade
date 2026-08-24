"use client";
import { useEffect,useMemo,useState } from "react";

type Range="7D"|"30D"|"ALL";
const rangeData:{[K in Range]:{balance:string,profit:string,return:string,trades:number,win:string,drawdown:string,points:string,labels:string[]}}={
 "7D":{balance:"₹10,214",profit:"+₹214",return:"+2.14%",trades:9,win:"66.7%",drawdown:"-0.9%",points:"0,114 70,106 140,110 210,84 280,91 350,65 420,71 490,43 560,48 630,22",labels:["15 Aug","17 Aug","19 Aug","Today"]},
 "30D":{balance:"₹10,842",profit:"+₹842",return:"+8.42%",trades:34,win:"61.7%",drawdown:"-2.8%",points:"0,125 55,117 110,99 165,108 220,81 275,88 330,60 385,72 440,44 495,53 550,28 605,36 660,16",labels:["22 Jul","01 Aug","10 Aug","Today"]},
 "ALL":{balance:"₹11,286",profit:"+₹1,286",return:"+12.86%",trades:58,win:"60.3%",drawdown:"-3.1%",points:"0,130 60,121 120,127 180,103 240,111 300,87 360,93 420,60 480,72 540,42 600,51 660,18",labels:["Started","Jun","Jul","Today"]}
};
const demoMarkets=[
 {coin:"BTC",trades:12,win:67,pnl:"+₹328",color:"#f4ad45"},
 {coin:"SOL",trades:9,win:66,pnl:"+₹246",color:"#63eeb0"},
 {coin:"ETH",trades:8,win:62,pnl:"+₹191",color:"#8996ff"},
 {coin:"BNB",trades:5,win:40,pnl:"+₹77",color:"#f1d26a"},
];
const hours=[32,48,74,57,86,64,44,69,93,62,38,51];

export default function Analytics(){
 const [range,setRange]=useState<Range>("30D"),[metric,setMetric]=useState("Return"),[toast,setToast]=useState(""),[live,setLive]=useState<((typeof rangeData)[Range]&{markets?:typeof demoMarkets;decisions?:number;noTrades?:number;open?:number})|null>(null);
 const data=live||rangeData[range],markets=live?.markets?.length?live.markets.map(item=>({...item,color:demoMarkets.find(base=>base.coin===item.coin)?.color||"#91a3ff"})):demoMarkets;
 useEffect(()=>{fetch(`/api/analytics?range=${range}`,{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(setLive).catch(()=>setLive(null))},[range]);
 const report=()=>{setToast("Paper performance report prepared");setTimeout(()=>setToast(""),2300)};
 const chartLabel=useMemo(()=>metric==="Return"?data.return:metric==="P&L"?data.profit:data.win,[metric,data]);
 return <main className="analytics-shell">
  <header className="ai-dash-top"><a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><div className="ai-dash-title"><b>Analytics</b><span><i/> Paper performance</span></div><div className="ai-dash-actions"><button><small>DEMO BALANCE</small><b>{data.balance}.00</b></button><a href="/trade/profile">NS</a></div></header>
  <div className="ai-dash-layout"><aside className="ai-dash-nav"><div><a href="/trade"><i>↗</i><span>Trade</span></a><a href="/trade/ai"><i>✦</i><span>AI Trader</span></a><a href="/trade/bots"><i>◉</i><span>Bots</span></a><a href="/trade/wallet"><i>W</i><span>Wallet</span></a><a href="/trade/portfolio"><i>◒</i><span>Portfolio</span></a><a href="/trade/history"><i>H</i><span>History</span></a><a className="active" href="/trade/analytics"><i>⌁</i><span>Analytics</span></a><a href="/trade/backtest"><i>◫</i><span>Backtest</span></a></div><a href="/trade/settings"><i>⚙</i><span>Settings</span></a></aside>
   <section className="analytics-main">
    <div className="analytics-head"><div><span>AI PAPER PERFORMANCE</span><h1>Know what is working.</h1><p>Returns, risk and every simulated decision—clearly measured.</p></div><div className="analytics-actions"><div>{(["7D","30D","ALL"] as Range[]).map(item=><button className={range===item?"active":""} onClick={()=>setRange(item)} key={item}>{item}</button>)}</div><button onClick={report}>⇩ Export report</button></div></div>
    <div className="analytics-metrics"><article className="analytics-account"><span>PAPER ACCOUNT</span><strong>{data.balance}</strong><small>Started with ₹10,000</small><div><b>{data.profit}</b><em>{data.return}</em></div></article><article><span>CLOSED TRADES</span><strong>{data.trades}</strong><small>Selected period</small></article><article><span>WIN RATE</span><strong>{data.win}</strong><small>Paper executions only</small></article><article><span>MAX DRAWDOWN</span><strong>{data.drawdown}</strong><small>Risk limit: 3% daily</small><i className="risk-ok">Within limit</i></article></div>
    <div className="analytics-grid">
     <article className="analytics-chart-card"><header><div><span>EQUITY CURVE</span><strong>{chartLabel}</strong></div><div>{["Return","P&L","Win rate"].map(item=><button className={metric===item?"active":""} onClick={()=>setMetric(item)} key={item}>{item}</button>)}</div></header><div className="analytics-chart"><div className="chart-grid-lines"><i/><i/><i/><i/></div><svg viewBox="0 0 660 150" preserveAspectRatio="none" aria-label={range+" "+metric+" chart"}><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#53e99e" stopOpacity=".28"/><stop offset="1" stopColor="#53e99e" stopOpacity="0"/></linearGradient></defs><polygon points={data.points+" 660,150 0,150"} fill="url(#area)"/><polyline points={data.points} fill="none" stroke="#55eba2" strokeWidth="3" vectorEffect="non-scaling-stroke"/><circle cx="660" cy={range==="7D"?22:range==="30D"?16:18} r="5" fill="#07100b" stroke="#55eba2" strokeWidth="3"/></svg><b className="chart-tag">{data.balance}</b></div><footer>{data.labels.map(item=><span key={item}>{item}</span>)}</footer></article>
     <article className="risk-score-card"><header><span>RISK HEALTH</span><i>Protected</i></header><div className="risk-ring"><div><strong>92</strong><small>/ 100</small></div></div><h2>Risk rules are healthy</h2><p>No daily loss breach. Every paper position used a protective stop.</p><div className="risk-checks"><span><i>✓</i>Stop-loss coverage<b>100%</b></span><span><i>✓</i>Avg. risk / trade<b>0.8%</b></span><span><i>✓</i>Max open positions<b>2 / 2</b></span></div><a href="/trade/settings">Edit risk rules →</a></article>
    </div>
    <div className="analytics-lower-grid">
     <article className="market-performance"><header><div><h2>Performance by market</h2><p>See where the paper strategy performs best.</p></div><span>NET P&amp;L</span></header><div className="market-list">{markets.map(item=><div key={item.coin}><span className="market-symbol" style={{background:item.color}}>{item.coin[0]}</span><strong>{item.coin}/USDT<small>{item.trades} trades</small></strong><div className="market-bar"><i style={{width:item.win+"%",background:item.color}}/></div><span>{item.win}% win</span><b>{item.pnl}</b></div>)}</div></article>
     <article className="decision-quality"><header><h2>Decision quality</h2><span>{range}</span></header><div className="quality-number"><strong>{live?.noTrades??148}</strong><span>NO TRADE decisions<small>{live?.decisions??148} quant decisions saved</small></span></div><div className="quality-bars"><span><i style={{width:"84%"}}/><b>High-confidence trades</b><em>84%</em></span><span><i style={{width:"71%"}}/><b>Target reached</b><em>71%</em></span><span><i style={{width:"100%"}}/><b>Server risk checks</b><em>100%</em></span></div><p>Skipping a weak setup is counted as a valid AI decision—not a missed trade.</p></article>
     <article className="active-hours"><header><h2>AI activity</h2><span>IST</span></header><p>Market scans by time of day</p><div className="hour-bars">{hours.map((height,index)=><i style={{height:height+"%"}} key={index}/>)}</div><footer><span>00:00</span><span>12:00</span><span>23:00</span></footer><div className="best-window"><i>✦</i><span><b>Best paper window</b><small>14:00–18:00 · 68% win rate</small></span></div></article>
    </div>
    <p className="ai-data-note">Analytics use your saved paper trades and quant decisions · Not investment advice · Simulated results do not guarantee future performance</p>
   </section>
  </div>
  {toast&&<div className="toast"><span>✓</span>{toast}</div>}
  <nav className="ai-mobile-nav"><a href="/trade"><i>↗</i>Trade</a><a href="/trade/ai"><i>✦</i>AI</a><a href="/trade/bots"><i>◉</i>Bots</a><a href="/trade/history"><i>H</i>History</a><a className="active" href="/trade/analytics"><i>⌁</i>Stats</a></nav>
 </main>
}
