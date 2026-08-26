const TESTNET_API = "https://testnet.binance.vision/api";
export const SAFE_TESTNET_QUOTE_MIN = 10;

export type BinanceBalance = { asset: string; free: string; locked: string };
export type BinanceTestnetAccount = { canTrade: boolean; permissions?: string[]; balances?: BinanceBalance[] };
export type BinanceOrder = { symbol: string; orderId: string | number; clientOrderId: string; status: string; executedQty: string; cummulativeQuoteQty: string; price?: string; fills?: Array<{ price: string; qty: string; commission: string; commissionAsset: string }> };
export type BinanceOrderList = { orderListId: string | number; listOrderStatus: string; listStatusType: string; orders?: Array<{symbol:string;orderId:string|number;clientOrderId:string}>; orderReports?: BinanceOrder[] };

function toHex(bytes: ArrayBuffer) { return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join(""); }
async function signature(secret: string, payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}
async function binanceError(response: Response) {
  const payload = await response.json().catch(() => null) as { msg?: string } | null;
  if (response.status === 401 || response.status === 403) return "Binance rejected this Testnet API key or secret";
  if (response.status === 429) return "Binance rate limit reached. Please wait before retrying";
  return payload?.msg ? `Binance Testnet: ${payload.msg}` : "Binance Testnet is temporarily unavailable";
}
async function serverTime() {
  const response = await fetch(`${TESTNET_API}/v3/time`, { cache: "no-store" });
  if (!response.ok) throw new Error(await binanceError(response));
  return (await response.json() as { serverTime: number }).serverTime;
}
async function signedRequest<T>(apiKey: string, apiSecret: string, path: string, method: "GET" | "POST" | "DELETE", values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined) params.set(key, String(value));
  params.set("recvWindow", "5000"); params.set("timestamp", String(await serverTime()));
  params.set("signature", await signature(apiSecret, params.toString()));
  const query = params.toString();
  const response = await fetch(method === "GET" || method === "DELETE" ? `${TESTNET_API}${path}?${query}` : `${TESTNET_API}${path}`, {
    method, cache: "no-store", headers: { "X-MBX-APIKEY": apiKey, ...(method === "POST" ? { "content-type": "application/x-www-form-urlencoded" } : {}) }, body: method === "POST" ? query : undefined,
  });
  if (!response.ok) throw new Error(await binanceError(response));
  return response.json() as Promise<T>;
}

export async function getBinanceTestnetAccount(apiKey: string, apiSecret: string) {
  const account = await signedRequest<BinanceTestnetAccount>(apiKey, apiSecret, "/v3/account", "GET", { omitZeroBalances: "true" });
  if (!Array.isArray(account.permissions) || !account.permissions.includes("SPOT")) throw new Error("A Binance Spot Testnet key is required");
  return { canTrade: Boolean(account.canTrade), permissions: account.permissions, balances: (account.balances || []).filter((balance) => Number(balance.free) > 0 || Number(balance.locked) > 0).slice(0, 20) };
}

