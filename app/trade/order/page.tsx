"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type LiveSignal = { asset:string; signal:"BUY"|"SELL"|"NO TRADE"; confidence:number; entry:number; stopLoss:number|null; takeProfit:number|null; reasons:string[]; generatedAt:number; source:string };

// Presentation only. Every price on this screen comes from the live signal API.
const marketMeta:Record<string,{color:string,symbol:string,name:string}>={
  BTC:{color:"#f5a623",symbol:"₿",name:"Bitcoin"},
  ETH:{color:"#8293ff",symbol:"◆",name:"Ethereum"},
  SOL:{color:"#92ffc7",symbol:"S",name:"Solana"},
  BNB:{color:"#f3ba2f",symbol:"B",name:"BNB"},
};

const MAX_SIGNAL_AGE_MS=90000;
const REFRESH_MS=20000;

const money=(n:number)=>new Intl.NumberFormat("en-IN",{maximumFractionDigits:2}).format(n);
const usd=(n:number)=>`$${new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(n)}`;

export default function PaperOrder(){
  const searchParams=useSearchParams();
  const requestedAsset=(searchParams.get("asset")||"BTC").toUpperCase();
  const asset=marketMeta[requestedAsset]?requestedAsset:"BTC";
  const redirected=asset!==requestedAsset;
  const side:"BUY"|"SELL"=searchParams.get("side")==="SELL"?"SELL":"BUY";
  const market=marketMeta[asset];

  const [amount,setAmount]=useState(()=>Math.min(5000,Math.max(100,Number(searchParams.get("amount"))||500)));
  const [signal,setSignal]=useState<LiveSignal|null>(null);
  const [feedError,setFeedError]=useState("");
  const [refreshing,setRefreshing]=useState(true);
  const [now,setNow]=useState(()=>Date.now());
  const [stop,setStop]=useState(0),[target,setTarget]=useState(0);
  const levelsTouched=useRef(false);
  const [confirmed,setConfirmed]=useState(false);
  const [stage,setStage]=useState<"review"|"executing"|"success">("review");
  const [orderId,setOrderId]=useState(""),[error,setError]=useState("");
  const [riskChecks,setRiskChecks]=useState<{id:string;label:string;ok:boolean;detail:string}[]>([]);
  const [riskLoading,setRiskLoading]=useState(true),[riskAllowed,setRiskAllowed]=useState(false),[serverRiskUsage,setServerRiskUsage]=useState(0);

  const loadSignal=useCallback(async()=>{
    const response=await fetch(`/api/signals?asset=${asset}`,{cache:"no-store"});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"The live quant signal could not be loaded.");
    if(!Number.isFinite(data.entry)||data.entry<=0)throw new Error("The live quant signal returned no usable price.");
    return data as LiveSignal;
  },[asset]);

  // A failed or expired feed clears the signal so no stale price can be traded.
  const refresh=useCallback(async()=>{
    setRefreshing(true);
    try{
      const data=await loadSignal();
      setSignal(data);setFeedError("");
      if(!levelsTouched.current&&data.signal===side&&data.stopLoss&&data.takeProfit){setStop(data.stopLoss);setTarget(data.takeProfit)}
    }catch(reason){
      setSignal(null);
      setFeedError(reason instanceof Error?reason.message:"The live Binance candle feed is unavailable.");
    }finally{setRefreshing(false)}
  },[loadSignal,side]);

  useEffect(()=>{levelsTouched.current=false;setStop(0);setTarget(0)},[asset,side]);
  useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),REFRESH_MS);return()=>window.clearInterval(timer)},[refresh]);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer)},[]);

  const signalAgeMs=signal?now-signal.generatedAt:Number.POSITIVE_INFINITY;
  const expired=signalAgeMs>MAX_SIGNAL_AGE_MS;
  const feedLive=Boolean(signal)&&!expired;
  const directionOk=Boolean(signal)&&signal!.signal===side;
  const entry=signal?.entry??0;
  const confidence=signal?.confidence??0;
  const quantity=entry>0?amount/entry:0;
  const lossPct=entry>0&&stop>0?Math.abs((stop-entry)/entry)*100:0;
  const profitPct=entry>0&&target>0?Math.abs((target-entry)/entry)*100:0;
  const maxLoss=amount*lossPct/100,potential=amount*profitPct/100;
  const riskReward=maxLoss?potential/maxLoss:0;

  useEffect(()=>{
    if(!feedLive||!signal){setRiskChecks([]);setRiskAllowed(false);setRiskLoading(false);return}
    setRiskLoading(true);
    const timer=window.setTimeout(()=>{
      fetch("/api/trades",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"validate",asset,side,amount,entryPrice:signal.entry,stopPrice:stop,targetPrice:target,confidence:signal.confidence,signalGeneratedAt:signal.generatedAt})})
        .then(response=>response.json())
        .then(data=>{setRiskChecks(data.checks||[]);setRiskAllowed(Boolean(data.allowed));setServerRiskUsage(data.risk?.maxRiskPaise?Math.min(100,data.risk.riskPaise/data.risk.maxRiskPaise*100):0)})
        .catch(()=>{setRiskAllowed(false);setError("The risk engine could not synchronize.")})
        .finally(()=>setRiskLoading(false));
    },280);
    return()=>window.clearTimeout(timer);
  },[asset,side,amount,stop,target,signal,feedLive]);

  const valid=feedLive&&directionOk&&amount>=100&&amount<=5000&&stop>0&&target>0&&confirmed&&riskAllowed&&!riskLoading;
  const checks=useMemo(()=>riskChecks.length?riskChecks:[{id:"sync",label:"Server risk engine sync",ok:false,detail:feedLive?"Checking saved limits…":"Waiting for a live Binance candle signal"}],[riskChecks,feedLive]);

  async function execute(){
    if(!valid)return;
    setStage("executing");setError("");
    try{
      // Revalidate against live candle data immediately before the order is sent.
      const fresh=await loadSignal();
      setSignal(fresh);setFeedError("");
      if(fresh.signal!==side)throw new Error(`The live quant signal moved to ${fresh.signal}. This ${side} paper order was blocked.`);
      const response=await fetch("/api/trades",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({asset,side,amount,entryPrice:fresh.entry,stopPrice:stop,targetPrice:target,confidence:fresh.confidence,signalGeneratedAt:fresh.generatedAt})});
      const data=await response.json();
      if(!response.ok){if(Array.isArray(data.checks))setRiskChecks(data.checks);throw new Error(data.error||"Risk engine blocked this paper order")}
      setOrderId(data.id);setStage("success");
      if("Notification" in window&&Notification.permission==="granted")new Notification(`Paper ${side} ${asset} saved`,{body:`₹${amount.toLocaleString("en-IN")} allocation · Risk checks passed.`});
    }catch(reason){
      setError(reason instanceof Error?reason.message:"Paper order could not be saved");
      setStage("review");
    }
  }

  return <main className="order-shell">
    <header className="order-top"><a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span><i/> PAPER MODE</span><a href="/trade">×</a></header>
    <section className="order-progress"><span className={stage==="review"?"active":"done"}><i>1</i>Review</span><b/><span className={stage==="executing"?"active":stage==="success"?"done":""}><i>2</i>Execute</span><b/><span className={stage==="success"?"active":""}><i>3</i>Complete</span></section>
    {stage==="success"?<section className="order-success"><div className="success-ring"><i>✓</i></div><span>PAPER ORDER SAVED</span><h1>{side} {asset} complete.</h1><p>Your simulated position is saved to your paper account. No real money was used.</p><article><div><i style={{background:market.color}}>{market.symbol}</i><span><b>{asset}/USDT</b><small>{side} · Spot · Paper</small></span></div><strong>₹{money(amount)}</strong><dl><div><dt>Quant entry</dt><dd>{usd(entry)}</dd></div><div><dt>Quantity</dt><dd>{quantity.toFixed(6)} {asset}</dd></div><div><dt>Stop loss</dt><dd>{usd(stop)}</dd></div><div><dt>Take profit</dt><dd>{usd(target)}</dd></div></dl><footer><span>Order ID</span><b>{orderId}</b></footer></article><div className="success-actions"><a href="/trade">View open position <span>→</span></a><a href="/trade/markets">Back to market scanner</a></div><small>Persistent paper execution · No real exchange order was sent</small></section>:
    <section className="order-main">
      <div className="order-copy"><span>CONTROLLED EXECUTION</span><h1>Review every detail.<br/><em>Then decide.</em></h1><p>Quant AI prepares the opportunity. Your risk rules validate it before any paper order is placed.</p><div className="order-ai-note"><i>✦</i><span><b>{feedLive?`${confidence}% quant confidence · ${signal!.signal}`:"Live signal unavailable"}</b><small>{feedLive?signal!.reasons?.[0]||"Binance public candle analysis":"No paper entry can be prepared without a live Binance candle signal."}</small></span></div></div>
      <div className="order-card">
        <header><div><i style={{background:market.color}}>{market.symbol}</i><span><b>{asset}/USDT</b><small>{market.name} · Spot · Paper trading</small></span></div><span className={side.toLowerCase()}>{side}</span></header>
        {redirected?<div className="order-feed-banner notice"><i>i</i><div><b>{requestedAsset} is not covered by the quant engine</b><small>Supported markets are {Object.keys(marketMeta).join(", ")}. This screen switched to {asset}.</small></div></div>:null}
        {!feedLive?<div className="order-feed-banner"><i>!</i><div><b>{feedError?"Live market feed unavailable":"Live signal expired"}</b><small>{feedError||`The reviewed signal is older than ${MAX_SIGNAL_AGE_MS/1000} seconds.`} Paper entries stay blocked until a fresh Binance candle signal loads.</small></div><button type="button" onClick={()=>void refresh()} disabled={refreshing}>{refreshing?"Retrying…":"Retry"}</button></div>:!directionOk?<div className="order-feed-banner"><i>!</i><div><b>Quant engine is not permitting a {side}</b><small>The live direction is {signal!.signal}. This paper order is blocked until the signal agrees with your side.</small></div></div>:null}
        <section className="order-price"><span>LIVE QUANT ENTRY</span><strong>{feedLive?usd(entry):"—"}</strong><small>{feedLive?`${signal!.source} · updated ${Math.max(0,Math.round(signalAgeMs/1000))}s ago`:"Waiting for live Binance candles"}</small></section>
        <div className="order-field"><label>Paper trade amount <small>₹100 – ₹5,000</small></label><div><b>₹</b><input type="number" min="100" max="5000" step="100" value={amount} onChange={e=>setAmount(Number(e.target.value))}/><span>INR</span></div><nav>{[500,1000,2500,5000].map(n=><button className={amount===n?"active":""} onClick={()=>setAmount(n)} key={n}>₹{money(n)}</button>)}</nav></div>
        <div className="order-level-inputs"><label>Stop loss<div><b>$</b><input type="number" value={stop||""} placeholder="—" disabled={!feedLive} onChange={e=>{levelsTouched.current=true;setStop(Number(e.target.value))}}/></div><small>Max loss ≈ ₹{money(maxLoss)}</small></label><label>Take profit<div><b>$</b><input type="number" value={target||""} placeholder="—" disabled={!feedLive} onChange={e=>{levelsTouched.current=true;setTarget(Number(e.target.value))}}/></div><small>Potential ≈ ₹{money(potential)}</small></label></div>
        <div className="order-summary"><span><small>Quantity</small><b>{quantity.toFixed(6)} {asset}</b></span><span><small>Risk / reward</small><b>1 : {riskReward.toFixed(1)}</b></span><span><small>Capital at risk</small><b>{lossPct.toFixed(2)}%</b></span></div>
        <section className="risk-validation"><header><span><i>◇</i> Server risk validation</span><b>{!feedLive?"Feed blocked":riskLoading?"Checking…":riskAllowed?"All checks passed":"Order blocked"}</b></header>{checks.map(c=><div key={c.id} title={c.detail}><i className={c.ok?"ok":""}>{c.ok?"✓":"!"}</i><span>{c.label}<small>{c.detail}</small></span></div>)}<footer><span>Per-trade risk capacity used</span><b>{serverRiskUsage.toFixed(0)}%</b><i><em style={{width:serverRiskUsage+"%"}}/></i></footer></section>
        <label className="order-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><i>✓</i><span><b>I understand this is a simulated trade</b><small>Paper results do not guarantee future real-market performance.</small></span></label>
        {error&&<p className="order-api-error">{error}</p>}<button className={`order-execute ${side.toLowerCase()}`} disabled={!valid||stage==="executing"} onClick={execute}>{stage==="executing"?<><i className="order-spinner"/>Saving paper order…</>:<>Execute {side} paper order <span>→</span></>}</button>
        {!feedLive?<p className="order-helper">A live Binance candle signal is required before any paper entry.</p>:!directionOk?<p className="order-helper">Wait for the quant engine to permit a {side} on {asset}.</p>:!confirmed?<p className="order-helper">Confirm the paper-trading notice to continue.</p>:!riskAllowed&&!riskLoading?<p className="order-helper">Resolve the failed risk check before continuing.</p>:null}
      </div>
    </section>}
  </main>;
}
