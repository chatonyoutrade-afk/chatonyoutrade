import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch("https://testnet.binance.vision/api/v3/ping", {
      cache: "no-store",
    });
    const body = await response.text();
    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      region: process.env.VERCEL_REGION || "unknown",
      response: body.slice(0, 200),
    }, { status: response.ok ? 200 : 502 });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      region: process.env.VERCEL_REGION || "unknown",
      error: error instanceof Error ? error.message : "Reachability check failed",
    }, { status: 502 });
  }
}
