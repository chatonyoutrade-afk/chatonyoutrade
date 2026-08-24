"use client";

import { useEffect,useMemo,useState } from "react";

type Region={id:string,country:string,flag:string,language:string,langCode:string,currency:string,symbol:string,locale:string,timezone:string};
const regions:Region[]=[
 {id:"IN",country:"India",flag:"🇮🇳",language:"हिन्दी + English",langCode:"HI",currency:"Indian Rupee",symbol:"₹",locale:"hi-IN",timezone:"Asia/Kolkata"},
 {id:"US",country:"United States",flag:"🇺🇸",language:"English",langCode:"EN",currency:"US Dollar",symbol:"$",locale:"en-US",timezone:"America/New_York"},
 {id:"AE",country:"United Arab Emirates",flag:"🇦🇪",language:"العربية + English",langCode:"AR",currency:"UAE Dirham",symbol:"د.إ",locale:"ar-AE",timezone:"Asia/Dubai"},
 {id:"ES",country:"Spain",flag:"🇪🇸",language:"Español",langCode:"ES",currency:"Euro",symbol:"€",locale:"es-ES",timezone:"Europe/Madrid"},
 {id:"FR",country:"France",flag:"🇫🇷",language:"Français",langCode:"FR",currency:"Euro",symbol:"€",locale:"fr-FR",timezone:"Europe/Paris"},
];
const copy:Record<string,{hello:string,title:string,watching:string,decision:string,reason:string,balance:string,trade:string,settings:string,notice:string}>={
 HI:{hello:"नमस्ते",title:"AI बाजार देख रहा है",watching:"24 क्रिप्टो मार्केट पर नज़र",decision:"अभी ट्रेड नहीं",reason:"BTC confidence 64% है—AI confirmation का इंतज़ार कर रहा है।",balance:"डेमो बैलेंस",trade:"ट्रेड",settings:"सेटिंग्स",notice:"सरल हिन्दी + familiar English trading terms"},
 EN:{hello:"Hello",title:"AI is watching the market",watching:"Monitoring 24 crypto markets",decision:"NO TRADE",reason:"BTC confidence is 64%—AI is waiting for confirmation.",balance:"Demo balance",trade:"Trade",settings:"Settings",notice:"Clear English across the full product"},
 AR:{hello:"مرحباً",title:"الذكاء الاصطناعي يراقب السوق",watching:"مراقبة 24 سوقاً للعملات الرقمية",decision:"لا توجد صفقة",reason:"ثقة BTC هي 64٪ — ينتظر الذكاء الاصطناعي التأكيد.",balance:"الرصيد التجريبي",trade:"تداول",settings:"الإعدادات",notice:"واجهة عربية مع مصطلحات تداول واضحة"},
 ES:{hello:"Hola",title:"La IA vigila el mercado",watching:"Analizando 24 mercados cripto",decision:"SIN OPERACIÓN",reason:"La confianza de BTC es 64%; la IA espera confirmación.",balance:"Saldo demo",trade:"Operar",settings:"Ajustes",notice:"Experiencia completa en español"},
 FR:{hello:"Bonjour",title:"L’IA surveille le marché",watching:"Analyse de 24 marchés crypto",decision:"PAS DE TRADE",reason:"La confiance BTC est de 64 % ; l’IA attend une confirmation.",balance:"Solde démo",trade:"Trader",settings:"Paramètres",notice:"Expérience complète en français"},
};

