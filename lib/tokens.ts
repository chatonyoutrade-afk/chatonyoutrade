import { and, eq, isNull, lt } from "drizzle-orm";
import { getDb } from "../db";
import { emailVerifications, passwordResets } from "../db/schema";

const TOKEN_BYTES = 32;
export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
export const RESET_TTL_MS = 60 * 60 * 1000;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function newToken() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
}

export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toBase64Url(new Uint8Array(digest));
}

export async function issueVerification(userEmail: string) {
  const token = newToken();
  const now = Date.now();
  const db = getDb();
  // One live link per address: issuing a new one invalidates the previous.
  await db.delete(emailVerifications).where(eq(emailVerifications.userEmail, userEmail)).catch(() => undefined);
  await db.insert(emailVerifications).values({ tokenHash: await hashToken(token), userEmail, createdAt: now, expiresAt: now + VERIFICATION_TTL_MS });
  return token;
}

export async function consumeVerification(token: string) {
  const db = getDb();
  const tokenHash = await hashToken(token);
  const [row] = await db.select().from(emailVerifications).where(eq(emailVerifications.tokenHash, tokenHash)).limit(1);
  if (!row) return null;
  await db.delete(emailVerifications).where(eq(emailVerifications.tokenHash, tokenHash));
  if (row.expiresAt <= Date.now()) return null;
  return row.userEmail;
}

export async function issueReset(userEmail: string) {
  const token = newToken();
  const now = Date.now();
  const db = getDb();
  await db.delete(passwordResets).where(eq(passwordResets.userEmail, userEmail)).catch(() => undefined);
  await db.insert(passwordResets).values({ tokenHash: await hashToken(token), userEmail, createdAt: now, expiresAt: now + RESET_TTL_MS, usedAt: null });
  return token;
}

// Marks the token used inside the same statement that claims it, so two
// concurrent submissions cannot both reset the password.
export async function consumeReset(token: string) {
  const db = getDb();
  const tokenHash = await hashToken(token);
  const now = Date.now();
  const [row] = await db.select().from(passwordResets).where(eq(passwordResets.tokenHash, tokenHash)).limit(1);
  if (!row || row.usedAt || row.expiresAt <= now) return null;
  const claimed = await db.update(passwordResets).set({ usedAt: now })
    .where(and(eq(passwordResets.tokenHash, tokenHash), isNull(passwordResets.usedAt))).returning();
  if (!claimed.length) return null;
  await db.delete(passwordResets).where(lt(passwordResets.expiresAt, now - RESET_TTL_MS)).catch(() => undefined);
  return row.userEmail;
}
