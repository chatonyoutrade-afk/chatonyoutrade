import { env } from "cloudflare:workers";

// The public candle host, overridable so the risk engine can be exercised
// against fixture candles in tests. Never point this at an untrusted host.
const DEFAULT_CANDLE_HOST = "https://data-api.binance.vision";
function candleHost() {
  const workerValue = (env as unknown as Record<string, unknown>).BINANCE_DATA_BASE_URL;
  const value = (typeof workerValue === "string" ? workerValue : process.env.BINANCE_DATA_BASE_URL ?? "").trim();
  return (value || DEFAULT_CANDLE_HOST).replace(/\/$/, "");
}

export type QuantSignal={asset:string;symbol:string;signal:"BUY"|"SELL"|"NO TRADE";confidence:number;entry:number;stopLoss:number|null;takeProfit:number|null;riskPct:number;trend:"Bullish"|"Bearish"|"Neutral";reasons:string[];indicators:{ema9:number;ema21:number;rsi14:number;macd:number;macdSignal:number;atr14:number;volumeRatio:number};generatedAt:number;source:string};
type Candle={open:number;high:number;low:number;close:number;volume:number};
const allowed=new Set(["BTC","ETH","SOL","BNB"]),cache=new Map<string,{expires:number,value:QuantSignal}>();

function emaSeries(values:number[],period:number){const multiplier=2/(period+1),result:number[]=[];let value=values[0]||0;for(const current of values){value=current*multiplier+value*(1-multiplier);result.push(value)}return result}
function rsi(values:number[],period=14){const slice=values.slice(-(period+1));let gains=0,losses=0;for(let i=1;i<slice.length;i++){const change=slice[i]-slice[i-1];if(change>=0)gains+=change;else losses-=change}if(!losses)return 100;const rs=(gains/period)/(losses/period);return 100-(100/(1+rs))}
function atr(candles:Candle[],period=14){const slice=candles.slice(-(period+1));const ranges=slice.slice(1).map((item,index)=>Math.max(item.high-item.low,Math.abs(item.high-slice[index].close),Math.abs(item.low-slice[index].close)));return ranges.reduce((sum,item)=>sum+item,0)/Math.max(1,ranges.length)}
const round=(value:number,digits=2)=>Number(value.toFixed(digits));

export async function getQuantSignal(input:string):Promise<QuantSignal>{
 const asset=input.toUpperCase().replace("USDT","");if(!allowed.has(asset))throw new Error("Unsupported crypto market");const cached=cache.get(asset);if(cached&&cached.expires>Date.now())return cached.value;
 const symbol=asset+"USDT",response=await fetch(`${candleHost()}/api/v3/klines?symbol=${symbol}&interval=1m&limit=100`,{cache:"no-store"});if(!response.ok)throw new Error("Binance candle feed unavailable");
 const rows=await response.json() as unknown[][],candles:Candle[]=rows.map(row=>({open:Number(row[1]),high:Number(row[2]),low:Number(row[3]),close:Number(row[4]),volume:Number(row[5])}));if(candles.length<35)throw new Error("Insufficient candle history");
 const closes=candles.map(item=>item.close),ema9Series=emaSeries(closes,9),ema21Series=emaSeries(closes,21),ema12=emaSeries(closes,12),ema26=emaSeries(closes,26),macdSeries=ema12.map((item,index)=>item-ema26[index]),macdSignalSeries=emaSeries(macdSeries,9);
 const entry=closes.at(-1)!,ema9=ema9Series.at(-1)!,ema21=ema21Series.at(-1)!,rsi14=rsi(closes),macd=macdSeries.at(-1)!,macdSignal=macdSignalSeries.at(-1)!,atr14=atr(candles),recentVolumes=candles.slice(-21,-1).map(item=>item.volume),averageVolume=recentVolumes.reduce((sum,item)=>sum+item,0)/recentVolumes.length,volumeRatio=candles.at(-1)!.volume/Math.max(averageVolume,.000001);
 let score=0;const reasons:string[]=[];
 if(ema9>ema21){score+=1;reasons.push("EMA 9 is above EMA 21")}else{score-=1;reasons.push("EMA 9 is below EMA 21")}
 if(entry>ema21){score+=1;reasons.push("Price is holding above trend EMA")}else{score-=1;reasons.push("Price is trading below trend EMA")}
 if(macd>macdSignal){score+=1;reasons.push("MACD momentum is positive")}else{score-=1;reasons.push("MACD momentum is negative")}
 if(rsi14>=52&&rsi14<=70){score+=1;reasons.push("RSI supports controlled upside")}else if(rsi14<=48&&rsi14>=30){score-=1;reasons.push("RSI supports controlled downside")}else reasons.push(`RSI is neutral at ${round(rsi14,1)}`);
 if(volumeRatio>=1.15){score+=score>=0?1:-1;reasons.push("Volume is above its 20-candle average")}else reasons.push("Volume confirmation is still limited");
 const signal=score>=3?"BUY":score<=-3?"SELL":"NO TRADE",confidence=Math.min(92,Math.max(55,54+Math.abs(score)*8+(volumeRatio>=1.15?3:0))),trend=score>=2?"Bullish":score<=-2?"Bearish":"Neutral",stopLoss=signal==="BUY"?entry-atr14*1.5:signal==="SELL"?entry+atr14*1.5:null,takeProfit=signal==="BUY"?entry+atr14*2.4:signal==="SELL"?entry-atr14*2.4:null;
 const value:QuantSignal={asset,symbol,signal,confidence,entry:round(entry,asset==="BTC"||asset==="ETH"?2:4),stopLoss:stopLoss?round(stopLoss,asset==="BTC"||asset==="ETH"?2:4):null,takeProfit:takeProfit?round(takeProfit,asset==="BTC"||asset==="ETH"?2:4):null,riskPct:round(atr14*1.5/entry*100,2),trend,reasons:reasons.slice(0,5),indicators:{ema9:round(ema9,4),ema21:round(ema21,4),rsi14:round(rsi14,2),macd:round(macd,4),macdSignal:round(macdSignal,4),atr14:round(atr14,4),volumeRatio:round(volumeRatio,2)},generatedAt:Date.now(),source:"Binance public 1-minute candles"};
 cache.set(asset,{expires:Date.now()+12000,value});return value;
}
