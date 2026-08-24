"use client";

import { useState } from "react";

type Category = "Trade" | "Risk" | "AI" | "Bot";
type Notice = { id: number; category: Category; icon: string; title: string; text: string; time: string; action?: string; href?: string };

const notices: Notice[] = [
  { id: 1, category: "Trade", icon: "↗", title: "BTC paper position opened", text: "₹500 BUY position opened with stop-loss and take-profit protection.", time: "Just now", action: "View position", href: "/trade/portfolio" },
  { id: 2, category: "Risk", icon: "◇", title: "Risk check passed", text: "Planned loss is ₹6.00—below your ₹100 per-trade limit.", time: "2 min ago", action: "Risk settings", href: "/trade/settings" },
  { id: 3, category: "AI", icon: "✦", title: "High-confidence ETH opportunity", text: "AI confidence reached 83%. Review the reasoning before taking action.", time: "18 min ago", action: "Review signal", href: "/trade/ai" },
  { id: 4, category: "Bot", icon: "◉", title: "Momentum bot stayed out", text: "The setup did not meet the 80% confidence rule. No trade was placed.", time: "1 hr ago", action: "Open bot", href: "/trade/bots" },
  { id: 5, category: "Trade", icon: "✓", title: "SOL target reached", text: "Paper position closed at the planned target with +₹31.40 simulated P&L.", time: "Yesterday", action: "Trade history", href: "/trade/history" },
  { id: 6, category: "Risk", icon: "!", title: "Volatility protection activated", text: "New paper entries were paused for 6 minutes during abnormal price movement.", time: "Yesterday", action: "View event", href: "/trade/volatility-pause" },
];
const filters = ["All", "Unread", "Trade", "Risk", "AI", "Bot"] as const;
type Filter = typeof filters[number];

export default function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const [read, setRead] = useState<Set<number>>(() => new Set([5, 6]));
  const visible = notices.filter((item) => filter === "All" || filter === "Unread" ? filter === "All" || !read.has(item.id) : item.category === filter);
  const unread = notices.length - read.size;
  const markRead = (id: number) => setRead((current) => new Set([...current, id]));
  const markAllRead = () => setRead(new Set(notices.map((item) => item.id)));

  return <main className="notification-shell">
    <header className="notification-top"><a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><div><b>Notification center</b><span><i/> Paper account</span></div><a href="/trade">×</a></header>
    <section className="notification-main">
      <header className="notification-head"><div><span>ACTIVITY &amp; ALERTS</span><h1>Notifications</h1><p>Every important paper trade, AI decision and risk event—without the noise.</p></div><div><a href="/trade/settings">Alert settings</a><button onClick={markAllRead} disabled={unread===0}>Mark all as read</button></div></header>
      <div className="notification-summary"><article><i>●</i><span><small>UNREAD</small><b>{unread} alerts</b></span></article><article><i>◇</i><span><small>RISK ENGINE</small><b>Protected</b></span></article><article><i>✦</i><span><small>AI WATCHLIST</small><b>4 markets active</b></span></article></div>
      <nav className="notification-filters" aria-label="Notification filters">{filters.map(item=><button key={item} className={filter===item?"active":""} onClick={()=>setFilter(item)}>{item}{item==="Unread"&&unread>0?<i>{unread}</i>:null}</button>)}</nav>
      <div className="notification-layout">
        <section className="notification-list" aria-live="polite">{visible.length?visible.map(item=><article key={item.id} className={read.has(item.id)?"read":"unread"} onClick={()=>markRead(item.id)}><i className={`notice-${item.category.toLowerCase()}`}>{item.icon}</i><div><header><span>{item.category}</span><small>{item.time}</small></header><h2>{item.title}</h2><p>{item.text}</p>{item.href?<a href={item.href}>{item.action} <b>→</b></a>:null}</div>{!read.has(item.id)?<em aria-label="Unread notification"/>:null}</article>):<div className="notification-empty"><i>✓</i><h2>You’re all caught up.</h2><p>No notifications match this filter.</p><button onClick={()=>setFilter("All")}>Show all notifications</button></div>}</section>
        <aside className="notification-side"><section><span>DELIVERY CHANNELS</span><div><i>●</i><p><b>In-app alerts</b><small>Active on this device</small></p><em>ON</em></div><div><i>✉</i><p><b>Email summaries</b><small>Not connected</small></p><a href="/trade/settings">Set up</a></div><div><i>⌁</i><p><b>WhatsApp alerts</b><small>Not connected</small></p><a href="/trade/settings">Set up</a></div></section><div className="notification-safety"><i>◇</i><p><b>Critical alerts stay visible</b><small>Emergency Stop, daily-loss and volatility events are never hidden by normal filters.</small></p></div><a href="/trade/emergency-stop">Open Emergency Stop →</a></aside>
      </div>
      <p className="notification-note">Demo notification data · External email and WhatsApp delivery remain disconnected</p>
    </section>
  </main>;
}
