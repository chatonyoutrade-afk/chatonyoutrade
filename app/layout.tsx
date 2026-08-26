import type { Metadata } from "next";
import "./globals.css";
import "./landing-reference.css";
import "./flow-reference.css";
import "./public-info.css";
import "./kyc.css";
import "./kyc-status.css";
import "./admin-kyc.css";
import "./readiness-drill.css";
import "./first-trade.css";
import "./notifications.css";
import "./support.css";
import GlobalLanguage from "./global-language";

export const metadata: Metadata = {
  title: "ChatOnYou Trade — AI Trades, You Stay in Control",
  description: "AI-first crypto paper trading with transparent signals, strict risk rules, and ₹10,000 virtual balance.",
  openGraph: {
    title: "ChatOnYou Trade",
    description: "AI trades. You stay in control. Start safely with crypto paper trading.",
    images: ["https://chatonyou-trade.digitalmediastep.chatgpt.site/og-orange.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatOnYou Trade",
    description: "AI trades. You stay in control. Start safely with crypto paper trading.",
    images: ["https://chatonyou-trade.digitalmediastep.chatgpt.site/og-orange.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}<GlobalLanguage/></body>
    </html>
  );
}
