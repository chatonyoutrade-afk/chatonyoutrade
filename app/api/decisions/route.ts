import { NextResponse } from "next/server";
import { desc,eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { aiDecisions } from "../../../db/schema";

export const dynamic="force-dynamic";
export async function GET(){const user=await getChatGPTUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});const rows=await getDb().select().from(aiDecisions).where(eq(aiDecisions.userEmail,user.email)).orderBy(desc(aiDecisions.createdAt)).limit(100);return NextResponse.json({decisions:rows.map(item=>({...item,reasons:JSON.parse(item.reasons),indicators:JSON.parse(item.indicators)}))})}
