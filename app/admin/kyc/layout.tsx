import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KYC Review — NEOCRAFT LLP",
  description: "Restricted KYC review and approval operations for authorised NEOCRAFT LLP staff.",
  robots: { index: false, follow: false },
};

export default function AdminKycLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }

