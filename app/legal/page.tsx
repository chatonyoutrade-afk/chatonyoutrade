export default function Legal(){
 return <main className="legal-shell">
  <header><a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><a href="/login">Back to sign in</a></header>
  <section className="legal-main"><span>LEGAL &amp; SAFETY</span><h1>Clear terms for a<br/><em>paper-trading product.</em></h1><p className="legal-intro">Last updated 24 August 2026. ChatOnYou Trade is a simulated trading workspace, not a broker, exchange or investment adviser.</p>
   <nav><a href="#privacy">Privacy</a><a href="#terms">Terms</a><a href="#risk">Risk disclosure</a></nav>
   <article id="privacy"><span>01</span><div><h2>Privacy</h2><p>Your authenticated email and display name identify your paper account. The service stores virtual balances, risk settings, simulated orders and audit events needed to provide the product.</p><p>Binance public market requests do not require your exchange credentials. Optional Binance Spot Testnet credentials are encrypted server-side and are never displayed after connection. Withdrawal access is not implemented.</p></div></article>
   <article id="terms"><span>02</span><div><h2>Terms of use</h2><p>Use the product only for learning, testing and evaluating simulated strategies. Do not treat AI signals, backtests or illustrative portfolio values as personalized financial advice or a promise of future performance.</p><p>You remain responsible for reviewing every action. Automated paper and Testnet features operate within configured safety rules; real-money execution remains intentionally locked.</p></div></article>
   <article id="risk"><span>03</span><div><h2>Risk disclosure</h2><p>Crypto assets are volatile and can lose substantial value. Historical candles, backtest returns, confidence scores and demo results may not reflect live liquidity, fees, slippage, outages or changing market conditions.</p><p>No real funds are held by this website. Paper balances have no cash value. Never paste API keys, passwords or recovery phrases into chat.</p></div></article>
   <footer><p>Questions about these notices can be raised before using any future real-account feature.</p><a href="/login">I understand · Return to sign in →</a></footer>
  </section>
 </main>
}
