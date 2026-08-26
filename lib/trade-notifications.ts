import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { paperBotAlerts,paperSettings,tradingEvents } from "../db/schema";
import { sendMailWithResult } from "./mailer";

type Opened={id:string;email:string;asset:string;side:string;amountPaise:number;entryPrice:number;stopPrice:number;targetPrice:number;confidence:number};
type Closed={id:string;email:string;asset:string;side:string;pnlPaise:number;exitPrice:number;closeReason:string};

async function saveAndDeliver(input:{id:string;email:string;asset:string;decision:string;kind:string;title:string;message:string;href:string;subject:string;body:string;sendEmail:boolean;action:string}){
 try{
  const db=getDb(),now=Date.now(),alertId=`CY-TRADE-${input.id}-${input.action}`;
  const inserted=await db.insert(paperBotAlerts).values({id:alertId,userEmail:input.email,asset:input.asset,decision:input.decision,kind:input.kind,title:input.title,message:input.message,href:input.href,confidence:0,periodKey:`${input.id}:${input.action}`,status:"saved",createdAt:now}).onConflictDoNothing().returning({id:paperBotAlerts.id});
  if(!inserted.length)return;
  let status="saved",providerReference:null|string=null,sentAt:null|number=null;
  if(input.sendEmail){const delivery=await sendMailWithResult(input.email,input.subject,input.body);status=delivery.sent?"sent":"failed";providerReference=delivery.id;sentAt=delivery.sent?Date.now():null}
  await db.update(paperBotAlerts).set({status,providerReference,sentAt}).where(eq(paperBotAlerts.id,alertId));
  await db.insert(tradingEvents).values({id:crypto.randomUUID(),userEmail:input.email,category:"paper_trade",action:input.action,entityId:input.id,detail:input.message,createdAt:now});
 }catch{/* A notification failure must never roll back a completed paper trade. */}
}

export async function notifyPaperTradeOpened(item:Opened){
 const [settings]=await getDb().select().from(paperSettings).where(eq(paperSettings.userEmail,item.email)).limit(1);
 const amount=`₹${(item.amountPaise/100).toLocaleString("en-IN",{minimumFractionDigits:2})}`,title=`Paper ${item.side} opened · ${item.asset}/USDT`,message=`${amount} allocated at $${item.entryPrice}. Protection: SL $${item.stopPrice} · TP $${item.targetPrice}.`;
 await saveAndDeliver({...item,decision:item.side,kind:"trade_open",title,message,href:"/trade/portfolio",subject:`[Paper trade] ${item.side} ${item.asset}/USDT opened`,body:[title,message,`AI confidence: ${item.confidence}%`,"","Open portfolio: https://chatonyou.com/trade/portfolio","Paper mode only. No real exchange order was placed."].join("\n"),sendEmail:Boolean(settings?.tradeAlerts),action:"OPENED"});
}

export async function notifyPaperTradeClosed(item:Closed){
 const [settings]=await getDb().select().from(paperSettings).where(eq(paperSettings.userEmail,item.email)).limit(1),loss=item.pnlPaise<0,reason=item.closeReason==="stop_loss"?"Saved stop-loss reached":item.closeReason==="take_profit"?"Saved take-profit reached":"Manual paper exit",pnl=`${loss?"-":"+"}₹${Math.abs(item.pnlPaise/100).toLocaleString("en-IN",{minimumFractionDigits:2})}`,title=`Paper position closed · ${item.asset}/USDT`,message=`${reason} at $${item.exitPrice}. Realised paper P&L: ${pnl}.`;
 await saveAndDeliver({...item,decision:item.side,kind:loss?"risk":"trade_close",title,message,href:"/trade/history",subject:`[Paper ${loss?"risk":"trade"}] ${item.asset}/USDT closed · ${pnl}`,body:[title,message,"","Review history: https://chatonyou.com/trade/history","Paper mode only. No real exchange order was placed."].join("\n"),sendEmail:Boolean(settings?.tradeAlerts||(loss&&settings?.lossAlerts)),action:"CLOSED"});
}
