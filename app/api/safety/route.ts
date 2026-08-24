import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { ensurePaperAccount } from "../../../db/paper-account";
import { getDb } from "../../../db";
import { paperSettings, tradingEvents } from "../../../db/schema";

export const dynamic = "force-dynamic";
export async function GET(){const user=await getChatGPTUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});const {settings}=await ensurePaperAccount(user.email,user.displayName);return NextResponse.json({emergencyStop:settings.emergencyStop,autoTestnetEnabled:settings.autoTestnetEnabled})}
export async function POST(request:Request){const user=await getChatGPTUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});const {settings}=await ensurePaperAccount(user.email,user.displayName);const body=await request.json().catch(()=>({})) as Record<string,unknown>,action=String(body.action||""),db=getDb(),now=Date.now();let values:{emergencyStop?:boolean;autoTestnetEnabled?:boolean;updatedAt:number}={updatedAt:now},detail="";
 if(action==="stop"){values={emergencyStop:true,autoTestnetEnabled:false,updatedAt:now};detail="Emergency stop activated · all new paper and Testnet entries blocked"}
 else if(action==="resume"&&body.confirmed===true){values={emergencyStop:false,updatedAt:now};detail="Manual safety resume approved"}
 else if(action==="auto"&&!body.enabled){values={autoTestnetEnabled:false,updatedAt:now};detail="AI Auto Testnet disabled"}
 else if(action==="auto"&&body.enabled===true&&!settings.emergencyStop){values={autoTestnetEnabled:true,updatedAt:now};detail="AI Auto Testnet enabled inside saved limits"}
 else return NextResponse.json({error:"Safety confirmation required"},{status:400});
 await db.update(paperSettings).set(values).where(eq(paperSettings.userEmail,user.email));await db.insert(tradingEvents).values({id:crypto.randomUUID(),userEmail:user.email,category:"safety",action:action.toUpperCase(),detail,createdAt:now});return NextResponse.json({ok:true,...values})}
