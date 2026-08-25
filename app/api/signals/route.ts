import { NextResponse } from "next/server";
import { getUser } from "../../auth";
import { getQuantSignal } from "../../../lib/quant-signal";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { aiDecisions } from "../../../db/schema";

export const dynamic="force-dynamic";
export async function GET(request:Request){const user=await getUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});const asset=(new URL(request.url).searchParams.get("asset")||"BTC").toUpperCase();try{const signal=await getQuantSignal(asset),db=getDb();const [latest]=await db.select().from(aiDecisions).where(and(eq(aiDecisions.userEmail,user.email),eq(aiDecisions.asset,signal.asset))).orderBy(desc(aiDecisions.createdAt)).limit(1);let decisionId=latest?.id;if(!latest||latest.decision!==signal.signal||Math.abs(latest.confidence-signal.confidence)>=3||Date.now()-latest.createdAt>60000){decisionId=`CY-AI-${Date.now()}-${signal.asset}`;await db.insert(aiDecisions).values({id:decisionId,userEmail:user.email,asset:signal.asset,decision:signal.signal,confidence:signal.confidence,reasons:JSON.stringify(signal.reasons),indicators:JSON.stringify(signal.indicators),entryPrice:signal.entry,stopPrice:signal.stopLoss,targetPrice:signal.takeProfit,createdAt:signal.generatedAt})}return NextResponse.json({...signal,decisionId},{headers:{"cache-control":"no-store"}})}catch(reason){return NextResponse.json({error:reason instanceof Error?reason.message:"Signal engine unavailable"},{status:503})}}
