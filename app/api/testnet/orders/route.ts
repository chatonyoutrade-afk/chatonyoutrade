import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getUser } from "../../../auth";
import { getDb } from "../../../../db";
import { ensurePaperAccount } from "../../../../db/paper-account";
import { exchangeConnections, testnetOrders, tradingEvents } from "../../../../db/schema";
import { closeTestnetPosition, getBinanceTestnetAccount, placeProtectedTestnetBuy, queryTestnetOrder, queryTestnetOrderList } from "../../../../lib/binance-testnet";
import { decryptCredentials } from "../../../../lib/credential-vault";
import { getQuantSignal } from "../../../../lib/quant-signal";
import { notifyTestnetClosed, notifyTestnetOpened, notifyTestnetRejected } from "../../../../lib/testnet-notifications";

export const dynamic = "force-dynamic";
const allowedAssets = new Set(["BTC", "ETH", "SOL", "BNB"]);
const activeStatuses = new Set(["open", "protected", "unprotected", "pending"]);

async function logEvent(userEmail: string, category: string, action: string, detail: string, entityId?: string) {
  await getDb().insert(tradingEvents).values({ id: crypto.randomUUID(), userEmail, category, action, entityId, detail, createdAt: Date.now() });
}

async function connectionFor(userEmail: string) {
  const [connection] = await getDb().select().from(exchangeConnections).where(eq(exchangeConnections.userEmail, userEmail)).limit(1);
  if (!connection) throw new Error("Connect Binance Spot Testnet from Wallet first");
  if (!connection.canTrade) throw new Error("Enable Spot trading permission on the Binance Testnet key");
  const credentials = await decryptCredentials(connection.encryptedCredentials, connection.credentialIv);
  return { connection, credentials };
}

async function evaluate(userEmail: string, displayName: string, body: Record<string, unknown>) {
  const asset = String(body.asset || "BTC").toUpperCase().replace("USDT", "");
  if (!allowedAssets.has(asset)) throw new Error("Unsupported Testnet Spot market");
  const quoteAmount = Number(body.quoteAmount), { credentials } = await connectionFor(userEmail), account = await getBinanceTestnetAccount(credentials.apiKey, credentials.apiSecret);
  const availableUsdt = Number(account.balances.find((item) => item.asset === "USDT")?.free || 0), quant = await getQuantSignal(asset), { settings } = await ensurePaperAccount(userEmail, displayName), db = getDb();
  const all = await db.select().from(testnetOrders).where(eq(testnetOrders.userEmail, userEmail)), open = all.filter((item) => activeStatuses.has(item.status)), sameAsset = open.some((item) => item.asset === asset);
  const dayStart = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()), dailyLoss = all.filter((item) => item.closedAt && item.closedAt >= dayStart).reduce((sum, item) => sum + Math.max(0, -item.pnlQuote), 0);
  const stopPrice = quant.stopLoss || 0, targetPrice = quant.takeProfit || 0, risk = quoteAmount > 0 && stopPrice > 0 ? quoteAmount * Math.abs(quant.entry - stopPrice) / quant.entry : 0, maxRisk = availableUsdt * settings.maxRiskPct / 100, dailyLimit = availableUsdt * settings.dailyLossPct / 100;
  const checks = [
    { id: "mode", label: "Spot Testnet only", ok: true, detail: "Virtual Binance assets · no real funds" },
    { id: "safety", label: "Emergency stop inactive", ok: !settings.emergencyStop, detail: settings.emergencyStop ? "Resume manually from safety control" : "New entries are permitted" },
    { id: "signal", label: "Quant AI permits a Spot entry", ok: quant.signal === "BUY", detail: quant.signal === "SELL" ? "Spot mode will not open a short position" : `${quant.signal} · ${quant.confidence}% confidence` },
    { id: "confidence", label: "Confidence threshold", ok: quant.confidence >= settings.minConfidence, detail: `${quant.confidence}% signal · ${settings.minConfidence}% minimum` },
    { id: "amount", label: "Available Testnet USDT", ok: Number.isFinite(quoteAmount) && quoteAmount >= 5 && quoteAmount <= Math.min(250, availableUsdt), detail: `${availableUsdt.toFixed(2)} USDT available · 250 USDT hard cap` },
    { id: "positions", label: "Open-position limit", ok: open.length < settings.maxPositions && !sameAsset, detail: sameAsset ? `${asset} already has an open Testnet position` : `${open.length} open · ${settings.maxPositions} maximum` },
    { id: "risk", label: "Maximum risk per trade", ok: risk > 0 && risk <= maxRisk, detail: `${risk.toFixed(4)} USDT risk · ${maxRisk.toFixed(4)} limit` },
    { id: "daily", label: "Daily-loss capacity", ok: dailyLoss < dailyLimit, detail: `${dailyLoss.toFixed(4)} USDT used · ${dailyLimit.toFixed(4)} limit` },
    { id: "protection", label: "Stop-loss and take-profit ready", ok: stopPrice > 0 && targetPrice > quant.entry, detail: stopPrice && targetPrice ? `${stopPrice} SL · ${targetPrice} TP` : "No protective levels available" },
    { id: "volatility", label: "Volatility protection", ok: !settings.volatilityProtection || quant.riskPct <= 4, detail: `${quant.riskPct}% ATR-based price risk` },
  ];
  return { allowed: checks.every((item) => item.ok), checks, asset, quoteAmount, quant, stopPrice, targetPrice, availableUsdt, risk, maxRisk, dailyLoss, dailyLimit, credentials, settings };
}

