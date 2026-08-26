import { NextResponse } from "next/server";
import { getUser } from "../../../auth";
import { sendWeeklyReportForUser } from "../../../../lib/weekly-report";

export const dynamic="force-dynamic";

export async function POST(){
 const user=await getUser();
 if(!user)return NextResponse.json({error:"Authentication required"},{status:401});
 const result=await sendWeeklyReportForUser(user.email,{test:true});
 if(!result.sent)return NextResponse.json({error:result.skipped==="disabled"?"Enable and save the weekly report setting first.":"The report email could not be delivered."},{status:400});
 return NextResponse.json({ok:true,...result});
}
