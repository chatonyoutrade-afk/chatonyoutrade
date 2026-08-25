import { requireUser } from "../auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { kycApplications } from "../../db/schema";

export const dynamic = "force-dynamic";

export default async function TradeLayout({children}:{children:React.ReactNode}){
 const user=await requireUser("/trade");
 const [kyc]=await getDb().select({status:kycApplications.status}).from(kycApplications).where(eq(kycApplications.userEmail,user.email)).limit(1);
 if(kyc?.status!=="approved")redirect("/kyc/status");
 return children;
}
