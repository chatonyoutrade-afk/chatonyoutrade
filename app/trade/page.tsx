"use client";

import { useEffect, useMemo, useState } from "react";
import { useBinanceMarket } from "./useBinanceMarket";

const candles = [
  [45,55,62,34],[55,48,66,41],[48,59,67,43],[59,65,73,51],[65,61,76,55],[61,69,79,57],
  [69,74,84,64],[74,68,82,62],[68,77,87,65],[77,83,91,72],[83,79,93,74],[79,87,96,76],
  [87,92,101,82],[92,86,98,81],[86,94,103,83],[94,99,108,90],[99,95,106,89],[95,103,112,92],
  [103,109,118,98],[109,105,116,100],[105,114,123,101],[114,119,128,110],[119,115,125,108],[115,123,132,112],
];
const assets = [
  {symbol:"BTC",fallbackPrice:113240.80,fallbackChange:2.84,color:"#f5a623"},
  {symbol:"ETH",fallbackPrice:4216.12,fallbackChange:1.36,color:"#7c8cff"},
  {symbol:"SOL",fallbackPrice:182.44,fallbackChange:4.21,color:"#8bffbd"},
  {symbol:"BNB",fallbackPrice:861.42,fallbackChange:.72,color:"#f2d354"},
];
type QuantSignal={signal:"BUY"|"SELL"|"NO TRADE";confidence:number;entry:number;stopLoss:number|null;takeProfit:number|null;riskPct:number;trend:string;reasons:string[];indicators:{rsi14:number;volumeRatio:number};generatedAt:number};

