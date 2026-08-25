import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { appUsers } from "../../../../db/schema";
import { hashPassword } from "../../../../lib/password";
import { createSession } from "../../../../lib/session";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 10;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const displayName = String(body.displayName ?? "").trim();

  if (!EMAIL_PATTERN.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (displayName.length < 2) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  if (password.length < MIN_PASSWORD_LENGTH) return NextResponse.json({ error: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.` }, { status: 400 });
  if (body.accepted !== true) return NextResponse.json({ error: "Accept the terms and risk disclosure to continue." }, { status: 400 });

  const db = getDb();
  const [existing] = await db.select({ email: appUsers.email }).from(appUsers).where(eq(appUsers.email, email)).limit(1);
  if (existing) return NextResponse.json({ error: "An account already exists for this email. Sign in instead." }, { status: 409 });

  const { hash, salt, iterations } = await hashPassword(password);
  const now = Date.now();
  await db.insert(appUsers).values({ email, displayName, passwordHash: hash, passwordSalt: salt, passwordIterations: iterations, createdAt: now, updatedAt: now });
  await createSession(email);
  return NextResponse.json({ ok: true, email, displayName });
}
