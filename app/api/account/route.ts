import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUser } from "../../auth";
import { getDb } from "../../../db";
import { ensurePaperAccount, listPaperTrades, resetPaperAccount } from "../../../db/paper-account";
import { paperAccounts, paperSettings } from "../../../db/schema";
import { mailerStatus } from "../../../lib/mailer";

export const dynamic = "force-dynamic";

export async function GET(){
 const user=await getUser(); if(!user)return NextResponse.json({error:"Authentication required"},{status:401});
 const {account,settings}=await ensurePaperAccount(user.email,user.displayName); const trades=await listPaperTrades(user.email);
 const email=mailerStatus();
 return NextResponse.json({user,account:{...account,balance:account.balancePaise/100,startingBalance:account.startingBalancePaise/100},settings:{...settings,capital:settings.capitalPaise/100},trades,notifications:{emailConfigured:email.configured}});
}

export async function POST(request:Request){
 const user=await getUser(); if(!user)return NextResponse.json({error:"Authentication required"},{status:401});
 const body=await request.json(); const {account}=await ensurePaperAccount(user.email,user.displayName);
 if(body.action==="reset"){await resetPaperAccount(user.email);return NextResponse.json({ok:true,balance:10000})}
 const db=getDb(),now=Date.now();
 if(body.action==="add_funds"){
  const amount=Number(body.amount);
  if(!Number.isFinite(amount)||amount<100||amount>100000)return NextResponse.json({error:"Virtual fund amount must be between ₹100 and ₹1,00,000"},{status:400});
  const nextBalance=account.balancePaise+Math.round(amount*100);
  if(nextBalance>100000000)return NextResponse.json({error:"Paper balance cannot exceed ₹10,00,000"},{status:400});
  await db.update(paperAccounts).set({balancePaise:nextBalance,updatedAt:now}).where(eq(paperAccounts.userEmail,user.email));
  return NextResponse.json({ok:true,balance:nextBalance/100});
 }
 if(body.settings){const value=body.settings as Record<string,unknown>,capital=Number(value.capital),maxRisk=Number(value.maxRisk),dailyLoss=Number(value.dailyLoss),maxPositions=Number(value.maxPositions),minConfidence=Number(value.minConfidence);if(!Number.isFinite(capital)||capital<1000||capital>1000000||!Number.isFinite(maxRisk)||maxRisk<.5||maxRisk>3||!Number.isFinite(dailyLoss)||dailyLoss<1||dailyLoss>8||!Number.isInteger(maxPositions)||maxPositions<1||maxPositions>5||!Number.isInteger(minConfidence)||minConfidence<55||minConfidence>95)return NextResponse.json({error:"Risk settings are outside the supported safety limits"},{status:400});await db.update(paperSettings).set({capitalPaise:Math.round(capital*100),maxRiskPct:maxRisk,dailyLossPct:dailyLoss,maxPositions,minConfidence,stopLossRequired:Boolean(value.stopLoss),takeProfitRequired:Boolean(value.takeProfit),dailyStopRequired:value.dailyStop===undefined?true:Boolean(value.dailyStop),volatilityProtection:Boolean(value.volatility),tradeAlerts:value.tradeAlerts===undefined?true:Boolean(value.tradeAlerts),aiAlerts:value.aiAlerts===undefined?true:Boolean(value.aiAlerts),lossAlerts:value.lossAlerts===undefined?true:Boolean(value.lossAlerts),weeklyReport:Boolean(value.weeklyReport),updatedAt:now}).where(eq(paperSettings.userEmail,user.email))}
 if(body.mode){const mode=String(body.mode);if(!["copilot","assisted","auto"].includes(mode))return NextResponse.json({error:"Unsupported AI mode"},{status:400});await db.update(paperAccounts).set({mode,updatedAt:now}).where(eq(paperAccounts.userEmail,user.email))}
 return NextResponse.json({ok:true});
}