export default function Localization(){
 const [region,setRegion]=useState(regions[0]),[auto,setAuto]=useState(true),[step,setStep]=useState<"choose"|"saved">("choose"),[query,setQuery]=useState("");
 const text=copy[region.langCode],rtl=region.langCode==="AR";
 const filtered=useMemo(()=>regions.filter(r=>(r.country+r.language+r.currency).toLowerCase().includes(query.toLowerCase())),[query]);
 const displayValue=region.id==="IN"?"₹10,842.00":region.id==="US"?"$129.72":region.id==="AE"?"د.إ 476.44":"€119.04";
 useEffect(()=>{const saved=window.localStorage.getItem("chatonyou-region");const match=regions.find(item=>item.id===saved);if(match){setRegion(match);setAuto(false)}},[]);
 const savePreference=()=>{window.localStorage.setItem("chatonyou-region",region.id);const language=region.langCode==="HI"?"HI":"EN";window.localStorage.setItem("chatonyou-language",language);window.dispatchEvent(new CustomEvent("chatonyou-language-change",{detail:language}));setStep("saved")};
 return <main className="locale-shell">
  <header className="locale-top"><a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><div><span>Language &amp; region</span><b>{region.flag} {region.country} · {region.langCode}</b></div><a href="/trade/settings">×</a></header>
  {step==="saved"?<section className="locale-saved"><div className="locale-success-orbit"><i>✓</i><b>{region.flag}</b></div><span>PREFERENCES UPDATED · THIS DEVICE</span><h1>{text.hello}!<br/><em>ChatOnYou is ready.</em></h1><p>{region.language} and {region.currency} will be used across onboarding, AI explanations and account values.</p><article dir={rtl?"rtl":"ltr"}><header><div><i>✦</i><span><b>{text.title}</b><small>{text.watching}</small></span></div><em>{region.langCode}</em></header><section><span>{text.balance}<b>{displayValue}</b></span><span>{text.decision}<b>64%</b></span></section><p>{text.reason}</p><footer><span>BTC/USDT · Crypto Spot</span><b>{region.timezone}</b></footer></article><div><a href="/trade">{text.trade} <span>→</span></a><button onClick={()=>setStep("choose")}>Change preference</button></div><small>Display preference saved on this device · No trading rules were changed</small></section>:
  <section className="locale-main">
   <aside className="locale-copy"><span>LOCAL, BY DEFAULT</span><h1>Trading should speak<br/><em>your language.</em></h1><p>ChatOnYou adapts onboarding, AI explanations, alerts and account values to the user’s region.</p><div className="locale-detect"><i>◎</i><span><b>Detected: India</b><small>Hindi-friendly · INR display · IST</small></span><em>Auto</em></div><div className="locale-principles"><span><i>✓</i><b>Crypto only</b><small>BTC, ETH, SOL, BNB and other crypto assets.</small></span><span><i>✓</i><b>Local explanation</b><small>AI reasoning in language users understand.</small></span><span><i>✓</i><b>Trading terms stay familiar</b><small>BUY, SELL, Stop Loss and Take Profit remain clear.</small></span></div><p className="locale-api-note">Your selection is stored on this device and can be changed anytime.</p></aside>
   <section className="locale-card">
    <header><div><span>DISPLAY PREFERENCES</span><h2>Choose your experience</h2></div><em>{region.flag} {region.id}</em></header>
    <label className="locale-auto"><span><i>◎</i><b>Choose automatically<small>Use device language and approximate region.</small></b></span><button className={auto?"on":""} onClick={()=>setAuto(!auto)}><i/></button></label>
    <div className="locale-search"><i>⌕</i><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search country or language"/></div>
    <div className="locale-region-list">{filtered.map(r=><button className={region.id===r.id?"active":""} onClick={()=>{setRegion(r);setAuto(false)}} key={r.id}><i>{r.flag}</i><span><b>{r.country}</b><small>{r.language}</small></span><span><b>{r.symbol} · {r.currency}</b><small>{r.timezone}</small></span><em>{region.id===r.id?"✓":""}</em></button>)}</div>
    <section className="locale-preview" dir={rtl?"rtl":"ltr"}><header><span>LIVE UI PREVIEW</span><b>{region.langCode}</b></header><div className="locale-mini-top"><i>✦</i><span><b>{text.title}</b><small>{text.watching}</small></span><strong>{displayValue}<small>{text.balance}</small></strong></div><div className="locale-mini-decision"><span><small>AI</small><b>{text.decision}</b></span><strong>64%<small>confidence</small></strong></div><p>{text.reason}</p><footer><span>{text.trade}</span><span>AI</span><span>{text.settings}</span></footer></section>
    <section className="locale-format"><header>REGIONAL FORMAT</header><div><span>Display currency<b>{region.symbol} · {region.currency}</b></span><span>Time zone<b>{region.timezone}</b></span><span>Crypto pair format<b>BTC/USDT</b></span><span>Interface direction<b>{rtl?"Right to left":"Left to right"}</b></span></div><p><i>i</i>Display currency changes how account values appear. It does not add forex or non-crypto trading.</p></section>
    <footer><span>{text.notice}</span><button onClick={savePreference}>Save &amp; apply <b>→</b></button></footer>
   </section>
  </section>}
 </main>
}
