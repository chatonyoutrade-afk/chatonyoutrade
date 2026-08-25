import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getD1, getDb } from "../../../db";
import { ensurePaperAccount, listPaperTrades } from "../../../db/paper-account";
import { paperAccounts, paperTrades } from "../../../db/schema";
import { getQuantSignal } from "../../../lib/quant-signal";

export const dynamic = "force-dynamic";

// A paper entry is only allowed against a signal the client actually reviewed.
const MAX_FEED_AGE_MS = 45000;      // live candle snapshot age on the server
const MAX_SNAPSHOT_AGE_MS = 90000;  // age of the signal shown to the client
const MAX_ENTRY_DRIFT_PCT = 0.35;   // reviewed entry vs live entry

export async function GET(){const user=await getChatGPTUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});await ensurePaperAccount(user.email,user.displayName);return NextResponse.json({trades:await listPaperTrades(user.email)})}

async function evaluateRisk(email:string,displayName:string,body:Record<string,unknown>){
 const amount=Number(body.amount),asset=String(body.asset||"").toUpperCase(),quant=await getQuantSignal(asset),entryPrice=quant.entry,stopPrice=Number(body.stopPrice),targetPrice=Number(body.targetPrice),confidence=quant.confidence,side=body.side==="SELL"?"SELL":"BUY";
 const now=Date.now(),reviewedEntry=Number(body.entryPrice),reviewedAt=Number(body.signalGeneratedAt);
 const feedAgeMs=now-quant.generatedAt,snapshotAgeMs=Number.isFinite(reviewedAt)&&reviewedAt>0?now-reviewedAt:Number.POSITIVE_INFINITY;
 const driftPct=Number.isFinite(reviewedEntry)&&reviewedEntry>0?Math.abs(reviewedEntry-entryPrice)/entryPrice*100:Number.POSITIVE_INFINITY;
 const feedOk=feedAgeMs>=0&&feedAgeMs<=MAX_FEED_AGE_MS,snapshotOk=snapshotAgeMs>=0&&snapshotAgeMs<=MAX_SNAPSHOT_AGE_MS,driftOk=driftPct<=MAX_ENTRY_DRIFT_PCT;
 const inputValid=[amount,entryPrice,stopPrice,targetPrice,confidence].every(Number.isFinite)&&amount>=100&&amount<=5000&&entryPrice>0;
 const {account,settings}=await ensurePaperAccount(email,displayName),db=getDb(),amountPaise=Math.round(Math.max(0,amount)*100);
 const userTrades=await db.select().from(paperTrades).where(eq(paperTrades.userEmail,email)),openCount=userTrades.filter(item=>item.status==="open").length;
 const dayStart=Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),new Date().getUTCDate());
 const dailyLossPaise=userTrades.filter(item=>item.status==="closed"&&(item.closedAt||0)>=dayStart).reduce((sum,item)=>sum+Math.max(0,-item.pnlPaise),0);
 const riskPaise=inputValid?Math.round(amountPaise*Math.abs(entryPrice-stopPrice)/entryPrice):0,maxRiskPaise=Math.round(settings.capitalPaise*settings.maxRiskPct/100),dailyLimitPaise=Math.round(settings.capitalPaise*settings.dailyLossPct/100);
 const levelsValid=side==="BUY"?stopPrice<entryPrice&&targetPrice>entryPrice:stopPrice>entryPrice&&targetPrice<entryPrice;
 const checks=[
  {id:"safety",label:"Emergency stop inactive",ok:!settings.emergencyStop,detail:settings.emergencyStop?"Resume manually from Emergency Safety before a new entry":"New paper entries are permitted"},
  {id:"feed",label:"Live Binance candle feed",ok:feedOk,detail:feedOk?`${quant.source} · ${Math.round(feedAgeMs/1000)}s old`:"Live candle feed is stale. New entries are blocked until it recovers."},
  {id:"snapshot",label:"Reviewed signal is current",ok:snapshotOk,detail:Number.isFinite(snapshotAgeMs)?`Reviewed ${Math.round(snapshotAgeMs/1000)}s ago · ${MAX_SNAPSHOT_AGE_MS/1000}s maximum`:"Refresh the live signal before placing this order"},
  {id:"drift",label:"Reviewed entry still valid",ok:driftOk,detail:Number.isFinite(driftPct)?`${driftPct.toFixed(2)}% drift · ${MAX_ENTRY_DRIFT_PCT}% maximum · live ${entryPrice}`:"Reviewed entry price was not supplied"},
  {id:"input",label:"Valid paper order",ok:inputValid,detail:"₹100–₹5,000 allocation with valid prices"},
  {id:"balance",label:"Available paper balance",ok:amountPaise<=account.balancePaise,detail:`₹${(account.balancePaise/100).toLocaleString("en-IN")} available`},
  {id:"confidence",label:"AI confidence threshold",ok:confidence>=settings.minConfidence,detail:`${confidence}% signal · ${settings.minConfidence}% minimum`},
  {id:"signal",label:"Quant signal permission",ok:quant.signal===side,detail:quant.signal==="NO TRADE"?"Quant engine decided NO TRADE":`${quant.signal} is the current permitted direction`},
  {id:"positions",label:"Open-position limit",ok:openCount<settings.maxPositions,detail:`${openCount} open · ${settings.maxPositions} maximum`},
  {id:"risk",label:"Maximum risk per trade",ok:riskPaise<=maxRiskPaise,detail:`₹${(riskPaise/100).toFixed(2)} risk · ₹${(maxRiskPaise/100).toFixed(2)} limit`},
  {id:"daily",label:"Daily-loss capacity",ok:dailyLossPaise<dailyLimitPaise,detail:`₹${(dailyLossPaise/100).toFixed(2)} used · ₹${(dailyLimitPaise/100).toFixed(2)} limit`},
  {id:"levels",label:"Protective price structure",ok:levelsValid&&(!settings.stopLossRequired||stopPrice>0)&&(!settings.takeProfitRequired||targetPrice>0),detail:`${side} stop and target verified`},
 ];
 return {allowed:checks.every(item=>item.ok),checks,risk:{riskPaise,maxRiskPaise,dailyLossPaise,dailyLimitPaise,openCount,maxPositions:settings.maxPositions},feed:{ageMs:feedAgeMs,snapshotAgeMs:Number.isFinite(snapshotAgeMs)?snapshotAgeMs:null,driftPct:Number.isFinite(driftPct)?driftPct:null,liveEntry:entryPrice,generatedAt:quant.generatedAt},quant,account,settings,amountPaise,amount,entryPrice,stopPrice,targetPrice,confidence,side};
}