type SymbolRules = { stepSize: number; tickSize: number; minNotional: number };
async function getSymbolRules(symbol: string): Promise<SymbolRules> {
  const response = await fetch(`${TESTNET_API}/v3/exchangeInfo?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
  if (!response.ok) throw new Error(await binanceError(response));
  const data = await response.json() as { symbols?: Array<{ status: string; filters: Array<Record<string, string>> }> };
  const info = data.symbols?.[0]; if (!info || info.status !== "TRADING") throw new Error(`${symbol} is not currently tradable on Spot Testnet`);
  const lot = info.filters.find((item) => item.filterType === "LOT_SIZE"), price = info.filters.find((item) => item.filterType === "PRICE_FILTER"), notional = info.filters.find((item) => item.filterType === "NOTIONAL" || item.filterType === "MIN_NOTIONAL");
  return { stepSize: Number(lot?.stepSize || 0.00000001), tickSize: Number(price?.tickSize || 0.00000001), minNotional: Number(notional?.minNotional || 5) };
}
function decimals(step: number) { const value = step.toFixed(12).replace(/0+$/, ""); return value.includes(".") ? value.split(".")[1].length : 0; }
function floorTo(value: number, step: number) { return (Math.floor((value + Number.EPSILON) / step) * step).toFixed(decimals(step)); }
function netBaseQuantity(order: BinanceOrder, baseAsset: string) {
  const executed = Number(order.executedQty || 0);
  const baseCommission = (order.fills || []).reduce((sum, fill) => sum + (fill.commissionAsset === baseAsset ? Number(fill.commission || 0) : 0), 0);
  return Math.max(0, executed - baseCommission);
}

export async function placeProtectedTestnetBuy(input: { apiKey: string; apiSecret: string; asset: string; quoteAmount: number; stopPrice: number; targetPrice: number; clientOrderId: string }) {
  const symbol = `${input.asset}USDT`, rules = await getSymbolRules(symbol);
  const safeMinimum = Math.max(SAFE_TESTNET_QUOTE_MIN, rules.minNotional * 2);
  if (input.quoteAmount < safeMinimum) throw new Error(`Minimum protected Testnet order is ${safeMinimum} USDT`);
  const entry = await signedRequest<BinanceOrder>(input.apiKey, input.apiSecret, "/v3/order", "POST", { symbol, side: "BUY", type: "MARKET", quoteOrderQty: input.quoteAmount.toFixed(2), newClientOrderId: input.clientOrderId, newOrderRespType: "FULL" });
  const executedQty = Number(entry.executedQty), quoteFilled = Number(entry.cummulativeQuoteQty);
  if (!Number.isFinite(executedQty) || executedQty <= 0) return { entry, protection: null, warning: "Entry accepted but not filled yet", entryPrice: 0, protectedQuantity: 0 };
  const entryPrice = quoteFilled > 0 ? quoteFilled / executedQty : Number(entry.fills?.[0]?.price || 0), protectedQuantity = floorTo(netBaseQuantity(entry, input.asset), rules.stepSize);
  try {
    const protection = await signedRequest<BinanceOrderList>(input.apiKey, input.apiSecret, "/v3/orderList/oco", "POST", { symbol, side: "SELL", quantity: protectedQuantity, aboveType: "LIMIT_MAKER", abovePrice: floorTo(input.targetPrice, rules.tickSize), belowType: "STOP_LOSS", belowStopPrice: floorTo(input.stopPrice, rules.tickSize), listClientOrderId: `${input.clientOrderId.slice(0, 28)}P`, newOrderRespType: "FULL" });
    return { entry, protection, warning: null, entryPrice, protectedQuantity: Number(protectedQuantity) };
  } catch (reason) {
    return { entry, protection: null, warning: reason instanceof Error ? reason.message : "Protective OCO could not be placed", entryPrice, protectedQuantity: Number(protectedQuantity) };
  }
}

export async function closeTestnetPosition(input: { apiKey: string; apiSecret: string; symbol: string; quantity: number; orderListId?: string | null; clientOrderId: string }) {
  if (input.orderListId) await signedRequest<BinanceOrderList>(input.apiKey, input.apiSecret, "/v3/orderList", "DELETE", { symbol: input.symbol, orderListId: input.orderListId }).catch(() => null);
  const rules = await getSymbolRules(input.symbol), baseAsset = input.symbol.replace(/USDT$/, ""), quantity = floorTo(input.quantity, rules.stepSize);
  try {
    const order = await signedRequest<BinanceOrder>(input.apiKey, input.apiSecret, "/v3/order", "POST", { symbol: input.symbol, side: "SELL", type: "MARKET", quantity, newClientOrderId: input.clientOrderId, newOrderRespType: "FULL" });
    return { order, rescueQuoteCost: 0 };
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "";
    if (!message.includes("NOTIONAL")) throw reason;
    const rescueQuoteCost = Math.max(SAFE_TESTNET_QUOTE_MIN, rules.minNotional * 2);
    const rescue = await signedRequest<BinanceOrder>(input.apiKey, input.apiSecret, "/v3/order", "POST", { symbol: input.symbol, side: "BUY", type: "MARKET", quoteOrderQty: rescueQuoteCost.toFixed(2), newClientOrderId: `${input.clientOrderId.slice(0, 30)}T`, newOrderRespType: "FULL" });
    const combinedQuantity = floorTo(input.quantity + netBaseQuantity(rescue, baseAsset), rules.stepSize);
    const order = await signedRequest<BinanceOrder>(input.apiKey, input.apiSecret, "/v3/order", "POST", { symbol: input.symbol, side: "SELL", type: "MARKET", quantity: combinedQuantity, newClientOrderId: `${input.clientOrderId.slice(0, 30)}R`, newOrderRespType: "FULL" });
    return { order, rescueQuoteCost: Number(rescue.cummulativeQuoteQty || rescueQuoteCost) };
  }
}
export async function queryTestnetOrderList(apiKey: string, apiSecret: string, orderListId: string) { return signedRequest<BinanceOrderList>(apiKey, apiSecret, "/v3/orderList", "GET", { orderListId }); }
export async function queryTestnetOrder(apiKey: string, apiSecret: string, symbol: string, orderId: string) { return signedRequest<BinanceOrder>(apiKey, apiSecret, "/v3/order", "GET", { symbol, orderId }); }
