import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "../../db";
import { kycApplications } from "../../db/schema";
import { requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function SetupLayout({ children }:{ children:React.ReactNode }) {
  const user = await requireChatGPTUser("/setup");
  const [kyc] = await getDb().select({ status: kycApplications.status }).from(kycApplications).where(eq(kycApplications.userEmail, user.email)).limit(1);
  if (kyc?.status !== "approved") redirect("/kyc/status");
  return children;
}
