import { requireChatGPTUser } from "../../chatgpt-auth";
import { isKycAdmin } from "../../../lib/kyc-admin";
import AdminKycClient from "./review-client";

export const dynamic = "force-dynamic";

export default async function AdminKycPage() {
  const user = await requireChatGPTUser("/admin/kyc");
  if (!isKycAdmin(user)) return <main className="admin-kyc-shell"><header className="admin-kyc-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>NEOCRAFT LLP · KYC OPERATIONS</span><a href="/">Exit</a></header><section className="admin-access-denied"><i>◇</i><span>RESTRICTED OPERATIONS</span><h1>KYC admin access required.</h1><p>Your signed-in email is not included in the server-side KYC reviewer allowlist.</p><a href="/signout-with-chatgpt?return_to=%2Flogin">Use another account</a></section></main>;
  return <AdminKycClient reviewerEmail={user.email}/>;
}