async function syncProtection(userEmail: string) {
  const db = getDb(), active = (await db.select().from(testnetOrders).where(eq(testnetOrders.userEmail, userEmail))).filter((item) => item.status === "protected" && item.protectionOrderListId).slice(0, 8);
  if (!active.length) return;
  let credentials: { apiKey: string; apiSecret: string };
  try { credentials = (await connectionFor(userEmail)).credentials; } catch { return; }
  for (const item of active) {
    try {
      const list = await queryTestnetOrderList(credentials.apiKey, credentials.apiSecret, item.protectionOrderListId!);
      if (list.listOrderStatus !== "ALL_DONE") continue;
      const reports = list.orderReports || await Promise.all((list.orders || []).map((order) => queryTestnetOrder(credentials.apiKey, credentials.apiSecret, item.symbol, String(order.orderId))));
      const filled = reports.find((order) => order.status === "FILLED"), quantity = Number(filled?.executedQty || 0), quote = Number(filled?.cummulativeQuoteQty || 0), exitPrice = quantity > 0 ? quote / quantity : item.targetPrice, pnlQuote = (exitPrice - item.entryPrice) * item.quantity;
      await db.update(testnetOrders).set({ status: "closed", binanceStatus: "FILLED", exitPrice, pnlQuote, closedAt: Date.now(), updatedAt: Date.now() }).where(and(eq(testnetOrders.id, item.id), eq(testnetOrders.userEmail, userEmail)));
      await logEvent(userEmail, "testnet", "PROTECTIVE_EXIT", `${item.asset} protection closed at ${exitPrice.toFixed(4)} USDT`, item.id);
      await notifyTestnetClosed({ id: item.id, email: userEmail, asset: item.asset, exitPrice, pnlQuote, reason: "protection" });
    } catch { /* A later refresh will retry without changing the local position. */ }
  }
}

export async function GET(request: Request) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (new URL(request.url).searchParams.get("sync") === "1") await syncProtection(user.email);
  const db = getDb(), orders = await db.select().from(testnetOrders).where(eq(testnetOrders.userEmail, user.email)).orderBy(desc(testnetOrders.createdAt)).limit(50), events = await db.select().from(tradingEvents).where(eq(tradingEvents.userEmail, user.email)).orderBy(desc(tradingEvents.createdAt)).limit(80), { settings } = await ensurePaperAccount(user.email, user.displayName);
  const closed = orders.filter((item) => item.status === "closed"), pnl = closed.reduce((sum, item) => sum + item.pnlQuote, 0), wins = closed.filter((item) => item.pnlQuote > 0).length;
  return NextResponse.json({ orders, events, safety: { emergencyStop: settings.emergencyStop, autoTestnetEnabled: settings.autoTestnetEnabled }, summary: { open: orders.filter((item) => activeStatuses.has(item.status)).length, closed: closed.length, pnlQuote: pnl, winRate: closed.length ? wins / closed.length * 100 : 0 } });
}

