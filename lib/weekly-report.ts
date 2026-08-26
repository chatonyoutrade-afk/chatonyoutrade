import { and,desc,eq } from "drizzle-orm";
import { getDb } from "../db";
import { ensurePaperAccount,listPaperTrades } from "../db/paper-account";
import { aiDecisions,paperSettings,tradingEvents } from "../db/schema";
import { sendMailWithResult } from "./mailer";

const WEEK_MS=7*24*60*60*1000;

function indiaDate(now:Date){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(now)}
function isMondayInIndia(now:Date){return new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Kolkata",weekday:"short"}).format(now)==="Mon"}

export async function sendWeeklyReportForUser(email:string,{test=false,now=new Date()}={}){
 const db=getDb(),periodKey=indiaDate(now),eventAction=test?"WEEKLY_REPORT_TEST":"WEEKLY_REPORT";
 const [settings]=await db.select().from(paperSettings).where(eq(paperSettings.userEmail,email)).limit(1);
 if(!settings?.weeklyReport)return {sent:false,skipped:"disabled"};
 if(!test){const [existing]=await db.select({id:tradingEvents.id}).from(tradingEvents).where(and(eq(tradingEvents.userEmail,email),eq(tradingEvents.category,"report"),eq(tradingEvents.action,eventAction),eq(tradingEvents.entityId,periodKey))).limit(1);if(existing)return {sent:false,skipped:"already-sent"}}
 const {account}=await ensurePaperAccount(email,email.split("@")[0]),cutoff=now.getTime()-WEEK_MS,trades=(await listPaperTrades(email)).filter(item=>(item.closedAt||item.createdAt)>=cutoff),closed=trades.filter(item=>item.status==="closed"),open=(await listPaperTrades(email)).filter(item=>item.status==="open");
 const decisions=(await db.select().from(aiDecisions).where(eq(aiDecisions.userEmail,email)).orderBy(desc(aiDecisions.createdAt)).limit(500)).filter(item=>item.createdAt>=cutoff),pnlPaise=closed.reduce((sum,item)=>sum+item.pnlPaise,0),wins=closed.filter(item=>item.pnlPaise>0).length,noTrades=decisions.filter(item=>item.decision==="NO TRADE").length;
 const lines=[
  "Your ChatOnYou weekly paper-performance report",
  `Period ending: ${periodKey}`,
  "",
  `Available paper balance: ₹${(account.balancePaise/100).toLocaleString("en-IN",{minimumFractionDigits:2})}`,
  `Closed paper trades: ${closed.length}`,
  `Win rate: ${closed.length?(wins/closed.length*100).toFixed(1):"0.0"}%`,
  `Realised paper P&L: ${pnlPaise>=0?"+":"-"}₹${Math.abs(pnlPaise/100).toLocaleString("en-IN",{minimumFractionDigits:2})}`,
  `Open paper positions: ${open.length}`,
  `Saved AI decisions: ${decisions.length}`,
  `NO TRADE decisions: ${noTrades}`,
  "",
  "Open analytics: https://chatonyou.com/trade/analytics",
  "Review history: https://chatonyou.com/trade/history",
  "Manage reports: https://chatonyou.com/trade/settings",
  "",
  "Paper mode only. No real order was placed. Simulated results do not guarantee future performance.",
 ].join("\n");
 const delivery=await sendMailWithResult(email,`${test?"[Test] ":""}Your weekly ChatOnYou paper report`,lines);
 if(delivery.sent)await db.insert(tradingEvents).values({id:crypto.randomUUID(),userEmail:email,category:"report",action:eventAction,entityId:periodKey,detail:`Weekly report sent · ${closed.length} trades · ${pnlPaise} paise P&L · provider ${delivery.id||"accepted"}`,createdAt:now.getTime()});
 return {sent:delivery.sent,skipped:delivery.sent?null:"delivery-failed",periodKey,trades:closed.length,pnlPaise,decisions:decisions.length};
}

export async function sendScheduledWeeklyReports(now=new Date()){
 if(!isMondayInIndia(now))return {eligible:0,sent:0,failed:0,skipped:"not-monday"};
 const enabled=await getDb().select({userEmail:paperSettings.userEmail}).from(paperSettings).where(eq(paperSettings.weeklyReport,true)),result={eligible:enabled.length,sent:0,failed:0,skipped:null as string|null};
 for(const item of enabled){const delivery=await sendWeeklyReportForUser(item.userEmail,{now});if(delivery.sent)result.sent++;else if(delivery.skipped!=="already-sent")result.failed++}
 return result;
}
