"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MarketTicker = { price:number; change:number; updatedAt:number };
export type MarketCandle = { openTime:number; open:number; high:number; low:number; close:number };
type ConnectionState = "connecting" | "live" | "reconnecting" | "offline";

const symbols = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT"];

export function useBinanceMarket(activeSymbol:string){
 const [tickers,setTickers]=useState<Record<string,MarketTicker>>({});
 const [candles,setCandles]=useState<MarketCandle[]>([]);
 const [status,setStatus]=useState<ConnectionState>("connecting");
 const [generation,setGeneration]=useState(0);
 const retryRef=useRef<ReturnType<typeof setTimeout>|null>(null);
 const reconnect=useCallback(()=>{setStatus("reconnecting");setGeneration(value=>value+1)},[]);

 useEffect(()=>{
  let closed=false;
  const symbol=activeSymbol.toUpperCase()+"USDT";
  setCandles([]);
  fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=1m&limit=36`)
   .then(response=>{if(!response.ok) throw new Error("Market history unavailable");return response.json()})
   .then((rows:unknown[][])=>{if(closed)return;setCandles(rows.map(row=>({openTime:Number(row[0]),open:Number(row[1]),high:Number(row[2]),low:Number(row[3]),close:Number(row[4])})))})
   .catch(()=>{if(!closed)setStatus("reconnecting")});

  const streams=[...symbols.map(item=>item.toLowerCase()+"@ticker"),symbol.toLowerCase()+"@kline_1m"].join("/");
  const socket=new WebSocket(`wss://data-stream.binance.vision/stream?streams=${streams}`);
  socket.onopen=()=>{if(!closed)setStatus("live")};
  socket.onmessage=event=>{
   if(closed)return;
   try{
    const packet=JSON.parse(event.data); const data=packet.data;
    if(data.e==="24hrTicker") setTickers(current=>({...current,[data.s]:{price:Number(data.c),change:Number(data.P),updatedAt:Number(data.E)}}));
    if(data.e==="kline"&&data.s===symbol){const k=data.k;const next={openTime:Number(k.t),open:Number(k.o),high:Number(k.h),low:Number(k.l),close:Number(k.c)};setCandles(current=>{const copy=[...current];const last=copy[copy.length-1];if(last?.openTime===next.openTime)copy[copy.length-1]=next;else copy.push(next);return copy.slice(-36)})}
   }catch{/* Ignore malformed public stream packets. */}
  };
  socket.onerror=()=>{if(!closed)setStatus("reconnecting")};
  socket.onclose=()=>{if(closed)return;setStatus("reconnecting");retryRef.current=setTimeout(()=>setGeneration(value=>value+1),2500)};
  return()=>{closed=true;if(retryRef.current)clearTimeout(retryRef.current);socket.close()};
 },[activeSymbol,generation]);

 return {tickers,candles,status,reconnect};
}
