import { NextResponse } from "next/server";
import { and, desc, eq, isNull, lte } from "drizzle-orm";
import { getUser } from "../../auth";
import { getDb } from "../../../db";
import { aiDecisions, paperBotAlerts } from "../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const db=getDb();
  const alerts = await db.select().from(paperBotAlerts).where(eq(paperBotAlerts.userEmail, user.email)).orderBy(desc(paperBotAlerts.createdAt)).limit(100);
  const resolved=await Promise.all(alerts.map(async alert=>{if(alert.decisionId)return alert;const [decision]=await db.select({id:aiDecisions.id}).from(aiDecisions).where(and(eq(aiDecisions.userEmail,user.email),eq(aiDecisions.asset,alert.asset),eq(aiDecisions.decision,alert.decision),lte(aiDecisions.createdAt,alert.createdAt))).orderBy(desc(aiDecisions.createdAt)).limit(1);return {...alert,decisionId:decision?.id??null}}));
  return NextResponse.json({ alerts:resolved });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json() as { id?: unknown; action?: unknown };
  const now = Date.now(), db = getDb();
  if (body.action === "mark_all_read") {
    await db.update(paperBotAlerts).set({ readAt: now }).where(and(eq(paperBotAlerts.userEmail, user.email), isNull(paperBotAlerts.readAt)));
    return NextResponse.json({ ok: true });
  }
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Alert ID is required" }, { status: 400 });
  await db.update(paperBotAlerts).set({ readAt: now }).where(and(eq(paperBotAlerts.id, id), eq(paperBotAlerts.userEmail, user.email)));
  return NextResponse.json({ ok: true });
}
