"use client";

import { useState } from "react";

const losses = [
  { coin: "BTC", pair: "BTC/USDT", time: "09:42", pnl: "-₹86.40", color: "#f4a340" },
  { coin: "ETH", pair: "ETH/USDT", time: "11:18", pnl: "-₹102.20", color: "#8293ff" },
  { coin: "SOL", pair: "SOL/USDT", time: "14:07", pnl: "-₹111.40", color: "#8fffc1" },
];

export default function RiskPause() {
  const [acknowledged, setAcknowledged] = useState(false);

  return <main className="risk-pause-shell">
    <header className="risk-pause-top">
      <a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a>
      <div><i>◇</i><span><b>Risk Engine</b><small>Paper mode · Safety event</small></span></div>
      <a href="/trade/ai">×</a>
    </header>

    {!acknowledged ? <section className="risk-pause-main">
      <div className="risk-pause-hero">
        <div className="risk-lock"><span>Ⅱ</span><i/><b/></div>
        <span>DAILY PROTECTION ACTIVATED</span>
        <h1>AI paused itself.</h1>
        <p>Your ₹300 daily loss limit was reached. New paper trades are blocked until the safety window resets.</p>
        <div className="risk-total"><span><small>LOSS USED TODAY</small><strong>₹300.00 <em>/ ₹300.00</em></strong></span><b>100%</b><div><i/></div><small>3% of ₹10,000 paper capital</small></div>
      </div>

      <div className="risk-pause-grid">
        <section className="risk-state-card">
          <header><div><span>LIVE SAFETY STATE</span><h2>Protected, not disconnected.</h2></div><em>PAUSED</em></header>
          <div className="risk-state-list">
            <span><i className="blocked">×</i><b>New entries blocked<small>AI cannot open another paper position today.</small></b><em>Blocked</em></span>
            <span><i>✓</i><b>Existing protection active<small>Stop-loss and take-profit rules remain attached.</small></b><em>Active</em></span>
            <span><i>⌁</i><b>Market monitoring continues<small>Signals are recorded, but none will execute.</small></b><em>Watching</em></span>
          </div>
          <div className="risk-reset"><i>↻</i><span><small>AUTOMATIC RESET</small><b>Tomorrow · 00:00 IST</b></span><strong>06:42:18</strong></div>
        </section>

        <section className="risk-loss-card">
          <header><div><span>TODAY&apos;S LOSS TRAIL</span><h2>What triggered the pause</h2></div><a href="/trade/history">History →</a></header>
          <div>{losses.map((item, index)=><article key={item.coin}><i style={{background:item.color}}>{item.coin[0]}</i><span><b>{item.pair}</b><small>Paper exit · {item.time} IST</small></span><em>{item.pnl}</em><strong>{index<losses.length-1?"↓":"◇"}</strong></article>)}</div>
          <footer><span><small>DAILY TOTAL</small><b>3 paper trades</b></span><strong>-₹300.00</strong></footer>
        </section>
      </div>

      <section className="risk-next-card">
        <header><span>WHAT HAPPENS NEXT</span><h2>Pause today. Improve tomorrow.</h2></header>
        <div><article><i>01</i><span><b>No instant bypass</b><small>The daily limit stays locked for the full safety window.</small></span></article><article><i>02</i><span><b>Review the pattern</b><small>See which signals and volatility conditions led to losses.</small></span></article><article><i>03</i><span><b>Lower future risk</b><small>You can reduce risk per trade before the next session.</small></span></article></div>
        <footer><button onClick={()=>setAcknowledged(true)}>Acknowledge &amp; stay paused <b>→</b></button><a href="/trade/settings">Review risk settings</a></footer>
      </section>
      <p className="risk-disclaimer">Illustrative paper-trading event · No real funds or exchange orders are involved</p>
    </section> : <section className="risk-acknowledged">
      <div className="risk-lock acknowledged"><span>✓</span><i/><b/></div>
      <span>SAFETY EVENT ACKNOWLEDGED</span>
      <h1>AI remains safely paused.</h1>
      <p>We’ll keep watching the market and recording decisions. New paper trades resume only after the daily window resets.</p>
      <article><header><i>◇</i><span><b>Daily loss protection</b><small>₹300 of ₹300 used</small></span><em>LOCKED</em></header><div><span>Monitoring<b>24 markets</b></span><span>New entries<b>Blocked</b></span><span>Reset<b>00:00 IST</b></span></div><footer><i/> Safe state confirmed · Stop-loss protection stays active</footer></article>
      <div><a href="/trade/ai">Return to AI dashboard</a><a href="/trade/settings">Lower future risk</a></div>
      <small>No immediate override is available by design.</small>
    </section>}
  </main>;
}