export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});
 const body=await request.json();
 if(body.action==="close"){
  const exitPrice=Number(body.exitPrice),id=String(body.id||"");
  if(!id||!Number.isFinite(exitPrice)||exitPrice<=0)return NextResponse.json({error:"Invalid paper exit"},{status:400});
  await ensurePaperAccount(user.email,user.displayName);const db=getDb();
  const [trade]=await db.select().from(paperTrades).where(and(eq(paperTrades.id,id),eq(paperTrades.userEmail,user.email))).limit(1);
  if(!trade||trade.status!=="open")return NextResponse.json({error:"Open paper position not found"},{status:404});
  const direction=trade.side==="SELL"?-1:1,rawPnl=trade.amountPaise*((exitPrice-trade.entryPrice)/trade.entryPrice)*direction;
  const pnlPaise=Math.max(-trade.amountPaise,Math.round(rawPnl)),settlementPaise=trade.amountPaise+pnlPaise,now=Date.now();
  const d1=getD1(),[creditResult,closeResult]=await d1.batch([
   d1.prepare("UPDATE paper_accounts SET balance_paise = balance_paise + ?, updated_at = ? WHERE user_email = ? AND EXISTS (SELECT 1 FROM paper_trades WHERE id = ? AND user_email = ? AND status = 'open')").bind(settlementPaise,now,user.email,id,user.email),
   d1.prepare("UPDATE paper_trades SET status = 'closed', pnl_paise = ?, exit_price = ?, closed_at = ? WHERE id = ? AND user_email = ? AND status = 'open'").bind(pnlPaise,exitPrice,now,id,user.email),
  ]);
  if(Number(creditResult.meta.changes)!==1||Number(closeResult.meta.changes)!==1)return NextResponse.json({error:"Paper position changed before settlement. Refresh and try again."},{status:409});
  const [updatedAccount]=await db.select().from(paperAccounts).where(eq(paperAccounts.userEmail,user.email)).limit(1);
  return NextResponse.json({ok:true,id,pnlPaise,balancePaise:updatedAccount.balancePaise});
 }
 let evaluation;try{evaluation=await evaluateRisk(user.email,user.displayName,body)}catch(reason){return NextResponse.json({error:reason instanceof Error?reason.message:"Quant signal engine unavailable"},{status:503})}
 if(body.action==="validate")return NextResponse.json(evaluation);
 if(!evaluation.allowed){const failed=evaluation.checks.find(item=>!item.ok);return NextResponse.json({error:failed?.detail||"Risk engine blocked this paper order",checks:evaluation.checks,risk:evaluation.risk},{status:400})}
 const {amountPaise,entryPrice,stopPrice,targetPrice,side}=evaluation;
 const id=`CY-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,now=Date.now(),asset=String(body.asset).toUpperCase(),d1=getD1();
 const [insertResult,debitResult]=await d1.batch([
  d1.prepare("INSERT INTO paper_trades (id,user_email,asset,side,amount_paise,entry_price,stop_price,target_price,status,pnl_paise,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM paper_accounts a JOIN paper_settings s ON s.user_email = a.user_email WHERE a.user_email = ? AND a.balance_paise >= ? AND s.emergency_stop = 0 AND (SELECT COUNT(*) FROM paper_trades p WHERE p.user_email = a.user_email AND p.status = 'open') < s.max_positions)").bind(id,user.email,asset,side,amountPaise,entryPrice,stopPrice,targetPrice,"open",0,now,user.email,amountPaise),
  d1.prepare("UPDATE paper_accounts SET balance_paise = balance_paise - ?, updated_at = ? WHERE user_email = ? AND EXISTS (SELECT 1 FROM paper_trades WHERE id = ? AND user_email = ? AND status = 'open')").bind(amountPaise,now,user.email,id,user.email),
 ]);
 if(Number(insertResult.meta.changes)!==1||Number(debitResult.meta.changes)!==1)return NextResponse.json({error:"Balance or position limits changed. Refresh and validate the order again."},{status:409});
 const [updatedAccount]=await getDb().select().from(paperAccounts).where(eq(paperAccounts.userEmail,user.email)).limit(1);
 return NextResponse.json({ok:true,id,balancePaise:updatedAccount.balancePaise});
}
