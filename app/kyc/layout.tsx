import type { Metadata } from "next";
import { requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client KYC — ChatOnYou Trade",
  description: "A guided client identity, address, document, selfie and bank-verification flow for ChatOnYou Trade.",
  openGraph: { title: "Client KYC — ChatOnYou Trade", description: "Guided identity, address, document, selfie and bank verification.", images: [] },
  twitter: { title: "Client KYC — ChatOnYou Trade", description: "Guided identity, address, document, selfie and bank verification.", images: [] },
};

export default async function KycLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireChatGPTUser("/kyc");
  return children;
}
