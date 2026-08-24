"use client";

import { useState } from "react";

const checks = [
  { label: "ATR spike", value: "3.8× normal", state: "High", width: 96 },
  { label: "1-minute move", value: "+4.7%", state: "High", width: 88 },
  { label: "Order-book spread", value: "0.42%", state: "Wide", width: 79 },
  { label: "Liquidity depth", value: "-61%", state: "Thin", width: 84 },
];

export default function VolatilityPause() {
  const [acknowledged, setAcknowledged] = useState(false);

  return <main className="volatility-shell">
    <header className="volatility-top">
      <a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a>
      <div><i>⌁</i><span><b>Volatility Guard</b><small>Paper mode · Live safety state</small></span></div>
      <a href="/trade/ai">×</a>
    </header>

    {!acknowledged ? <section className="volatility-main">
      <div className="volatility-copy">
        <span>ABNORMAL VOLATILITY DETECTED</span>
        <h1>The market is moving fast.<br/><em>AI will wait.</em></h1>
        <p>BNB/USDT moved outside your allowed safety range. AI rejected the entry before any paper order was created.</p>
        <div className="volatility-decision"><i>◇</i><span><small>AI DECISION</small><b>NO TRADE</b><em>Capital protected</em></span><strong>58<small>% confidence</small></strong></div>
        <div className="volatility-actions"><button onClick={()=>setAcknowledged(true)}>Acknowledge &amp; keep watching <b>→</b></button><a href="/trade/settings">Review protection rules</a></div>
        <small className="volatility-note">Illustrative paper-market event · No exchange order was sent</small>
      </div>

      <section className="volatility-monitor">
        <header><div><i>B</i><span><b>BNB/USDT</b><small>Safety snapshot · 14:36 IST</small></span></div><em>ENTRY BLOCKED</em></header>
        <div className="volatility-chart">
          <span><small>$872</small><i/><small>$856</small><i/><small>$840</small><i/><small>$824</small></span>
          <svg viewBox="0 0 620 180" preserveAspectRatio="none" aria-label="Illustrative BNB volatility spike chart">
            <defs><linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffbd66" stopOpacity=".28"/><stop offset="1" stopColor="#ffbd66" stopOpacity="0"/></linearGradient></defs>
            <path className="vol-fill" d="M0 142 L44 137 L91 139 L137 128 L183 132 L225 119 L265 125 L303 109 L338 116 L373 98 L406 104 L438 84 L466 91 L490 69 L514 79 L536 44 L550 71 L566 19 L580 58 L595 31 L620 54 L620 180 L0 180 Z"/>
            <path className="vol-line" d="M0 142 L44 137 L91 139 L137 128 L183 132 L225 119 L265 125 L303 109 L338 116 L373 98 L406 104 L438 84 L466 91 L490 69 L514 79 L536 44 L550 71 L566 19 L580 58 L595 31 L620 54"/>
          </svg>
          <div className="volatility-threshold"><span>SAFE RANGE</span></div><strong>$861.42 <small>+4.7% / 1m</small></strong>
          <footer><span>14:31</span><span>14:33</span><span>14:35</span><span>14:36</span></footer>
        </div>
        <div className="volatility-meter"><span><small>VOLATILITY SCORE</small><b>92 / 100</b></span><div><i/></div><em>Abnormal</em></div>
        <div className="volatility-checks">{checks.map(item=><article key={item.label}><span><b>{item.label}</b><small>{item.value}</small></span><div><i style={{width:item.width+"%"}}/></div><em>{item.state}</em></article>)}</div>
      </section>

      <section className="volatility-safety">
        <header><div><span>DETERMINISTIC SAFETY GATE</span><h2>AI cannot override this pause.</h2></div><i>LOCKED</i></header>
        <div><article><i>×</i><span><b>New entry</b><small>Blocked before order engine</small></span><em>Rejected</em></article><article><i>✓</i><span><b>Open positions</b><small>Stop-loss remains active</small></span><em>Protected</em></article><article><i>⌁</i><span><b>Market analysis</b><small>Signals still recorded</small></span><em>Watching</em></article></div>
      </section>

      <section className="volatility-cooldown">
        <div className="cooldown-ring"><span>04:38</span><small>MIN LEFT</small></div>
        <div><span>COOLING WINDOW</span><h2>AI will recheck—resume is never automatic.</h2><p>After the timer, ATR, spread and liquidity are tested again. A new paper entry becomes eligible only when every check is normal.</p></div>
        <ul><li><i>1</i>Five-minute cooling period completes</li><li><i>2</i>Three stable candles are required</li><li><i>3</i>Spread must return below 0.12%</li></ul>
      </section>
    </section> : <section className="volatility-ack">
      <div className="volatility-ack-icon"><i>✓</i><span/><b/></div>
      <span>SAFETY STATE ACKNOWLEDGED</span>
      <h1>AI is watching.<br/><em>Capital is waiting.</em></h1>
      <p>The volatility block remains active. Acknowledging the alert does not reopen trading or bypass any rule.</p>
      <article><header><div><i>B</i><span><b>BNB/USDT</b><small>Volatility protection active</small></span></div><em>NO TRADE</em></header><section><span>Cooling time<b>04:38</b></span><span>Volatility score<b>92 / 100</b></span><span>Next action<b>Automatic recheck</b></span></section><footer><i/> Existing protective exits remain active</footer></article>
      <div><a href="/trade/safe-resume">Run safety recheck</a><a href="/trade/settings">Adjust future limits</a></div>
      <small>Paper mode only · Market values shown are illustrative</small>
    </section>}
  </main>;
}
