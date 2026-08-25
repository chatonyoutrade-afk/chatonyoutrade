import { and, eq, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "../db";
import { appSessions, appUsers } from "../db/schema";

export const SESSION_COOKIE = "chatonyou_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_BYTES = 32;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toBase64Url(new Uint8Array(digest));
}

export async function createSession(userEmail: string) {
  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  await getDb().insert(appSessions).values({ tokenHash: await hashToken(token), userEmail, createdAt: now, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", expires: new Date(expiresAt) });
  // Opportunistic cleanup keeps expired rows from accumulating.
  await getDb().delete(appSessions).where(lt(appSessions.expiresAt, now)).catch(() => undefined);
  return { expiresAt };
}

export async function readSessionUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const [session] = await db.select().from(appSessions).where(eq(appSessions.tokenHash, await hashToken(token))).limit(1);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    await db.delete(appSessions).where(eq(appSessions.tokenHash, session.tokenHash)).catch(() => undefined);
    return null;
  }
  const [user] = await db.select().from(appUsers).where(eq(appUsers.email, session.userEmail)).limit(1);
  return user ?? null;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb().delete(appSessions).where(eq(appSessions.tokenHash, await hashToken(token))).catch(() => undefined);
  }
  store.delete(SESSION_COOKIE);
}

// Used after a password change so other devices cannot keep an old session.
export async function destroyAllSessionsFor(userEmail: string, exceptToken?: string) {
  const db = getDb();
  if (!exceptToken) {
    await db.delete(appSessions).where(eq(appSessions.userEmail, userEmail));
    return;
  }
  const keep = await hashToken(exceptToken);
  const rows = await db.select().from(appSessions).where(eq(appSessions.userEmail, userEmail));
  for (const row of rows) {
    if (row.tokenHash === keep) continue;
    await db.delete(appSessions).where(and(eq(appSessions.tokenHash, row.tokenHash), eq(appSessions.userEmail, userEmail)));
  }
}
