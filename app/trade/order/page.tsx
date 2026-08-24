"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const marketData:Record<string,{price:number,display:string,color:string,symbol:string,confidence:number,stop:number,target:number,reason:string}>={
  BTC:{price:113240.8,display:"$113,240.80",color:"#f5a623",symbol:"₿",confidence:82,stop:111900,target:116800,reason:"Bullish EMA structure, rising volume and a confirmed resistance breakout."},
  ETH:{price:4216.12,display:"$4,216.12",color:"#8293ff",symbol:"◆",confidence:81,stop:4168,target:4308,reason:"Momentum recovered above support while sell pressure continued to weaken."},
  SOL:{price:182.44,display:"$182.44",color:"#92ffc7",symbol:"S",confidence:84,stop:178.8,target:189.2,reason:"Resistance breakout confirmed with strong volume and bullish EMA alignment."},
  XRP:{price:3.14,display:"$3.14",color:"#e9eef0",symbol:"X",confidence:79,stop:3.19,target:3.02,reason:"Price lost support with increasing sell volume and negative momentum."},
  AVAX:{price:31.62,display:"$31.62",color:"#ff6f78",symbol:"A",confidence:77,stop:30.71,target:33.28,reason:"Momentum is positive, but volatility keeps confidence below the auto threshold."},
  LINK:{price:25.84,display:"$25.84",color:"#7893ff",symbol:"L",confidence:73,stop:26.32,target:24.9,reason:"Lower highs and weakening volume suggest continued downside pressure."},
};

const money=(n:number)=>new Intl.NumberFormat("en-IN",{maximumFractionDigits:2}).format(n);
const usd=(n:number)=>`$${new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(n)}`;

