import { and, eq, inArray, lt } from "drizzle-orm";
import { getDb } from "../db";
import { authThrottle } from "../db/schema";

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

// The lock is deliberately short. A longer one would let anyone disable another
// person's account just by submitting wrong passwords for their email.
export type ThrottleState = { blocked: boolean; retryAfterSeconds: number };

export function clientKeys(request: Request, email: string) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const keys = [`ip:${ip}`];
  if (email) keys.push(`email:${email}`);
  return keys;
}

export async function checkThrottle(keys: string[]): Promise<ThrottleState> {
  if (!keys.length) return { blocked: false, retryAfterSeconds: 0 };
  const now = Date.now();
  const rows = await getDb().select().from(authThrottle).where(inArray(authThrottle.key, keys));
  const lockedUntil = rows.reduce((latest, row) => Math.max(latest, row.lockedUntil), 0);
  if (lockedUntil <= now) return { blocked: false, retryAfterSeconds: 0 };
  return { blocked: true, retryAfterSeconds: Math.ceil((lockedUntil - now) / 1000) };
}

export async function recordFailure(keys: string[]) {
  const db = getDb();
  const now = Date.now();
  for (const key of keys) {
    const [row] = await db.select().from(authThrottle).where(eq(authThrottle.key, key)).limit(1);
    // A row older than the window starts a fresh count rather than accumulating.
    if (!row || now - row.firstFailureAt > WINDOW_MS) {
      const values = { key, failures: 1, firstFailureAt: now, lockedUntil: 0 };
      await db.insert(authThrottle).values(values).onConflictDoUpdate({ target: authThrottle.key, set: values });
      continue;
    }
    const failures = row.failures + 1;
    await db.update(authThrottle)
      .set({ failures, lockedUntil: failures >= MAX_FAILURES ? now + LOCK_MS : row.lockedUntil })
      .where(eq(authThrottle.key, key));
  }
  // Drop only rows whose counting window has passed and whose lock has expired.
  // Matching on lockedUntil alone would delete every unlocked row, including the
  // one just written, because an unlocked row stores 0.
  await db.delete(authThrottle)
    .where(and(lt(authThrottle.firstFailureAt, now - WINDOW_MS), lt(authThrottle.lockedUntil, now)))
    .catch(() => undefined);
}

export async function clearThrottle(keys: string[]) {
  if (!keys.length) return;
  await getDb().delete(authThrottle).where(inArray(authThrottle.key, keys)).catch(() => undefined);
}
