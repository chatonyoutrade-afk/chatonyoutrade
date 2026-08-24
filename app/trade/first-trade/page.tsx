"use client";

import { useState } from "react";

const markets = [
  { id: "BTC", name: "Bitcoin", price: 113240, change: "+2.84%", color: "#f5a623" },
  { id: "ETH", name: "Ethereum", price: 4216, change: "+1.36%", color: "#8293ff" },
  { id: "SOL", name: "Solana", price: 182.44, change: "+4.21%", color: "#87eabb" },
  { id: "BNB", name: "BNB", price: 846.2, change: "+0.92%", color: "#f0cf56" },
];
const steps = ["Market", "AI signal", "Risk", "Review", "Complete"];

export default function FirstTradePage() {
  const [step, setStep] = useState(0);
  const [asset, setAsset] = useState("BTC");
  const [amount, setAmount] = useState(500);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState("");
  const market = markets.find((item) => item.id === asset) ?? markets[0];
  const stop = market.price * 0.988;
  const target = market.price * 1.03;
  const plannedRisk = amount * 0.012;

  const next = () => { setError(""); setStep((value) => Math.min(4, value + 1)); };
  const back = () => { setError(""); setStep((value) => Math.max(0, value - 1)); };
  const execute = () => {
    if (amount < 100 || amount > 5000) { setError("Choose a paper allocation between ₹100 and ₹5,000."); return; }
    setExecuting(true);
    window.setTimeout(() => { setExecuting(false); setStep(4); }, 900);
  };

  return <main className="first-trade-shell">
    <header className="first-trade-top"><a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><div><b>Guided first trade</b><span><i/> Paper mode</span></div><a href="/trade">Skip guide</a></header>
    <div className="first-trade-progress">{steps.map((item,index)=><div key={item} className={index===step?"active":index<step?"done":""}><i>{index<step?"✓":index+1}</i><span>{item}</span>{index<steps.length-1?<b/>:null}</div>)}</div>
    <section className="first-trade-card">
      {step===0?<div className="first-step"><header><span>STEP 1 OF 5 · CHOOSE MARKET</span><h1>Pick your first market.</h1><p>Start with one asset. You can explore every supported market after this guide.</p></header><div className="first-markets">{markets.map(item=><button key={item.id} className={asset===item.id?"selected":""} onClick={()=>setAsset(item.id)}><i style={{background:item.color}}>{item.id[0]}</i><span><b>{item.id}/USDT</b><small>{item.name}</small></span><em>${item.price.toLocaleString("en-US")}<small>{item.change}</small></em><strong>{asset===item.id?"✓":""}</strong></button>)}</div><div className="first-note"><i>◇</i><span><b>No real funds</b><small>This guide uses your virtual ₹10,000 paper balance.</small></span></div></div>:null}
      {step===1?<div className="first-step"><header><span>STEP 2 OF 5 · AI SIGNAL</span><h1>Understand the decision.</h1><p>AI explains its view before you choose whether to continue.</p></header><div className="first-signal"><div><span>LIVE PAPER SIGNAL</span><strong>BUY</strong><p>{asset}/USDT</p></div><div className="first-confidence"><b>84<small>%</small></b><span><i/></span><small>HIGH CONFIDENCE</small></div></div><div className="first-reasons"><article><i>✓</i><span><b>Trend</b><small>Price is holding above the short-term EMA structure.</small></span></article><article><i>✓</i><span><b>Momentum</b><small>Buying pressure is stronger than the recent average.</small></span></article><article><i>✓</i><span><b>Volume</b><small>Volume supports the current breakout attempt.</small></span></article></div><div className="first-warning"><i>!</i><p><b>AI can be wrong.</b><span>A confidence score is not a guarantee. Risk limits still apply.</span></p></div></div>:null}
      {step===2?<div className="first-step"><header><span>STEP 3 OF 5 · AMOUNT &amp; RISK</span><h1>Control the downside.</h1><p>Choose a paper allocation. Stop-loss and take-profit are attached before entry.</p></header><div className="first-amount"><label>Paper allocation<span>₹<input type="number" min="100" max="5000" value={amount} onChange={event=>setAmount(Number(event.target.value))}/></span></label><nav>{[250,500,1000,2000].map(value=><button key={value} className={amount===value?"active":""} onClick={()=>setAmount(value)}>₹{value.toLocaleString("en-IN")}</button>)}</nav></div><div className="first-levels"><article><small>ENTRY PRICE</small><b>${market.price.toLocaleString("en-US")}</b></article><article><small>STOP-LOSS</small><b>${stop.toLocaleString("en-US",{maximumFractionDigits:2})}</b><em>-1.2%</em></article><article><small>TAKE-PROFIT</small><b>${target.toLocaleString("en-US",{maximumFractionDigits:2})}</b><em>+3.0%</em></article></div><div className="first-risk-check"><i>✓</i><span><b>Risk check passed</b><small>Planned loss ₹{plannedRisk.toFixed(2)} · below your ₹100 per-trade limit.</small></span></div></div>:null}
      {step===3?<div className="first-step"><header><span>STEP 4 OF 5 · REVIEW ORDER</span><h1>Confirm your paper trade.</h1><p>Review every value before executing the simulated order.</p></header><div className="first-review"><header><i style={{background:market.color}}>{asset[0]}</i><span><b>{asset}/USDT</b><small>Paper market order</small></span><em>BUY</em></header><div><span><small>Allocation</small><b>₹{amount.toLocaleString("en-IN")}</b></span><span><small>Entry</small><b>${market.price.toLocaleString("en-US")}</b></span><span><small>Stop-loss</small><b>${stop.toLocaleString("en-US",{maximumFractionDigits:2})}</b></span><span><small>Take-profit</small><b>${target.toLocaleString("en-US",{maximumFractionDigits:2})}</b></span></div></div><div className="first-checks"><span><i>✓</i>Paper balance available</span><span><i>✓</i>AI confidence above 80%</span><span><i>✓</i>Position limit available</span><span><i>✓</i>Stop-loss attached</span></div><p className="first-disclaimer">This is a guided simulated order. It does not move real money or place an exchange trade.</p></div>:null}
      {step===4?<div className="first-complete"><div>✓</div><span>FIRST PAPER TRADE COMPLETE</span><h1>Your {asset} position<br/><em>is now being tracked.</em></h1><p>The demo position is ready for portfolio monitoring. Continue to the terminal to view market movement, P&amp;L and protective levels.</p><section><article><small>POSITION</small><b>{asset}/USDT · BUY</b></article><article><small>ALLOCATION</small><b>₹{amount.toLocaleString("en-IN")}</b></article><article><small>MAX PLANNED LOSS</small><b>₹{plannedRisk.toFixed(2)}</b></article></section><nav><a href="/trade/portfolio">View portfolio <b>→</b></a><a href="/trade">Open trading terminal</a></nav><small>Guided paper result · No real funds used</small></div>:null}
      {error?<p className="first-error" role="alert">{error}</p>:null}
      {step<4?<footer className="first-actions"><button onClick={back} disabled={step===0||executing}>← Back</button><span>Paper balance · ₹10,000</span>{step<3?<button className="primary" onClick={next}>Continue <i>→</i></button>:<button className="primary" onClick={execute} disabled={executing}>{executing?"Executing paper order…":"Execute paper trade"} <i>↗</i></button>}</footer>:null}
    </section>
  </main>;
}
