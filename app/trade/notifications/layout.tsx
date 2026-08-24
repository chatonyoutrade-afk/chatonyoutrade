import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications — ChatOnYou Trade",
  description: "Paper-trade, AI, bot and risk notifications for ChatOnYou Trade.",
  openGraph: { title: "Notifications — ChatOnYou Trade", description: "Review paper-trade, AI, bot and risk alerts.", images: [] },
  twitter: { title: "Notifications — ChatOnYou Trade", description: "Review paper-trade, AI, bot and risk alerts.", images: [] },
};

export default function NotificationsLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
