import { desc, eq } from "drizzle-orm";
import { getDb } from "./index";
import { aiDecisions, paperAccounts, paperSettings, paperTrades } from "./schema";

export async function ensurePaperAccount(email:string,displayName:string){
 const db=getDb(),now=Date.now();
 await db.insert(paperAccounts).values({userEmail:email,displayName,balancePaise:1000000,startingBalancePaise:1000000,mode:"copilot",createdAt:now,updatedAt:now}).onConflictDoNothing();
 await db.insert(paperSettings).values({userEmail:email,capitalPaise:1000000,maxRiskPct:1,dailyLossPct:3,maxPositions:2,minConfidence:80,stopLossRequired:true,takeProfitRequired:true,dailyStopRequired:true,volatilityProtection:true,tradeAlerts:true,aiAlerts:true,lossAlerts:true,weeklyReport:false,updatedAt:now}).onConflictDoNothing();
 const [account]=await db.select().from(paperAccounts).where(eq(paperAccounts.userEmail,email));
 const [settings]=await db.select().from(paperSettings).where(eq(paperSettings.userEmail,email));
 return {account,settings};
}

export async function listPaperTrades(email:string){return getDb().select().from(paperTrades).where(eq(paperTrades.userEmail,email)).orderBy(desc(paperTrades.createdAt)).limit(100)}

export async function resetPaperAccount(email:string){
 const db=getDb(),now=Date.now();
 await db.batch([
  db.update(paperAccounts).set({balancePaise:1000000,startingBalancePaise:1000000,mode:"copilot",updatedAt:now}).where(eq(paperAccounts.userEmail,email)),
  db.delete(paperTrades).where(eq(paperTrades.userEmail,email)),
  db.delete(aiDecisions).where(eq(aiDecisions.userEmail,email)),
  db.update(paperSettings).set({capitalPaise:1000000,maxRiskPct:1,dailyLossPct:3,maxPositions:2,minConfidence:80,stopLossRequired:true,takeProfitRequired:true,dailyStopRequired:true,volatilityProtection:true,tradeAlerts:true,aiAlerts:true,lossAlerts:true,weeklyReport:false,updatedAt:now}).where(eq(paperSettings.userEmail,email)),
 ]);
}
