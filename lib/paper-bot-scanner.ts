import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { aiDecisions, paperBotAlerts, paperBots, paperSettings } from "../db/schema";
import { sendMailWithResult } from "./mailer";
import { getQuantSignal } from "./quant-signal";

const supportedMarkets = new Set(["BTC", "ETH", "SOL", "BNB"]);

function parseCoins(value: string) {
  try {
    const coins = JSON.parse(value);
    return Array.isArray(coins)
      ? coins.filter((coin): coin is string => typeof coin === "string" && supportedMarkets.has(coin)).slice(0, 4)
      : [];
  } catch {
    return [];
  }
}

function utcPeriodKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export async function scanActivePaperBots() {
  const db = getDb();
  const bots = await db.select().from(paperBots).where(and(eq(paperBots.active, true), eq(paperBots.archived, false)));
  const result = { bots: bots.length, markets: 0, decisions: 0, eligible: 0, emailsSent: 0, emailsFailed: 0, skipped: 0 };

  for (const bot of bots) {
    const [settings] = await db.select().from(paperSettings).where(eq(paperSettings.userEmail, bot.userEmail)).limit(1);
    const threshold = Math.max(bot.minConfidence, settings?.minConfidence ?? 80);
    for (const asset of parseCoins(bot.coins)) {
      result.markets += 1;
      try {
        const signal = await getQuantSignal(asset);
        const decisionId = `CY-BOT-${crypto.randomUUID()}`;
        await db.insert(aiDecisions).values({
          id: decisionId,
          userEmail: bot.userEmail,
          asset: signal.asset,
          decision: signal.signal,
          confidence: signal.confidence,
          reasons: JSON.stringify(signal.reasons),
          indicators: JSON.stringify(signal.indicators),
          entryPrice: signal.entry,
          stopPrice: signal.stopLoss,
          targetPrice: signal.takeProfit,
          createdAt: signal.generatedAt,
        });
        result.decisions += 1;

        if (signal.signal === "NO TRADE" || signal.confidence < threshold || !settings?.aiAlerts) {
          result.skipped += 1;
          continue;
        }

        result.eligible += 1;
        const alertId = `CY-ALERT-${crypto.randomUUID()}`;
        const inserted = await db.insert(paperBotAlerts).values({
          id: alertId,
          userEmail: bot.userEmail,
          asset: signal.asset,
          decision: signal.signal,
          decisionId,
          confidence: signal.confidence,
          periodKey: utcPeriodKey(),
          status: "queued",
          createdAt: Date.now(),
        }).onConflictDoNothing().returning({ id: paperBotAlerts.id });
        if (!inserted.length) {
          result.skipped += 1;
          continue;
        }

        const lines = [
          `${bot.name} found a ${signal.signal} paper-trading opportunity for ${signal.asset}/USDT.`,
          `Confidence: ${signal.confidence}% (minimum ${threshold}%)`,
          `Reference price: $${signal.entry}`,
          signal.stopLoss ? `Illustrative stop-loss: $${signal.stopLoss}` : "",
          signal.takeProfit ? `Illustrative take-profit: $${signal.takeProfit}` : "",
          "",
          signal.reasons.slice(0, 3).join(" · "),
          "",
          `Review the saved decision: https://chatonyou.com/trade/ai/decision?id=${encodeURIComponent(decisionId)}`,
          "Paper mode only. No real order was placed. Crypto is high risk and results are not guaranteed.",
        ].filter(Boolean).join("\n");
        const delivery = await sendMailWithResult(bot.userEmail, `[Paper alert] ${signal.signal} ${signal.asset}/USDT · ${signal.confidence}%`, lines);
        await db.update(paperBotAlerts).set({ status: delivery.sent ? "sent" : "failed", providerReference: delivery.id, sentAt: delivery.sent ? Date.now() : null }).where(eq(paperBotAlerts.id, alertId));
        if (delivery.sent) result.emailsSent += 1;
        else result.emailsFailed += 1;
      } catch {
        result.skipped += 1;
      }
    }
  }

  return result;
}
