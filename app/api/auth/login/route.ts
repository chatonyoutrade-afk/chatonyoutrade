import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { appUsers } from "../../../../db/schema";
import { burnVerificationCost, verifyPassword } from "../../../../lib/password";
import { createSession } from "../../../../lib/session";
import { checkThrottle, clearThrottle, clientKeys, recordFailure } from "../../../../lib/throttle";

export const dynamic = "force-dynamic";

// One message for both a missing account and a wrong password, so the endpoint
// cannot be used to discover which emails are registered.
const REJECTION = "Email or password is incorrect.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const keys = clientKeys(request, email, "login");

  const throttle = await checkThrottle(keys);
  if (throttle.blocked) {
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in ${Math.ceil(throttle.retryAfterSeconds / 60)} minutes.` },
      { status: 429, headers: { "retry-after": String(throttle.retryAfterSeconds) } },
    );
  }

  if (!email || !password) {
    await recordFailure(keys);
    return NextResponse.json({ error: REJECTION }, { status: 401 });
  }

  const [user] = await getDb().select().from(appUsers).where(eq(appUsers.email, email)).limit(1);
  // Both branches pay the same hashing cost, so the response time does not
  // distinguish a wrong password from an address that was never registered.
  const valid = user
    ? await verifyPassword(password, { hash: user.passwordHash, salt: user.passwordSalt, iterations: user.passwordIterations })
    : await burnVerificationCost();
  if (!user || !valid) {
    await recordFailure(keys);
    return NextResponse.json({ error: REJECTION }, { status: 401 });
  }

  await clearThrottle(keys);
  await createSession(user.email);
  return NextResponse.json({ ok: true, email: user.email, displayName: user.displayName });
}
