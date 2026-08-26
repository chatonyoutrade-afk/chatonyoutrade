import { NextResponse } from "next/server";
import { and,desc,eq } from "drizzle-orm";
import { getUser } from "../../auth";
import { getDb } from "../../../db";
import { aiDecisions } from "../../../db/schema";

export const dynamic="force-dynamic";
const parse=(item:typeof aiDecisions.$inferSelect)=>({...item,reasons:JSON.parse(item.reasons),indicators:JSON.parse(item.indicators)});
export async function GET(request:Request){const user=await getUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});const id=new URL(request.url).searchParams.get("id"),db=getDb();if(id){const [item]=await db.select().from(aiDecisions).where(and(eq(aiDecisions.userEmail,user.email),eq(aiDecisions.id,id))).limit(1);if(!item)return NextResponse.json({error:"Decision not found"},{status:404});return NextResponse.json({decision:parse(item)})}const rows=await db.select().from(aiDecisions).where(eq(aiDecisions.userEmail,user.email)).orderBy(desc(aiDecisions.createdAt)).limit(100);return NextResponse.json({decisions:rows.map(parse)})}
