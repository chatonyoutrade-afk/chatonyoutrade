import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUser } from "../../auth";
import { getDb } from "../../../db";
import { ensurePaperAccount } from "../../../db/paper-account";
import { paperBots } from "../../../db/schema";

export const dynamic = "force-dynamic";

const strategies = new Set(["trend", "breakout", "defensive"]);
const markets = new Set(["BTC", "ETH", "SOL", "BNB"]);
const timeframes = new Set(["15m", "1h", "4h", "1d"]);

function toResponse(bot: typeof paperBots.$inferSelect | undefined) {
  if (!bot) return null;
  let coins: string[] = [];
  try {
    const parsed = JSON.parse(bot.coins);
    if (Array.isArray(parsed)) coins = parsed.filter((coin): coin is string => typeof coin === "string" && markets.has(coin));
  } catch {}
  return { name: bot.name, strategy: bot.strategy, coins, timeframe: bot.timeframe, confidence: bot.minConfidence, risk: bot.riskPct, dailyLoss: bot.dailyLossPct, active: bot.active, archived: bot.archived, createdAt: bot.createdAt, updatedAt: bot.updatedAt };
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await ensurePaperAccount(user.email, user.displayName);
  const [bot] = await getDb().select().from(paperBots).where(eq(paperBots.userEmail, user.email)).limit(1);
  return NextResponse.json({ bot: toResponse(bot) });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await ensurePaperAccount(user.email, user.displayName);
  const body = await request.json() as Record<string, unknown>;
  const name = String(body.name || "").trim();
  const strategy = String(body.strategy || "");
  const timeframe = String(body.timeframe || "15m");
  const coins = Array.isArray(body.coins) ? [...new Set(body.coins.map(String).map(item => item.toUpperCase()))].filter(item => markets.has(item)) : [];
  const confidence = Number(body.confidence), risk = Number(body.risk), dailyLoss = Number(body.dailyLoss);
  if (name.length < 2 || name.length > 80 || !strategies.has(strategy) || !timeframes.has(timeframe) || coins.length < 1 || !Number.isInteger(confidence) || confidence < 60 || confidence > 95 || !Number.isFinite(risk) || risk < .5 || risk > 3 || !Number.isFinite(dailyLoss) || dailyLoss < 1 || dailyLoss > 8) {
    return NextResponse.json({ error: "Paper bot settings are outside the supported safety limits" }, { status: 400 });
  }
  const now = Date.now(), db = getDb();
  const values = { userEmail: user.email, name, strategy, coins: JSON.stringify(coins), timeframe, minConfidence: confidence, riskPct: risk, dailyLossPct: dailyLoss, active: Boolean(body.active), archived: Boolean(body.archived), createdAt: now, updatedAt: now };
  await db.insert(paperBots).values(values).onConflictDoUpdate({ target: paperBots.userEmail, set: { name, strategy, coins: values.coins, timeframe, minConfidence: confidence, riskPct: risk, dailyLossPct: dailyLoss, active: values.active, archived: values.archived, updatedAt: now } });
  const [bot] = await db.select().from(paperBots).where(eq(paperBots.userEmail, user.email)).limit(1);
  return NextResponse.json({ ok: true, bot: toResponse(bot) });
}

export async function DELETE() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await getDb().delete(paperBots).where(eq(paperBots.userEmail, user.email));
  return NextResponse.json({ ok: true });
}
