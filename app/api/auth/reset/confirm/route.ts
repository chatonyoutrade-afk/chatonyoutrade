import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { appUsers } from "../../../../../db/schema";
import { consumeReset } from "../../../../../lib/tokens";
import { hashPassword } from "../../../../../lib/password";
import { destroyAllSessionsFor } from "../../../../../lib/session";
import { clearThrottle, clientKeys } from "../../../../../lib/throttle";

export const dynamic = "force-dynamic";
const MIN_PASSWORD_LENGTH = 10;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) return NextResponse.json({ error: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.` }, { status: 400 });
  const email = await consumeReset(token);
  if (!email) return NextResponse.json({ error: "This reset link has expired or was already used." }, { status: 400 });
  const { hash, salt, iterations } = await hashPassword(password);
  await getDb().update(appUsers).set({ passwordHash: hash, passwordSalt: salt, passwordIterations: iterations, updatedAt: Date.now() }).where(eq(appUsers.email, email));
  // Every existing session is dropped: whoever reset the password decides who
  // stays signed in, and an attacker's session must not survive it.
  await destroyAllSessionsFor(email);
  await clearThrottle(clientKeys(request, email));
  return NextResponse.json({ ok: true });
}
