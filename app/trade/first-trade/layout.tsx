import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "First Paper Trade — ChatOnYou Trade",
  description: "A guided first paper-trade experience with AI reasoning and risk checks.",
  openGraph: { title: "First Paper Trade — ChatOnYou Trade", description: "Select a market, review an AI signal and execute a protected paper trade.", images: [] },
  twitter: { title: "First Paper Trade — ChatOnYou Trade", description: "Select a market, review an AI signal and execute a protected paper trade.", images: [] },
};

export default function FirstTradeLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
