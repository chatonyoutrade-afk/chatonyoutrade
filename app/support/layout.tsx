import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Ticket — ChatOnYou Trade",
  description: "Create and track a ChatOnYou Trade support request.",
  openGraph: { title: "Support Ticket — ChatOnYou Trade", description: "Get help with account, KYC, paper trading, AI and safety issues.", images: [] },
  twitter: { title: "Support Ticket — ChatOnYou Trade", description: "Get help with account, KYC, paper trading, AI and safety issues.", images: [] },
};

export default function SupportLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
