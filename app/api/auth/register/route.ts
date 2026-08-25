import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { appUsers } from "../../../../db/schema";
import { hashPassword } from "../../../../lib/password";
import { createSession } from "../../../../lib/session";
import { checkThrottle, clientKeys, recordFailure } from "../../../../lib/throttle";
import { issueVerification } from "../../../../lib/tokens";
import { appOrigin, mailerStatus, sendMail } from "../../../../lib/mailer";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 10;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  // Registration reveals whether an email is already taken, which is a known
  // enumeration trade-off. Throttling by IP keeps that from being usable at
  // scale; removing the leak entirely needs a verification email instead.
  const throttle = await checkThrottle(clientKeys(request, ""));
  if (throttle.blocked) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(throttle.retryAfterSeconds / 60)} minutes.` },
      { status: 429, headers: { "retry-after": String(throttle.retryAfterSeconds) } },
    );
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const displayName = String(body.displayName ?? "").trim();

  if (!EMAIL_PATTERN.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (displayName.length < 2) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  if (password.length < MIN_PASSWORD_LENGTH) return NextResponse.json({ error: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.` }, { status: 400 });
  if (body.accepted !== true) return NextResponse.json({ error: "Accept the terms and risk disclosure to continue." }, { status: 400 });

  const db = getDb();
  const [existing] = await db.select({ email: appUsers.email }).from(appUsers).where(eq(appUsers.email, email)).limit(1);
  if (existing) {
    await recordFailure(clientKeys(request, ""));
    return NextResponse.json({ error: "An account already exists for this email. Sign in instead." }, { status: 409 });
  }

  const { hash, salt, iterations } = await hashPassword(password);
  const now = Date.now();
  const mailer = mailerStatus();
  // An address is only ever proven by following a link sent to it. Registration
  // grants nothing on its own, whatever address is submitted.
  await db.insert(appUsers).values({ email, displayName, emailVerifiedAt: null, passwordHash: hash, passwordSalt: salt, passwordIterations: iterations, createdAt: now, updatedAt: now });
  await createSession(email);

  let verificationSent = false;
  if (mailer.configured) {
    const token = await issueVerification(email);
    const link = `${appOrigin(request)}/verify?token=${encodeURIComponent(token)}`;
    verificationSent = await sendMail(email, "Confirm your ChatOnYou Trade email", `Confirm your email address to continue:\n\n${link}\n\nThis link expires in 24 hours. If you did not create this account, ignore this message.`);
  }
  return NextResponse.json({ ok: true, email, displayName, emailVerified: false, verificationSent });
}
