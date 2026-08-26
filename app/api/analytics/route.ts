import { NextResponse } from "next/server";
import { desc,eq } from "drizzle-orm";
import { getUser } from "../../auth";
import { ensurePaperAccount,listPaperTrades } from "../../../db/paper-account";
import { getDb } from "../../../db";
import { aiDecisions } from "../../../db/schema";

export const dynamic="force-dynamic";

export async function GET(request:Request){
 const user=await getUser();
 if(!user)return NextResponse.json({error:"Authentication required"},{status:401});
 const range=new URL(request.url).searchParams.get("range")||"30D",now=Date.now(),cutoff=range==="7D"?now-7*86400000:range==="30D"?now-30*86400000:0;
 const {account,settings}=await ensurePaperAccount(user.email,user.displayName),all=await listPaperTrades(user.email),trades=all.filter(item=>item.createdAt>=cutoff),closed=trades.filter(item=>item.status==="closed").sort((a,b)=>(a.closedAt||0)-(b.closedAt||0));
 const decisions=(await getDb().select().from(aiDecisions).where(eq(aiDecisions.userEmail,user.email)).orderBy(desc(aiDecisions.createdAt)).limit(500)).filter(item=>item.createdAt>=cutoff);
 const pnlPaise=closed.reduce((sum,item)=>sum+item.pnlPaise,0),wins=closed.filter(item=>item.pnlPaise>0).length,losses=closed.filter(item=>item.pnlPaise<0).length,starting=account.startingBalancePaise;
 let equity=0,peak=0,maxDrawdown=0;const curve=[0];for(const trade of closed){equity+=trade.pnlPaise;peak=Math.max(peak,equity);maxDrawdown=Math.max(maxDrawdown,peak>0?(peak-equity)/(starting+peak)*100:Math.max(0,-equity/starting*100));curve.push(equity)}
 const samples=Array.from({length:11},(_,index)=>curve[Math.min(curve.length-1,Math.round(index*(curve.length-1)/10))]),min=Math.min(...samples),max=Math.max(...samples),span=Math.max(1,max-min),points=samples.map((value,index)=>`${index*66},${Math.round(130-(value-min)/span*112)}`).join(" ");
 const marketMap=new Map<string,{trades:number,wins:number,pnlPaise:number}>();for(const trade of closed){const row=marketMap.get(trade.asset)||{trades:0,wins:0,pnlPaise:0};row.trades++;if(trade.pnlPaise>0)row.wins++;row.pnlPaise+=trade.pnlPaise;marketMap.set(trade.asset,row)}
 const targetReached=closed.filter(item=>item.closeReason==="take_profit").length,highConfidence=decisions.filter(item=>item.confidence>=settings.minConfidence&&item.decision!=="NO TRADE").length,eligible=decisions.filter(item=>item.decision!=="NO TRADE").length,hours=Array.from({length:12},()=>0);for(const item of decisions)hours[Math.floor(new Date(item.createdAt).getHours()/2)]++;
 const open=all.filter(item=>item.status==="open"),allocatedPaise=open.reduce((sum,item)=>sum+item.amountPaise,0),riskCoverage=open.length?Math.round(open.filter(item=>item.stopPrice>0&&item.targetPrice>0).length/open.length*100):100,riskScore=Math.max(0,Math.round(100-maxDrawdown*5-(riskCoverage<100?20:0)));
 return NextResponse.json({
  balance:`₹${(account.balancePaise/100).toLocaleString("en-IN",{maximumFractionDigits:0})}`,startingBalance:`₹${(starting/100).toLocaleString("en-IN",{maximumFractionDigits:0})}`,allocated:`₹${(allocatedPaise/100).toLocaleString("en-IN",{maximumFractionDigits:0})}`,
  profit:`${pnlPaise>=0?"+":"-"}₹${Math.abs(pnlPaise/100).toLocaleString("en-IN",{maximumFractionDigits:0})}`,return:`${pnlPaise>=0?"+":""}${(pnlPaise/starting*100).toFixed(2)}%`,trades:closed.length,wins,losses,win:closed.length?`${(wins/closed.length*100).toFixed(1)}%`:"0%",drawdown:`-${maxDrawdown.toFixed(2)}%`,points,
  labels:range==="7D"?["7 days ago","3 days ago","Today"]:range==="30D"?["30 days ago","15 days ago","Today"]:["Started","Midpoint","Today"],
  markets:[...marketMap].map(([coin,row])=>({coin,trades:row.trades,win:row.trades?Math.round(row.wins/row.trades*100):0,pnl:`${row.pnlPaise>=0?"+":"-"}₹${Math.abs(row.pnlPaise/100).toFixed(0)}`})),
  decisions:decisions.length,noTrades:decisions.filter(item=>item.decision==="NO TRADE").length,open:open.length,highConfidencePct:eligible?Math.round(highConfidence/eligible*100):0,targetReachedPct:closed.length?Math.round(targetReached/closed.length*100):0,hours,risk:{score:riskScore,coverage:riskCoverage,maxPositions:settings.maxPositions,openPositions:open.length,maxRiskPct:settings.maxRiskPct,dailyLossPct:settings.dailyLossPct}
 });
}