export default function PaperOrder(){
  const searchParams=useSearchParams(),requestedAsset=(searchParams.get("asset")||"BTC").toUpperCase(),initialAsset=marketData[requestedAsset]?requestedAsset:"BTC",initialSide: "BUY"|"SELL"=searchParams.get("side")==="SELL"?"SELL":"BUY",initialMarket=marketData[initialAsset],initialSell=initialSide==="SELL";
  const asset=initialAsset,side=initialSide;
  const [amount,setAmount]=useState(()=>Math.max(100,Number(searchParams.get("amount"))||500));
  const [stop,setStop]=useState(()=>initialSell?Math.max(initialMarket.stop,initialMarket.price*1.01):Math.min(initialMarket.stop,initialMarket.price*.99)),[target,setTarget]=useState(()=>initialSell?Math.min(initialMarket.target,initialMarket.price*.98):Math.max(initialMarket.target,initialMarket.price*1.02)),[confirmed,setConfirmed]=useState(false);
  const [stage,setStage]=useState<"review"|"executing"|"success">("review");
  const [orderId,setOrderId]=useState(""),[error,setError]=useState(""),[riskChecks,setRiskChecks]=useState<{id:string;label:string;ok:boolean;detail:string}[]>([]),[riskLoading,setRiskLoading]=useState(true),[riskAllowed,setRiskAllowed]=useState(false),[serverRiskUsage,setServerRiskUsage]=useState(0),[liveSignal,setLiveSignal]=useState<{signal:string;confidence:number;entry:number;stopLoss:number|null;takeProfit:number|null;reasons:string[]}|null>(null);
  const market=marketData[asset]||marketData.BTC;
  useEffect(()=>{fetch(`/api/signals?asset=${asset}`,{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{setLiveSignal(data);if(data.signal===side&&data.stopLoss&&data.takeProfit){setStop(data.stopLoss);setTarget(data.takeProfit)}}).catch(()=>setError("The live quant signal could not be loaded."))},[asset,side]);
  const entry=liveSignal?.entry||market.price,confidence=liveSignal?.confidence||market.confidence;
  const quantity=amount/entry;
  const lossPct=Math.abs((stop-entry)/entry)*100;
  const profitPct=Math.abs((target-entry)/entry)*100;
  const maxLoss=amount*lossPct/100, potential=amount*profitPct/100;
  const riskReward=maxLoss?potential/maxLoss:0;
  useEffect(()=>{setRiskLoading(true);const timer=window.setTimeout(()=>{fetch("/api/trades",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"validate",asset,side,amount,entryPrice:entry,stopPrice:stop,targetPrice:target,confidence})}).then(r=>r.json()).then(data=>{setRiskChecks(data.checks||[]);setRiskAllowed(Boolean(data.allowed));setServerRiskUsage(data.risk?.maxRiskPaise?Math.min(100,data.risk.riskPaise/data.risk.maxRiskPaise*100):0)}).catch(()=>{setRiskAllowed(false);setError("The risk engine could not synchronize.")}).finally(()=>setRiskLoading(false))},280);return()=>window.clearTimeout(timer)},[asset,side,amount,stop,target,entry,confidence]);
  const valid=amount>=100&&amount<=5000&&stop>0&&target>0&&confirmed&&riskAllowed&&!riskLoading;
  const checks=useMemo(()=>riskChecks.length?riskChecks:[{id:"sync",label:"Server risk engine sync",ok:false,detail:"Checking saved limits…"}],[riskChecks]);
  async function execute(){if(!valid)return;setStage("executing");setError("");try{const response=await fetch("/api/trades",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({asset,side,amount,entryPrice:entry,stopPrice:stop,targetPrice:target,confidence})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Risk engine blocked this paper order");setOrderId(data.id);setStage("success");if("Notification" in window&&Notification.permission==="granted")new Notification(`Paper ${side} ${asset} saved`,{body:`₹${amount.toLocaleString("en-IN")} allocation · Risk checks passed.`})}catch(reason){setError(reason instanceof Error?reason.message:"Paper order could not be saved");setStage("review")}}

  return <main className="order-shell">
    <header className="order-top"><a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span><i/> PAPER MODE</span><a href="/trade">×</a></header>
    <section className="order-progress"><span className={stage==="review"?"active":"done"}><i>1</i>Review</span><b/><span className={stage==="executing"?"active":stage==="success"?"done":""}><i>2</i>Execute</span><b/><span className={stage==="success"?"active":""}><i>3</i>Complete</span></section>
    {stage==="success"?<section className="order-success"><div className="success-ring"><i>✓</i></div><span>PAPER ORDER SAVED</span><h1>{side} {asset} complete.</h1><p>Your simulated position is saved to your paper account. No real money was used.</p><article><div><i style={{background:market.color}}>{market.symbol}</i><span><b>{asset}/USDT</b><small>{side} · Spot · Paper</small></span></div><strong>₹{money(amount)}</strong><dl><div><dt>Quant entry</dt><dd>{usd(entry)}</dd></div><div><dt>Quantity</dt><dd>{quantity.toFixed(6)} {asset}</dd></div><div><dt>Stop loss</dt><dd>{usd(stop)}</dd></div><div><dt>Take profit</dt><dd>{usd(target)}</dd></div></dl><footer><span>Order ID</span><b>{orderId||`CY-PAPER-${asset}-0821`}</b></footer></article><div className="success-actions"><a href="/trade">View open position <span>→</span></a><a href="/trade/markets">Back to market scanner</a></div><small>Persistent paper execution · No real exchange order was sent</small></section>:
    <section className="order-main">
      <div className="order-copy"><span>CONTROLLED EXECUTION</span><h1>Review every detail.<br/><em>Then decide.</em></h1><p>Quant AI prepares the opportunity. Your risk rules validate it before any paper order is placed.</p><div className="order-ai-note"><i>✦</i><span><b>{confidence}% quant confidence · {liveSignal?.signal||"SCANNING"}</b><small>{liveSignal?.reasons?.[0]||market.reason}</small></span></div></div>
      <div className="order-card">
        <header><div><i style={{background:market.color}}>{market.symbol}</i><span><b>{asset}/USDT</b><small>Spot · Paper trading</small></span></div><span className={side.toLowerCase()}>{side}</span></header>
        <section className="order-price"><span>LIVE QUANT ENTRY</span><strong>{usd(entry)}</strong><small>Binance public candle analysis</small></section>
        <div className="order-field"><label>Paper trade amount <small>₹100 – ₹5,000</small></label><div><b>₹</b><input type="number" min="100" max="5000" step="100" value={amount} onChange={e=>setAmount(Number(e.target.value))}/><span>INR</span></div><nav>{[500,1000,2500,5000].map(n=><button className={amount===n?"active":""} onClick={()=>setAmount(n)} key={n}>₹{money(n)}</button>)}</nav></div>
        <div className="order-level-inputs"><label>Stop loss<div><b>$</b><input type="number" value={stop} onChange={e=>setStop(Number(e.target.value))}/></div><small>Max loss ≈ ₹{money(maxLoss)}</small></label><label>Take profit<div><b>$</b><input type="number" value={target} onChange={e=>setTarget(Number(e.target.value))}/></div><small>Potential ≈ ₹{money(potential)}</small></label></div>
        <div className="order-summary"><span><small>Quantity</small><b>{quantity.toFixed(6)} {asset}</b></span><span><small>Risk / reward</small><b>1 : {riskReward.toFixed(1)}</b></span><span><small>Capital at risk</small><b>{lossPct.toFixed(2)}%</b></span></div>
        <section className="risk-validation"><header><span><i>◇</i> Server risk validation</span><b>{riskLoading?"Checking…":riskAllowed?"All checks passed":"Order blocked"}</b></header>{checks.map(c=><div key={c.id} title={c.detail}><i className={c.ok?"ok":""}>{c.ok?"✓":"!"}</i><span>{c.label}<small>{c.detail}</small></span></div>)}<footer><span>Per-trade risk capacity used</span><b>{serverRiskUsage.toFixed(0)}%</b><i><em style={{width:serverRiskUsage+"%"}}/></i></footer></section>
        <label className="order-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><i>✓</i><span><b>I understand this is a simulated trade</b><small>Paper results do not guarantee future real-market performance.</small></span></label>
        {error&&<p className="order-api-error">{error}</p>}<button className={`order-execute ${side.toLowerCase()}`} disabled={!valid||stage==="executing"} onClick={execute}>{stage==="executing"?<><i className="order-spinner"/>Saving paper order…</>:<>Execute {side} paper order <span>→</span></>}</button>
        {!confirmed?<p className="order-helper">Confirm the paper-trading notice to continue.</p>:!riskAllowed&&!riskLoading?<p className="order-helper">Resolve the failed risk check before continuing.</p>:null}
      </div>
    </section>}
  </main>;
}