export default function Home() {
  const [activeAsset,setActiveAsset] = useState("BTC");
  const [amount,setAmount] = useState(500);
  const toast = "";
  const autoMode = false;
  const [nav,setNav] = useState("Trade");
  const [bottomTab,setBottomTab] = useState("Open Positions");
  const [timeframe,setTimeframe] = useState("1m");
  const [trades,setTrades] = useState<{id:string;side:string;asset:string;amount:number;status:string;pnl:string;entryPrice:number}[]>([]);
  const [accountBalance,setAccountBalance]=useState(10000),[accountSync,setAccountSync]=useState("syncing");
  const [quantSignal,setQuantSignal]=useState<QuantSignal|null>(null),[signalStatus,setSignalStatus]=useState("scanning");
  const {tickers,candles:liveCandles,status:marketConnection,reconnect}=useBinanceMarket(activeAsset);
  const current = useMemo(()=>assets.find(a=>a.symbol===activeAsset)??assets[0],[activeAsset]);
  const activeTicker=tickers[activeAsset+"USDT"];
  const currentValue=activeTicker?.price??current.fallbackPrice;
  const currentChange=activeTicker?.change??current.fallbackChange;
  const formatPrice=(value:number)=>"$"+value.toLocaleString("en-US",{minimumFractionDigits:value<1000?2:2,maximumFractionDigits:2});
  const chartCandles=useMemo(()=>{
    const source=liveCandles.length>=2?liveCandles.map(item=>[item.open,item.close,item.high,item.low]):candles;
    const low=Math.min(...source.map(item=>item[3])),high=Math.max(...source.map(item=>item[2])),range=Math.max(high-low,.000001);
    return source.map(([open,close,top,bottom])=>[5+(open-low)/range*88,5+(close-low)/range*88,5+(top-low)/range*88,5+(bottom-low)/range*88]);
  },[liveCandles]);
  const axis=useMemo(()=>[1.008,1.004,1,.996,.992].map(multiplier=>formatPrice(currentValue*multiplier)),[currentValue]);
  useEffect(()=>{fetch("/api/account").then(response=>response.json()).then(data=>{if(data.account){setAccountBalance(data.account.balance);setAccountSync("saved");const open=(data.trades||[]).filter((item:{status:string})=>item.status==="open").map((item:{id:string;side:string;asset:string;amountPaise:number;status:string;pnlPaise:number;entryPrice:number})=>({id:item.id,side:item.side,asset:item.asset,amount:item.amountPaise/100,status:"Open",pnl:(item.pnlPaise>=0?"+":"-")+"₹"+Math.abs(item.pnlPaise/100).toFixed(2),entryPrice:item.entryPrice}));setTrades(open)}}).catch(()=>setAccountSync("offline"))},[]);
  useEffect(()=>{let active=true;const load=()=>{setSignalStatus("scanning");fetch(`/api/signals?asset=${activeAsset}`,{cache:"no-store"}).then(response=>response.ok?response.json():Promise.reject()).then(data=>{if(active){setQuantSignal(data);setSignalStatus("live")}}).catch(()=>{if(active)setSignalStatus("offline")})};load();const timer=window.setInterval(load,15000);return()=>{active=false;window.clearInterval(timer)}},[activeAsset]);
  function execute(side:"BUY"|"SELL") { window.location.href=`/trade/order?asset=${activeAsset}&side=${side}&amount=${amount}`; }

  return <main className="terminal-shell">
    <header className="topbar">
      <a className="brand terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a>
      <button className={`market-status market-${marketConnection}`} onClick={reconnect} title="Reconnect Binance public market stream"><span className="live-dot"/> {marketConnection==="live"?"Binance market live":marketConnection==="connecting"?"Connecting market…":marketConnection==="reconnecting"?"Reconnecting…":"Market offline"} <span className="desktop-only">· Public data only</span></button>
      <div className="top-actions"><a className="notification-mini" href="/trade/notifications" aria-label="Open notifications">●</a><a className="emergency-mini" href="/trade/emergency-stop" aria-label="Open emergency stop">Ⅱ</a><a className="guide-help" href="/trade/guide" aria-label="Open AI Guide">?</a><button className="balance"><span>PAPER BALANCE · {accountSync.toUpperCase()}</span><strong>₹{accountBalance.toLocaleString("en-IN",{minimumFractionDigits:2})}</strong></button><button className="avatar" onClick={()=>window.location.href="/trade/profile"} aria-label="Open profile">NS</button></div>
    </header>

    <section className="workspace">
      <aside className="rail" aria-label="Primary navigation"><div>
        {["Trade","AI Trader","Bots","Wallet","Portfolio","History","Analytics","Backtest"].map(item=><button key={item} onClick={()=>item==="AI Trader"?window.location.href="/trade/ai":item==="Bots"?window.location.href="/trade/bots":item==="Wallet"?window.location.href="/trade/wallet":item==="Portfolio"?window.location.href="/trade/portfolio":item==="History"?window.location.href="/trade/history":item==="Analytics"?window.location.href="/trade/analytics":item==="Backtest"?window.location.href="/trade/backtest":setNav(item)} className={nav===item?"active":""}><span className="rail-icon">{item==="Trade"?"↗":item==="AI Trader"?"✦":item==="Bots"?"◉":item==="Wallet"?"▰":item==="Portfolio"?"◒":item==="History"?"↶":item==="Analytics"?"⌁":"◫"}</span><span>{item}</span></button>)}
      </div><button onClick={()=>window.location.href="/trade/settings"}><span className="rail-icon">⚙</span><span>Settings</span></button></aside>

      <section className="chart-area">
        <div className="asset-strip">
          {assets.map(asset=>{const ticker=tickers[asset.symbol+"USDT"],price=ticker?.price??asset.fallbackPrice,change=ticker?.change??asset.fallbackChange;return <button key={asset.symbol} onClick={()=>setActiveAsset(asset.symbol)} className={activeAsset===asset.symbol?"selected":""}><span className="coin" style={{background:asset.color}}>{asset.symbol[0]}</span><span><b>{asset.symbol}/USDT</b><small>{formatPrice(price)}</small></span><em className={change<0?"down":""}>{change>=0?"+":""}{change.toFixed(2)}%</em></button>})}
          <button className="add-asset" onClick={()=>window.location.href="/trade/markets"} aria-label="Open market scanner">+</button>
        </div>
        <div className="chart-header"><div><span className="eyebrow">{activeAsset} / USDT · LIVE PUBLIC DATA</span><div className="price-row"><h1>{formatPrice(currentValue)}</h1><span className={currentChange<0?"negative":""}>{currentChange>=0?"+":""}{currentChange.toFixed(2)}%</span></div></div><div className="chart-tools">{["1m","5m","15m","1h","4h"].map(item=><button key={item} className={timeframe===item?"active":""} onClick={()=>setTimeframe(item)}>{item}</button>)}<i/><button onClick={()=>window.location.href="/trade/analytics"}>Indicators</button><button onClick={()=>window.location.href="/trade/settings"} aria-label="Open chart settings">⚙</button></div></div>
        <div className="chart-canvas" aria-label={`${activeAsset} candlestick chart`}>
          <div className="indicator-labels"><span>BINANCE SPOT <b>{marketConnection.toUpperCase()}</b></span><span>{timeframe.toUpperCase()} VIEW <b>{liveCandles.length||"DEMO"}</b></span></div>
          <div className="price-axis">{axis.map(value=><span key={value}>{value}</span>)}</div>
          <div className="candles live-candles">{chartCandles.map(([open,close,high,low],index)=>{const up=close>=open,span=Math.max(high-low,.01);return <div className={`candle ${up?"up":"down"}`} key={index} style={{left:`${index*(96/Math.max(chartCandles.length,1))+1}%`,bottom:`${low}%`,height:`${span}%`}}><i style={{bottom:`${(Math.min(open,close)-low)/span*100}%`,height:`${Math.max(4,Math.abs(close-open)/span*100)}%`}}/></div>})}</div>
          <div className="current-line"><span>{formatPrice(currentValue)}</span></div><div className="time-axis"><span>-35m</span><span>-25m</span><span>-15m</span><span>-5m</span><span>Now</span></div>
        </div>
        <section className="positions-panel">
          <div className="positions-tabs">{["Open Positions","Orders","History","AI Activity"].map(tab=><button key={tab} onClick={()=>setBottomTab(tab)} className={bottomTab===tab?"active":""}>{tab}{tab==="Open Positions"&&<em>{trades.length}</em>}</button>)}</div>
          {bottomTab==="Open Positions"&&trades.length>0 ? <div className="position-row"><span><i className="mini-coin">{trades[0].asset[0]}</i><b>{trades[0].asset}/USDT</b><small>{trades[0].side} · Spot</small></span><span><small>Size</small><b>₹{trades[0].amount.toLocaleString("en-IN")}</b></span><span><small>Entry</small><b>{formatPrice(trades[0].entryPrice)}</b></span><span><small>Status</small><b>Saved</b></span><span><small>Realised P&amp;L</small><b className="gain">Pending</b></span><button onClick={()=>window.location.href=`/trade/exit?id=${encodeURIComponent(trades[0].id)}`}>Close</button></div> : <div className="activity-empty"><span>✦</span><p><b>{bottomTab}</b><small>{bottomTab==="AI Activity"?"AI skipped BTC at 64% confidence · Risk rules protected capital.":"No saved paper-trading records yet."}</small></p></div>}
        </section>
      </section>

      <aside className="ai-panel">
        <div className="ai-title"><div><span className="spark">✦</span><strong>Quant AI</strong></div><span className="watching"><i/> {signalStatus}</span></div>
        <div className="signal-card"><div className="signal-top"><span>LIVE QUANT SIGNAL</span><small>{quantSignal?"15s refresh":"Analysing candles…"}</small></div><div className="signal"><strong>{quantSignal?.signal||"SCANNING"}</strong><div><span>{quantSignal?.confidence||"—"}</span><small>% confidence</small></div></div><div className="confidence"><i style={{width:`${quantSignal?.confidence||0}%`}}/></div><p>{quantSignal?.signal==="NO TRADE"?"Conditions are not aligned. Capital stays protected.":quantSignal?.reasons[0]||"EMA, RSI, MACD, ATR and volume are being calculated."}</p></div>
        <div className="levels"><div><span>Entry</span><b>{quantSignal?formatPrice(quantSignal.entry):"—"}</b></div><div><span>Stop loss</span><b className="loss">{quantSignal?.stopLoss?formatPrice(quantSignal.stopLoss):"—"}</b></div><div><span>Take profit</span><b className="gain">{quantSignal?.takeProfit?formatPrice(quantSignal.takeProfit):"—"}</b></div><div><span>ATR risk</span><b>{quantSignal?quantSignal.riskPct.toFixed(2)+"%":"—"}</b></div></div>
        <div className="reasoning"><span>Why this decision</span><ul>{(quantSignal?.reasons||["Waiting for live candle analysis"]).slice(0,3).map(item=><li key={item}>{item}</li>)}</ul></div>
        <div className="amount-block"><div><span>Paper trade amount</span><small>Available ₹{accountBalance.toLocaleString("en-IN")}</small></div><div className="amount-input"><button onClick={()=>setAmount(Math.max(100,amount-100))}>−</button><label>₹<input value={amount} onChange={e=>setAmount(Number(e.target.value))}/></label><button onClick={()=>setAmount(amount+100)}>+</button></div></div>
        <div className="trade-buttons"><button className="buy" disabled={quantSignal?.signal!=="BUY"} onClick={()=>execute("BUY")}>{quantSignal?.signal==="BUY"?`Execute AI Buy ${activeAsset}`:"Buy blocked"}</button><button className="sell" disabled={quantSignal?.signal!=="SELL"} onClick={()=>execute("SELL")}>{quantSignal?.signal==="SELL"?"Execute AI Sell":"Sell blocked"}</button></div>
        <button className={`auto-toggle ${autoMode?"on":""}`} onClick={()=>window.location.href="/trade/auto"}><span><b>AI Auto Trade</b><small>{autoMode?"Active · within your risk rules":"Set limits before activation"}</small></span><i/></button>
        <div className="risk-strip"><span><small>Daily P&amp;L</small><b>+₹84.20</b></span><span><small>Max risk</small><b>1%</b></span><span><small>Open</small><b>{trades.length}/2</b></span></div><p className="disclaimer">Live public market data by Binance · Paper orders only · No real money</p>
      </aside>
    </section>
    <nav className="mobile-nav">{["Trade","AI","Bot","Wallet","Profile"].map(item=><button onClick={()=>{const route:{[key:string]:string}={AI:"/trade/ai",Bot:"/trade/bots",Wallet:"/trade/wallet",Profile:"/trade/profile"};if(route[item])window.location.href=route[item]}} key={item} className={item==="Trade"?"active":""}><span>{item==="Trade"?"↗":item==="AI"?"✦":item==="Bot"?"◉":item==="Wallet"?"▰":"●"}</span>{item}</button>)}</nav>
    {toast&&<div className="toast"><span>✓</span>{toast}</div>}
  </main>;
}