export async function POST(request: Request) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>, action = String(body.action || "validate"), db = getDb();
  try {
    if (action === "close") {
      const id = String(body.id || ""), [order] = await db.select().from(testnetOrders).where(and(eq(testnetOrders.id, id), eq(testnetOrders.userEmail, user.email))).limit(1);
      if (!order || !activeStatuses.has(order.status) || order.quantity <= 0) return NextResponse.json({ error: "Open Testnet position not found" }, { status: 404 });
      const { credentials } = await connectionFor(user.email), result = await closeTestnetPosition({ apiKey: credentials.apiKey, apiSecret: credentials.apiSecret, symbol: order.symbol, quantity: order.quantity, orderListId: order.protectionOrderListId, clientOrderId: `CYC${Date.now().toString(36)}` });
      const sold = Number(result.executedQty), quote = Number(result.cummulativeQuoteQty), exitPrice = sold > 0 ? quote / sold : 0, pnlQuote = (exitPrice - order.entryPrice) * Math.min(order.quantity, sold || order.quantity), now = Date.now();
      await db.update(testnetOrders).set({ status: "closed", binanceStatus: result.status, exitPrice, pnlQuote, closedAt: now, updatedAt: now }).where(and(eq(testnetOrders.id, id), eq(testnetOrders.userEmail, user.email)));
      await logEvent(user.email, "testnet", "MANUAL_CLOSE", `${order.asset} closed at ${exitPrice.toFixed(4)} USDT`, id);
      await notifyTestnetClosed({ id, email: user.email, asset: order.asset, exitPrice, pnlQuote, reason: "manual" });
      return NextResponse.json({ ok: true, exitPrice, pnlQuote });
    }
    const evaluation = await evaluate(user.email, user.displayName, body);
    if (action === "validate") return NextResponse.json(evaluation);
    if (action === "manual" && body.confirmed !== true) return NextResponse.json({ error: "Confirm virtual Testnet execution first" }, { status: 400 });
    if (action !== "manual" && action !== "auto") return NextResponse.json({ error: "Unsupported Testnet action" }, { status: 400 });
    if (!evaluation.allowed) return NextResponse.json({ error: evaluation.checks.find((item) => !item.ok)?.detail || "Risk engine blocked this Testnet order", ...evaluation }, { status: 400 });
    const id = `CYT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`, clientOrderId = `CY${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, now = Date.now();
    await db.insert(testnetOrders).values({ id, userEmail: user.email, asset: evaluation.asset, symbol: `${evaluation.asset}USDT`, side: "BUY", source: action, status: "pending", binanceStatus: "PENDING", clientOrderId, quoteAmount: evaluation.quoteAmount, entryPrice: evaluation.quant.entry, stopPrice: evaluation.stopPrice, targetPrice: evaluation.targetPrice, confidence: evaluation.quant.confidence, createdAt: now, updatedAt: now });
    try {
      const placed = await placeProtectedTestnetBuy({ apiKey: evaluation.credentials.apiKey, apiSecret: evaluation.credentials.apiSecret, asset: evaluation.asset, quoteAmount: evaluation.quoteAmount, stopPrice: evaluation.stopPrice, targetPrice: evaluation.targetPrice, clientOrderId });
      const status = placed.protection ? "protected" : placed.entry.status === "FILLED" ? "unprotected" : "open";
      await db.update(testnetOrders).set({ status, binanceStatus: placed.entry.status, binanceOrderId: String(placed.entry.orderId), protectionOrderListId: placed.protection ? String(placed.protection.orderListId) : null, quantity: placed.protectedQuantity || Number(placed.entry.executedQty || 0), entryPrice: placed.entryPrice || evaluation.quant.entry, error: placed.warning, updatedAt: Date.now() }).where(eq(testnetOrders.id, id));
      await logEvent(user.email, "testnet", action === "auto" ? "AI_AUTO_ENTRY" : "MANUAL_ENTRY", `${evaluation.asset} ${evaluation.quoteAmount.toFixed(2)} USDT · ${status}`, id);
      await notifyTestnetOpened({ id, email: user.email, asset: evaluation.asset, quoteAmount: evaluation.quoteAmount, entryPrice: placed.entryPrice || evaluation.quant.entry, stopPrice: evaluation.stopPrice, targetPrice: evaluation.targetPrice, protected: Boolean(placed.protection) });
      const refreshed = await getBinanceTestnetAccount(evaluation.credentials.apiKey, evaluation.credentials.apiSecret);
      await db.update(exchangeConnections).set({ balances: JSON.stringify(refreshed.balances), lastCheckedAt: Date.now() }).where(eq(exchangeConnections.userEmail, user.email));
      return NextResponse.json({ ok: true, id, status, warning: placed.warning });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Testnet order failed";
      await db.update(testnetOrders).set({ status: "rejected", binanceStatus: "REJECTED", error: message, updatedAt: Date.now() }).where(eq(testnetOrders.id, id));
      await logEvent(user.email, "risk", "ORDER_REJECTED", message, id);
      await notifyTestnetRejected({ id, email: user.email, asset: evaluation.asset, reason: message });
      return NextResponse.json({ error: message, id }, { status: 400 });
    }
  } catch (reason) { return NextResponse.json({ error: reason instanceof Error ? reason.message : "Testnet execution unavailable" }, { status: 400 }); }
}
