import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client KYC — ChatOnYou Trade",
  description: "A guided client identity, address, document, selfie and bank-verification flow for ChatOnYou Trade.",
  openGraph: { title: "Client KYC — ChatOnYou Trade", description: "Guided identity, address, document, selfie and bank verification.", images: [] },
  twitter: { title: "Client KYC — ChatOnYou Trade", description: "Guided identity, address, document, selfie and bank verification.", images: [] },
};

export default function KycLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
