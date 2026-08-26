import type { Metadata } from "next";
import { requireUser } from "../../auth";
import { isKycAdmin } from "../../../lib/kyc-admin";
import ComplianceEvidenceClient from "./register-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compliance Evidence — NEOCRAFT LLP",
  description: "Restricted metadata register for ChatOnYou Trade launch evidence.",
  robots: { index: false, follow: false },
};

export default async function ComplianceEvidencePage() {
  const user = await requireUser("/admin/compliance-evidence");
  if (!isKycAdmin(user)) return <main className="admin-kyc-shell"><header className="admin-kyc-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>NEOCRAFT LLP · COMPLIANCE EVIDENCE</span><a href="/">Exit</a></header><section className="admin-access-denied"><i>◇</i><span>RESTRICTED OPERATIONS</span><h1>Compliance reviewer access required.</h1><p>Your verified account is not in the server-side reviewer allowlist.</p><a href="/logout">Use another account</a></section></main>;
  return <ComplianceEvidenceClient reviewerEmail={user.email}/>;
}
