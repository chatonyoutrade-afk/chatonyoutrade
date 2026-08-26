import type { Metadata } from "next";
import { requireUser } from "../../auth";
import { isKycAdmin } from "../../../lib/kyc-admin";
import ReadinessDrillClient from "./readiness-drill-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Controlled Pilot Drill — NEOCRAFT LLP", description: "Restricted operational-readiness rehearsal for ChatOnYou Trade.", robots: { index: false, follow: false } };

export default async function ReadinessDrillPage(){
 const user=await requireUser("/admin/readiness-drill");
 if(!isKycAdmin(user))return <main className="admin-kyc-shell"><header className="admin-kyc-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>NEOCRAFT LLP · PILOT CONTROL</span><a href="/">Exit</a></header><section className="admin-access-denied"><i>◇</i><span>RESTRICTED OPERATIONS</span><h1>Readiness reviewer access required.</h1><p>Your verified account is not in the server-side reviewer allowlist.</p><a href="/logout">Use another account</a></section></main>;
 return <ReadinessDrillClient reviewerEmail={user.email}/>;
}
