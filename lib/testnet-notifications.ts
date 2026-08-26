import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { paperBotAlerts, paperSettings, tradingEvents } from "../db/schema";
import { sendMailWithResult } from "./mailer";

type TestnetUpdate = {
  id: string;
  email: string;
  asset: string;
  action: "OPENED" | "CLOSED" | "REJECTED";
  title: string;
  message: string;
  kind: "testnet_open" | "testnet_close" | "risk";
  loss?: boolean;
};

async function saveTestnetUpdate(input: TestnetUpdate) {
  try {
    const db = getDb();
    const now = Date.now();
    const alertId = `CY-TESTNET-${input.id}-${input.action}`;
    const inserted = await db.insert(paperBotAlerts).values({
      id: alertId,
      userEmail: input.email,
      asset: input.asset,
      decision: "BUY",
      kind: input.kind,
      title: input.title,
      message: input.message,
      href: "/trade/history?tab=testnet",
      confidence: 0,
      periodKey: `${input.id}:${input.action}`,
      status: "saved",
      createdAt: now,
    }).onConflictDoNothing().returning({ id: paperBotAlerts.id });
    if (!inserted.length) return;

    const [settings] = await db.select().from(paperSettings).where(eq(paperSettings.userEmail, input.email)).limit(1);
    const sendEmail = Boolean(settings?.tradeAlerts || (input.loss && settings?.lossAlerts));
    let status = "saved";
    let providerReference: string | null = null;
    let sentAt: number | null = null;
    if (sendEmail) {
      const delivery = await sendMailWithResult(input.email, `[Binance Testnet] ${input.title}`, [
        input.title,
        input.message,
        "",
        "Review the saved audit record: https://chatonyou.com/trade/history?tab=testnet",
        "Sandbox/Testnet only. No real funds or withdrawals are enabled.",
      ].join("\n"));
      status = delivery.sent ? "sent" : "failed";
      providerReference = delivery.id;
      sentAt = delivery.sent ? Date.now() : null;
    }
    await db.update(paperBotAlerts).set({ status, providerReference, sentAt }).where(eq(paperBotAlerts.id, alertId));
    await db.insert(tradingEvents).values({
      id: crypto.randomUUID(),
      userEmail: input.email,
      category: "testnet_notification",
      action: input.action,
      entityId: input.id,
      detail: input.message,
      createdAt: now,
    });
  } catch {
    // Notification delivery must never change an already completed Testnet action.
  }
}

export async function notifyTestnetOpened(input: { id: string; email: string; asset: string; quoteAmount: number; entryPrice: number; stopPrice: number; targetPrice: number; protected: boolean }) {
  const title = `Testnet BUY opened · ${input.asset}/USDT`;
  const message = `${input.quoteAmount.toFixed(2)} virtual USDT entered at $${input.entryPrice.toFixed(4)}. ${input.protected ? `OCO protection active: SL $${input.stopPrice} · TP $${input.targetPrice}.` : "Protective OCO was not accepted; review required."}`;
  await saveTestnetUpdate({ ...input, action: "OPENED", title, message, kind: input.protected ? "testnet_open" : "risk" });
}

export async function notifyTestnetClosed(input: { id: string; email: string; asset: string; exitPrice: number; pnlQuote: number; reason: "manual" | "protection" }) {
  const loss = input.pnlQuote < 0;
  const title = `Testnet position closed · ${input.asset}/USDT`;
  const message = `${input.reason === "protection" ? "Binance protection" : "Manual Testnet exit"} completed at $${input.exitPrice.toFixed(4)}. Testnet P&L: ${input.pnlQuote >= 0 ? "+" : "-"}${Math.abs(input.pnlQuote).toFixed(4)} USDT.`;
  await saveTestnetUpdate({ ...input, action: "CLOSED", title, message, kind: loss ? "risk" : "testnet_close", loss });
}

export async function notifyTestnetRejected(input: { id: string; email: string; asset: string; reason: string }) {
  await saveTestnetUpdate({ ...input, action: "REJECTED", title: `Testnet order blocked · ${input.asset}/USDT`, message: input.reason, kind: "risk" });
}
