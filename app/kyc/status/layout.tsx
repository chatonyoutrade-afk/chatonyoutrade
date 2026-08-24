import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KYC Status — ChatOnYou Trade",
  description: "Track client KYC verification and account-activation status.",
  openGraph: { title: "KYC Status — ChatOnYou Trade", description: "Track identity verification and account activation.", images: [] },
  twitter: { title: "KYC Status — ChatOnYou Trade", description: "Track identity verification and account activation.", images: [] },
};

export default function KycStatusLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
