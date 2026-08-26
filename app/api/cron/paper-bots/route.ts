import { NextResponse } from "next/server";
import { scanActivePaperBots } from "../../../../lib/paper-bot-scanner";
import { sendScheduledWeeklyReports } from "../../../../lib/weekly-report";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [bots,weeklyReports]=await Promise.all([scanActivePaperBots(),sendScheduledWeeklyReports()]);
  return NextResponse.json({ ok: true, paperOnly: true, ...bots, weeklyReports });
}
