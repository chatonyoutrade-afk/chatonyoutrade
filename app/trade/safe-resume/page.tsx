"use client";

import { useState } from "react";

const resumeChecks = [
  { icon: "⌁", label: "ATR volatility", before: "3.8×", now: "1.1× normal", note: "Below 1.5× safety rule" },
  { icon: "↔", label: "Order-book spread", before: "0.42%", now: "0.08%", note: "Below 0.12% limit" },
  { icon: "≋", label: "Stable candles", before: "0 / 3", now: "3 / 3", note: "No abnormal 1m movement" },
  { icon: "◒", label: "Liquidity depth", before: "-61%", now: "+8%", note: "Depth returned to normal" },
];

export default function SafeResume() {
  const [stage, setStage] = useState<"ready" | "passed" | "resumed">("ready");

  return <main className="resume-shell">
    <header className="volatility-top resume-top">
      <a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a>
      <div><i>✓</i><span><b>Safety Recheck</b><small>Paper mode · Volatility recovery</small></span></div>
      <a href="/trade/ai">×</a>
    </header>

    {stage !== "resumed" ? <section className="resume-main">
      <div className="resume-hero">
        <span>{stage === "ready" ? "COOLING WINDOW COMPLETE" : "ALL SAFETY CHECKS PASSED"}</span>
        <h1>{stage === "ready" ? <>The market has calmed.<br/><em>Now the rules recheck.</em></> : <>Safe range confirmed.<br/><em>You stay in control.</em></>}</h1>
        <p>{stage === "ready" ? "The five-minute pause is complete. Before AI can resume, volatility, spread, candles and liquidity must be verified again." : "The deterministic risk engine confirmed recovery. Every new signal must still pass the normal entry rules after resume."}</p>
        <div className="resume-progress"><span className="done"><i>✓</i><b>Pause</b></span><em/><span className="done"><i>✓</i><b>Cool down</b></span><em/><span className={stage === "passed" ? "done" : "active"}><i>{stage === "passed" ? "✓" : "3"}</i><b>Recheck</b></span><em/><span className={stage === "passed" ? "active" : ""}><i>4</i><b>Resume</b></span></div>
      </div>

      <div className="resume-layout">
        <section className="resume-market-card">
          <header><div><i>B</i><span><b>BNB/USDT</b><small>Recovery snapshot · 14:41 IST</small></span></div><em>{stage === "passed" ? "ELIGIBLE" : "RECHECK READY"}</em></header>
          <div className="resume-chart">
            <svg viewBox="0 0 680 180" preserveAspectRatio="none" aria-label="Illustrative stabilized BNB market chart">
              <defs><linearGradient id="resumeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#53e99e" stopOpacity=".22"/><stop offset="1" stopColor="#53e99e" stopOpacity="0"/></linearGradient></defs>
              <path className="resume-fill" d="M0 126 L52 119 L105 124 L157 110 L210 114 L262 101 L315 108 L367 91 L420 96 L472 82 L525 88 L577 79 L630 83 L680 75 L680 180 L0 180 Z"/>
              <path className="resume-line" d="M0 126 L52 119 L105 124 L157 110 L210 114 L262 101 L315 108 L367 91 L420 96 L472 82 L525 88 L577 79 L630 83 L680 75"/>
            </svg>
            <div className="resume-safe-zone"><span>STABLE RANGE</span></div>
            <strong>$852.80 <small>+0.18% / 5m</small></strong>
            <footer><span>14:36</span><span>14:38</span><span>14:40</span><span>14:41</span></footer>
          </div>
          <div className="resume-score"><span><small>VOLATILITY SCORE</small><b>28 / 100</b></span><div><i/></div><em>Normal</em></div>
          <footer><i/> Market monitoring never stopped during the pause</footer>
        </section>

        <section className="resume-check-card">
          <header><div><span>RISK ENGINE RECHECK</span><h2>{stage === "ready" ? "Four gates must pass." : "Four of four passed."}</h2></div><em>{stage === "ready" ? "PENDING" : "PASSED"}</em></header>
          <div>{resumeChecks.map((item, index)=><article className={stage === "passed" ? "passed" : ""} key={item.label}><i>{stage === "passed" ? "✓" : item.icon}</i><span><b>{item.label}</b><small>{item.note}</small></span><em><small>{item.before}</small><b>{item.now}</b></em>{stage === "ready" && <strong style={{animationDelay:index*90+"ms"}}/>}</article>)}</div>
          {stage === "ready" ? <button onClick={()=>setStage("passed")}>Run deterministic recheck <b>→</b></button> : <div className="resume-pass-note"><i>✓</i><span><b>Safe to restore AI monitoring mode</b><small>This does not create a trade. It only allows future eligible signals.</small></span></div>}
        </section>
      </div>

      {stage === "passed" && <section className="resume-confirm-card">
        <div><span>BEFORE YOU RESUME</span><h2>Protection rules stay exactly the same.</h2><p>AI cannot change capital, confidence, stop-loss, daily-loss or volatility rules.</p></div>
        <ul><li><i>✓</i>80% minimum AI confidence</li><li><i>✓</i>1% maximum risk per trade</li><li><i>✓</i>Stop-loss always mandatory</li></ul>
        <button onClick={()=>setStage("resumed")}>Resume paper AI <b>→</b></button>
      </section>}
      <p className="resume-disclaimer">Illustrative paper-trading recovery · No real funds or exchange orders are involved</p>
    </section> : <section className="resume-success">
      <div className="resume-success-orbit"><i>✦</i><span/><b/></div>
      <span>PAPER AI RESUMED</span>
      <h1>Back to watching.<br/><em>Not rushing.</em></h1>
      <p>AI can analyse new opportunities again, but only signals passing every confidence and risk rule are eligible.</p>
      <article><header><div><i>B</i><span><b>BNB/USDT</b><small>Recovered from volatility pause</small></span></div><em>WATCHING</em></header><section><span>Current decision<b>NO TRADE</b></span><span>Confidence<b>67%</b></span><span>Required<b>80%</b></span></section><footer><i/> Waiting for a stronger setup—resume does not force a trade</footer></article>
      <div><a href="/trade/ai">Open AI dashboard</a><a href="/trade/ai/decision?coin=BNB">View latest decision</a></div>
      <small>Paper mode only · No real-money execution</small>
    </section>}
  </main>;
}
