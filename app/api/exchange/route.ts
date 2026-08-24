import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { exchangeConnections } from "../../../db/schema";
import { getBinanceTestnetAccount } from "../../../lib/binance-testnet";
import { decryptCredentials, encryptCredentials } from "../../../lib/credential-vault";

export const dynamic = "force-dynamic";

function publicConnection(connection: typeof exchangeConnections.$inferSelect) {
  return {
    exchange: connection.exchange,
    environment: connection.environment,
    apiKeyHint: connection.apiKeyHint,
    canTrade: connection.canTrade,
    permissions: JSON.parse(connection.permissions) as string[],
    balances: JSON.parse(connection.balances) as Array<{ asset: string; free: string; locked: string }>,
    status: connection.status,
    connectedAt: connection.connectedAt,
    lastCheckedAt: connection.lastCheckedAt,
  };
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const [connection] = await getDb().select().from(exchangeConnections).where(eq(exchangeConnections.userEmail, user.email)).limit(1);
  return NextResponse.json({ connected: Boolean(connection), connection: connection ? publicConnection(connection) : null });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const db = getDb();
  try {
    if (body.action === "refresh") {
      const [stored] = await db.select().from(exchangeConnections).where(eq(exchangeConnections.userEmail, user.email)).limit(1);
      if (!stored) return NextResponse.json({ error: "No Testnet connection found" }, { status: 404 });
      const credentials = await decryptCredentials(stored.encryptedCredentials, stored.credentialIv);
      const account = await getBinanceTestnetAccount(credentials.apiKey, credentials.apiSecret);
      const now = Date.now();
      await db.update(exchangeConnections).set({ canTrade: account.canTrade, permissions: JSON.stringify(account.permissions), balances: JSON.stringify(account.balances), status: account.canTrade ? "connected" : "read_only", lastCheckedAt: now }).where(eq(exchangeConnections.userEmail, user.email));
      const [updated] = await db.select().from(exchangeConnections).where(eq(exchangeConnections.userEmail, user.email)).limit(1);
      return NextResponse.json({ connected: true, connection: publicConnection(updated) });
    }

    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const apiSecret = typeof body.apiSecret === "string" ? body.apiSecret.trim() : "";
    if (apiKey.length < 16 || apiSecret.length < 16 || apiKey.length > 256 || apiSecret.length > 256) {
      return NextResponse.json({ error: "Enter a valid Binance Spot Testnet API key and secret" }, { status: 400 });
    }
    const account = await getBinanceTestnetAccount(apiKey, apiSecret);
    const encrypted = await encryptCredentials(apiKey, apiSecret);
    const now = Date.now();
    await db.insert(exchangeConnections).values({
      userEmail: user.email,
      exchange: "binance",
      environment: "testnet",
      encryptedCredentials: encrypted.ciphertext,
      credentialIv: encrypted.iv,
      apiKeyHint: `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}`,
      canTrade: account.canTrade,
      permissions: JSON.stringify(account.permissions),
      balances: JSON.stringify(account.balances),
      status: account.canTrade ? "connected" : "read_only",
      connectedAt: now,
      lastCheckedAt: now,
    }).onConflictDoUpdate({
      target: exchangeConnections.userEmail,
      set: { encryptedCredentials: encrypted.ciphertext, credentialIv: encrypted.iv, apiKeyHint: `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}`, canTrade: account.canTrade, permissions: JSON.stringify(account.permissions), balances: JSON.stringify(account.balances), status: account.canTrade ? "connected" : "read_only", connectedAt: now, lastCheckedAt: now },
    });
    const [stored] = await db.select().from(exchangeConnections).where(eq(exchangeConnections.userEmail, user.email)).limit(1);
    return NextResponse.json({ connected: true, connection: publicConnection(stored) });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Testnet connection failed" }, { status: 400 });
  }
}

export async function DELETE() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await getDb().delete(exchangeConnections).where(eq(exchangeConnections.userEmail, user.email));
  return NextResponse.json({ ok: true });
}
