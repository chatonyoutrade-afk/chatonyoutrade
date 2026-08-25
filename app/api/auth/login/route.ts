import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { appUsers } from "../../../../db/schema";
import { verifyPassword } from "../../../../lib/password";
import { createSession } from "../../../../lib/session";

export const dynamic = "force-dynamic";

// One message for both a missing account and a wrong password, so the endpoint
// cannot be used to discover which emails are registered.
const REJECTION = "Email or password is incorrect.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) return NextResponse.json({ error: REJECTION }, { status: 401 });

  const [user] = await getDb().select().from(appUsers).where(eq(appUsers.email, email)).limit(1);
  if (!user) return NextResponse.json({ error: REJECTION }, { status: 401 });

  const valid = await verifyPassword(password, { hash: user.passwordHash, salt: user.passwordSalt, iterations: user.passwordIterations });
  if (!valid) return NextResponse.json({ error: REJECTION }, { status: 401 });

  await createSession(user.email);
  return NextResponse.json({ ok: true, email: user.email, displayName: user.displayName });
}
