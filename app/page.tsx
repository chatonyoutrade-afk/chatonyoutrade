"use client";

import { useEffect, useState } from "react";

const ticker = [
  ["BTC", "$113,240.80", "+2.84%"],
  ["ETH", "$4,216.12", "+1.36%"],
  ["SOL", "$182.44", "+4.21%"],
  ["BNB", "$846.20", "+0.92%"],
];

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [signal, setSignal] = useState(82);
  const [language,setLanguage]=useState<"EN"|"HI">("EN"),hi=language==="HI";

  useEffect(() => {
    const saved=window.localStorage.getItem("chatonyou-language");if(saved==="HI")setLanguage("HI");
    const id = window.setInterval(() => setSignal((value) => value >= 86 ? 80 : value + 1), 1800);
    return () => window.clearInterval(id);
  }, []);
  const switchLanguage=()=>{const next=hi?"EN":"HI";setLanguage(next);window.localStorage.setItem("chatonyou-language",next);window.dispatchEvent(new CustomEvent("chatonyou-language-change",{detail:next}))};

  return <main className={`landing ${hi?"landing-hi":""}`} lang={hi?"hi":"en"}>
    <nav className="landing-nav">
      <a className="logo-wrap" href="#top" aria-label="ChatOnYou Trade home"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><span>TRADE</span></a>
      <div className={`nav-links ${menu ? "open" : ""}`}><a href="#product">{hi?"प्रोडक्ट":"Product"}</a><a href="#safety">{hi?"सुरक्षा":"Safety"}</a><a href="#modes">AI Modes</a><a href="#how">{hi?"कैसे काम करता है":"How it works"}</a></div>
      <div className="nav-actions"><button className="landing-language" onClick={switchLanguage} aria-label={hi?"Switch to English":"हिन्दी में देखें"}>{hi?"EN":"हिंदी"}</button><a className="login-link" href="/login">{hi?"लॉग इन":"Log in"}</a><a className="nav-cta" href="/login">{hi?"डेमो खोलें":"Launch demo"} <span>↗</span></a></div>
      <button className="menu-button" onClick={() => setMenu(!menu)} aria-label="Toggle menu"><i/><i/></button>
    </nav>

    <section className="hero" id="top">
      <div className="hero-glow"/><div className="hero-grid"/>
      <div className="hero-copy">
        <div className="status-pill"><i/> CHATONYOU INTELLIGENCE <span>{hi?"पेपर मोड":"Paper mode"}</span></div>
        <h1>{hi?"समझदार ट्रेडिंग।":"Intelligent trading."}<br/><span>{hi?"AI की ताकत के साथ।":"Powered by AI."}</span></h1>
        <p>{hi?"मार्केट समझें, हर सिग्नल का कारण जानें और सख्त जोखिम सीमा के अंदर सुरक्षित पेपर ट्रेड करें।":"Read the market, explain every signal and execute inside strict risk limits—all from one calm trading workspace."}</p>
        <div className="hero-actions"><a className="primary-cta" href="/login">{hi?"वर्चुअल ट्रेडिंग शुरू करें":"Start virtual trading"} <span>↗</span></a><a className="secondary-cta" href="#product"><i>▶</i> {hi?"पूरा अनुभव देखें":"Explore the experience"}</a></div>
        <small>{hi?"कोई कार्ड नहीं · असली पैसा नहीं · केवल परीक्षण":"No card · No real money · Built for testing"}</small>
      </div>

      <div className="hero-product" id="product">
        <div className="product-aura"/>
        <div className="terminal-window">
          <div className="terminal-bar"><div className="mini-logo"><img src="/chatonyou-logo.png" alt=""/><b>TRADE</b></div><div className="market-live"><i/> Market live</div><div className="demo-balance"><small>DEMO</small><b>₹10,842.00</b></div></div>
          <div className="terminal-body">
            <div className="terminal-sidebar"><b>↗</b><span>✦</span><span>◉</span><span>▰</span><span>⌁</span></div>
            <div className="terminal-chart">
              <div className="preview-price"><small>BTC / USDT</small><strong>$113,240.80</strong><em>+2.84%</em></div>
              <div className="preview-grid">
                <div className="preview-candles">{Array.from({length:34}).map((_,i)=><i key={i} className={i%4===1?"red":"green"} style={{height:`${18+(i*13)%56}px`,bottom:`${14+(i*7)%64}px`,animationDelay:`${i*.045}s`}}><b/></i>)}</div>
                <div className="preview-line"/><div className="preview-marker">113,240</div>
              </div>
              <div className="preview-tabs"><b>OPEN POSITIONS <i>1</i></b><span>ORDERS</span><span>HISTORY</span><span>AI ACTIVITY</span></div>
              <div className="position-preview"><b>₿ BTC/USDT</b><span>Entry<em>$113,240</em></span><span>Unrealised P&amp;L<em>+₹42.60</em></span></div>
            </div>
            <aside className="preview-ai">
              <div className="preview-ai-head"><b>✦ AI Trader</b><span><i/> Watching</span></div>
              <div className="preview-signal"><small>LIVE SIGNAL</small><div><strong>BUY</strong><b>{signal}<i>%</i></b></div><span><i style={{width:`${signal}%`}}/></span><p>Momentum and volume support a controlled long entry.</p></div>
              <div className="preview-levels"><span>Entry<b>$113,240</b></span><span>Stop loss<b>$111,900</b></span><span>Take profit<b>$116,800</b></span><span>Risk<b>0.8%</b></span></div>
              <button onClick={()=>window.location.href="/login"}>{hi?"पेपर ट्रेड करें":"Execute paper trade"} <span>→</span></button>
            </aside>
          </div>
        </div>
        <div className="float-card float-risk"><span>◆</span><div><small>Risk engine</small><b>Protected</b></div><i>✓</i></div>
        <div className="float-card float-decision"><span>✦</span><div><small>Last decision</small><b>NO TRADE · 64%</b></div></div>
        <a className="scroll-cue" href="#safety" aria-label="Scroll to product details"><span>SCROLL TO EXPLORE</span><i>↓</i></a>
      </div>
    </section>

    <section className="market-ticker" aria-label="Market prices"><div>{[...ticker,...ticker].map((coin,i)=><span key={i}><b>{coin[0]}</b><em>{coin[1]}</em><i>{coin[2]}</i></span>)}</div></section>

    <section className="control-section" id="safety">
      <div className="section-kicker"><i/> {hi?"आपके नियंत्रण के लिए बनाया गया":"BUILT AROUND CONTROL"}</div>
      <div className="section-heading"><h2>{hi?"सही समय पर कार्रवाई।":"Smart enough to act."}<br/><span>{hi?"कमज़ोर सेटअप पर रुकना।":"Disciplined enough to stop."}</span></h2><p>{hi?"AI हर मार्केट मूव पर ट्रेड नहीं करता। सेटअप कमज़ोर हो तो BUY या SELL की जगह इंतज़ार करता है।":"AI should not trade every market move. ChatOnYou Trade can choose BUY, SELL—or wait when the setup is weak."}</p></div>
      <div className="control-grid">
        <article className="control-card decision-card"><div className="card-icon">✦</div><span>{hi?"AI का फैसला":"AI DECISION"}</span><h3>NO TRADE</h3><p>{hi?"BTC confidence केवल 64% है। मजबूत confirmation का इंतज़ार जारी है।":"BTC confidence is only 64%. Waiting for stronger confirmation."}</p><div className="decision-meter"><i/><i/><i/><i className="dim"/><i className="dim"/></div><small>{hi?"पूंजी सुरक्षित":"Capital protected"}</small></article>
        <article className="control-card rules-card"><div className="card-icon">⌁</div><span>{hi?"आपके जोखिम नियम":"YOUR RISK RULES"}</span><h3>{hi?"हर ट्रेड की सीमा है।":"Every trade has limits."}</h3><ul><li><b>1%</b><span>{hi?"हर ट्रेड का अधिकतम जोखिम":"Maximum risk per trade"}</span></li><li><b>3%</b><span>{hi?"रोज़ का अधिकतम नुकसान":"Daily maximum loss"}</span></li><li><b>2</b><span>{hi?"एक साथ खुली पोज़िशन":"Simultaneous positions"}</span></li></ul></article>
        <article className="control-card explain-card"><div className="card-icon">◎</div><span>{hi?"स्पष्ट कारण":"TRANSPARENT REASONING"}</span><h3>{hi?"जानें AI ने ऐसा क्यों किया।":"Know why AI acted."}</h3><div className="reason-lines"><p><i/> {hi?"EMA ट्रेंड तेज़":"EMA trend bullish"}</p><p><i/> {hi?"वॉल्यूम औसत से ऊपर":"Volume above average"}</p><p><i/> {hi?"ब्रेकआउट कन्फर्म":"Breakout confirmed"}</p></div><a href="/trade">{hi?"लाइव विश्लेषण खोलें":"Open live analysis"} <b>→</b></a></article>
      </div>
    </section>

    <section className="modes-section" id="modes">
      <div className="modes-copy"><div className="section-kicker"><i/> {hi?"ऑटोमेशन के तीन स्तर":"THREE LEVELS OF AUTOMATION"}</div><h2>{hi?"मदद के साथ शुरू करें।":"Start assisted."}<br/>{hi?"तैयार होने पर ऑटोमेट करें।":"Automate when ready."}</h2><p>{hi?"AI को कितना नियंत्रण देना है, यह आप तय करते हैं। हर strategy की जाँच तक Paper mode सुरक्षित default रहता है।":"You decide how much control AI gets. Paper mode stays the safe default while you test every strategy."}</p><a href="/trade">{hi?"AI Copilot आज़माएँ":"Try AI Copilot"} <span>↗</span></a></div>
      <div className="mode-stack">
        <article><div><span>01</span><i>✦</i></div><h3>AI Copilot</h3><p>{hi?"AI मार्केट देखता है। अंतिम फैसला हमेशा आपका रहता है।":"AI analyses the market. You make every final decision."}</p><b>{hi?"केवल सिग्नल":"Signals only"}</b></article>
        <article className="featured"><div><span>02</span><i>↗</i></div><h3>AI Assisted</h3><p>{hi?"AI मौका खोजकर आपकी मंज़ूरी के लिए पूरा ऑर्डर तैयार करता है।":"AI finds opportunities and prepares the complete order for approval."}</p><b>{hi?"एक क्लिक मंज़ूरी":"One-click approve"}</b></article>
        <article><div><span>03</span><i>◉</i></div><h3>AI Auto</h3><p>{hi?"AI आपके सख्त जोखिम नियमों के अंदर अपने आप entry और exit करता है।":"AI enters and exits automatically inside your strict risk rules."}</p><b>{hi?"नियंत्रित ऑटोमेशन":"Controlled automation"}</b></article>
      </div>
    </section>

    <section className="steps-section" id="how">
      <div className="section-kicker"><i/> {hi?"यह कैसे काम करता है":"HOW IT WORKS"}</div><h2>{hi?"मार्केट के शोर से":"From market noise"}<br/>{hi?"एक साफ़ फैसले तक।":"to one clear decision."}</h2>
      <div className="steps-line"><i/></div>
      <div className="steps-grid">
        <article><span>01</span><div className="step-symbol">⌁</div><h3>{hi?"लाइव मार्केट डेटा":"Live market data"}</h3><p>{hi?"कीमत, candles, volume और order-book pressure लगातार आते हैं।":"Prices, candles, volume and order-book pressure enter continuously."}</p></article>
        <article><span>02</span><div className="step-symbol">✦</div><h3>{hi?"AI सिग्नल इंजन":"AI signal engine"}</h3><p>{hi?"तकनीकी संकेत मिलकर BUY, SELL या NO TRADE बनाते हैं।":"Technical factors combine into BUY, SELL or NO TRADE."}</p></article>
        <article><span>03</span><div className="step-symbol">◇</div><h3>{hi?"जोखिम जाँच":"Risk check"}</h3><p>{hi?"Position size, stop-loss और daily limits पहले जाँचे जाते हैं।":"Position size, stop-loss and daily limits are validated first."}</p></article>
        <article><span>04</span><div className="step-symbol">↗</div><h3>{hi?"पेपर ट्रेड":"Paper execution"}</h3><p>{hi?"Virtual order save होता है और performance अपने आप update होती है।":"The virtual order is recorded and performance updates automatically."}</p></article>
      </div>
    </section>

    <section className="performance-section">
      <div className="performance-panel">
        <div className="performance-copy"><div className="section-kicker"><i/> {hi?"बिना बढ़ा-चढ़ाकर प्रदर्शन":"PERFORMANCE, WITHOUT THE HYPE"}</div><h2>{hi?"AI को मापें।":"Measure the AI."}<br/>{hi?"सिर्फ भरोसा न करें।":"Don’t just trust it."}</h2><p>{hi?"Exchange जोड़ने से पहले हर simulated trade, drawdown और decision को track करें।":"Track every simulated trade, drawdown and decision before you ever consider connecting an exchange."}</p><a href="/trade">{hi?"पेपर डैशबोर्ड खोलें":"Explore paper dashboard"} <span>→</span></a></div>
        <div className="performance-ui"><header><span>AI ACCOUNT · PAPER</span><i>Last 30 days</i></header><strong>₹10,842.00</strong><small>Started with ₹10,000</small><div className="perf-chart"><i/><b>+8.42%</b></div><div className="perf-stats"><span><small>Trades</small><b>34</b></span><span><small>Win rate</small><b>61.7%</b></span><span><small>Max drawdown</small><b>-2.8%</b></span></div><em>Illustrative paper-trading data</em></div>
      </div>
    </section>

    <section className="final-cta"><div className="cta-orb"/><img src="/chatonyou-logo.png" alt="ChatOnYou"/><h2>{hi?"AI को मार्केट देखने दें।":"Let AI watch the market."}<br/><span>{hi?"अंतिम फैसला आपका रहे।":"You keep the final say."}</span></h2><p>{hi?"₹10,000 virtual balance से शुरू करें और पूरा अनुभव सुरक्षित तरीके से जाँचें।":"Start with ₹10,000 virtual balance and test the full experience safely."}</p><a href="/login">{hi?"पेपर अकाउंट बनाएँ":"Set up paper account"} <span>↗</span></a><small>{hi?"केवल पेपर ट्रेडिंग · रिटर्न की गारंटी नहीं":"Paper trading only · No guaranteed returns"}</small></section>

    <footer className="mega-footer">
      <div className="mega-footer-top">
        <section className="mega-footer-brand"><a className="footer-logo" href="#top"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><p>{hi?"AI की समझ, जोखिम पर आपका नियंत्रण। पहले सुरक्षित पेपर ट्रेडिंग में परखें।":"AI intelligence with risk kept in your control. Prove every strategy in paper trading first."}</p><span>{hi?"हमसे जुड़ें":"Follow us"}</span><nav aria-label="Social links"><a href="#top" aria-label="Telegram">➤</a><a href="#top" aria-label="Instagram">◎</a><a href="#top" aria-label="YouTube">▶</a><a href="#top" aria-label="LinkedIn">in</a><a href="#top" aria-label="X">𝕏</a></nav></section>
        <section className="mega-footer-trust"><article><i>✓</i><span><b>{hi?"सुरक्षा पहले":"SAFETY FIRST"}</b><small>{hi?"हर ऑर्डर से पहले जोखिम जाँच":"Risk checks before every order"}</small></span></article><article><i>◇</i><span><b>{hi?"पेपर मोड":"PAPER MODE"}</b><small>{hi?"असली फंड इस्तेमाल नहीं होते":"No real funds are used"}</small></span></article></section>
        <section className="mega-footer-contact"><span>{hi?"आपकी मदद के लिए उपलब्ध":"WE’RE HERE TO HELP"}</span><p>{hi?"सहायता ईमेल":"Email support"}<a href="mailto:support@chatonyou.com">support@chatonyou.com</a></p><p>{hi?"शुरुआती गाइड":"Beginner guide"}<a href="/trade/guide">{hi?"AI गाइड खोलें":"Open AI Guide"} →</a></p></section>
      </div>
      <div className="mega-footer-links">
        <section className="footer-link-group footer-products"><h3>{hi?"प्रोडक्ट":"Products"}</h3><div><a href="/trade">{hi?"ट्रेडिंग टर्मिनल":"Trading terminal"}</a><a href="/trade/markets">{hi?"क्रिप्टो मार्केट":"Crypto markets"}</a><a href="/trade/ai">AI Decisions</a><a href="/trade/bots">AI Paper Bots</a><a href="/trade/backtest">Backtesting</a><a href="/trade/portfolio">{hi?"पोर्टफोलियो":"Portfolio"}</a><a href="/trade/analytics">{hi?"प्रदर्शन विश्लेषण":"Performance analytics"}</a><a href="/trade/testnet">Binance Testnet</a></div></section>
        <section className="footer-link-group"><h3>{hi?"सुरक्षा और नीतियाँ":"Safety & policies"}</h3><div><a href="/compliance">{hi?"अनुपालन तैयारी":"Compliance readiness"}</a><a href="/kyc">{hi?"क्लाइंट KYC":"Client KYC"}</a><a href="/terms">{hi?"नियम और शर्तें":"Terms of use"}</a><a href="/privacy">{hi?"गोपनीयता नीति":"Privacy policy"}</a><a href="/risk-disclosure">{hi?"जोखिम सूचना":"Risk disclosure"}</a><a href="/trade/settings">{hi?"जोखिम सेटिंग्स":"Risk settings"}</a><a href="/trade/emergency-stop">{hi?"आपातकालीन रोक":"Emergency stop"}</a></div></section>
        <section className="footer-link-group"><h3>{hi?"कंपनी":"Company"}</h3><div><a href="/about">{hi?"हमारे बारे में":"About ChatOnYou"}</a><a href="/how-it-works">{hi?"यह कैसे काम करता है":"How it works"}</a><a href="/help">{hi?"सहायता केंद्र":"Help center"}</a><a href="/contact">{hi?"संपर्क करें":"Contact us"}</a><a href="/create-account">{hi?"अकाउंट बनाएँ":"Create account"}</a></div></section>
      </div>
      <div className="mega-footer-markets"><h3>{hi?"समर्थित क्रिप्टो मार्केट":"Supported crypto markets"}</h3><div><a href="/trade/markets?asset=BTC">Bitcoin</a><a href="/trade/markets?asset=ETH">Ethereum</a><a href="/trade/markets?asset=SOL">Solana</a><a href="/trade/markets?asset=BNB">BNB</a><a href="/trade/markets?asset=XRP">XRP</a><a href="/trade/markets?asset=ADA">Cardano</a><a href="/trade/markets?asset=DOGE">Dogecoin</a><a href="/trade/markets?asset=AVAX">Avalanche</a><a href="/trade/markets?asset=LINK">Chainlink</a><a href="/trade/markets?asset=DOT">Polkadot</a><a href="/trade/markets?asset=MATIC">Polygon</a><a href="/trade/markets?asset=UNI">Uniswap</a></div></div>
      <div className="mega-footer-bottom"><p>{hi?"© 2026 ChatOnYou Trade. सभी अधिकार सुरक्षित।":"© 2026 ChatOnYou Trade. All rights reserved."}</p><span>{hi?"केवल पेपर ट्रेडिंग · डेटा उदाहरण मात्र · रिटर्न की गारंटी नहीं":"Paper trading only · Illustrative data · No guaranteed returns"}</span><a href="#top">{hi?"ऊपर जाएँ":"Back to top"} ↑</a></div>
    </footer>
  </main>;
}
