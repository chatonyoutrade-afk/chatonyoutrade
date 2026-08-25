import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { appUsers } from "../../../../db/schema";
import { issueVerification, consumeVerification } from "../../../../lib/tokens";
import { appOrigin, mailerStatus, sendMail } from "../../../../lib/mailer";
import { getUser } from "../../../auth";
import { checkThrottle, clientKeys, recordFailure } from "../../../../lib/throttle";

export const dynamic = "force-dynamic";

// Confirm an address from the emailed link.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "This verification link is incomplete." }, { status: 400 });
  const email = await consumeVerification(token);
  if (!email) return NextResponse.json({ error: "This verification link has expired or was already used." }, { status: 400 });
  await getDb().update(appUsers).set({ emailVerifiedAt: Date.now(), updatedAt: Date.now() }).where(eq(appUsers.email, email));
  return NextResponse.json({ ok: true, email });
}

// Re-send the link to the signed-in account.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const keys = clientKeys(request, user.email);
  const throttle = await checkThrottle(keys);
  if (throttle.blocked) {
    return NextResponse.json({ error: `Too many requests. Try again in ${Math.ceil(throttle.retryAfterSeconds / 60)} minutes.` }, { status: 429, headers: { "retry-after": String(throttle.retryAfterSeconds) } });
  }
  const [row] = await getDb().select().from(appUsers).where(eq(appUsers.email, user.email)).limit(1);
  if (!row) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (row.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });
  if (!mailerStatus().configured) return NextResponse.json({ error: "Email delivery is not configured on this deployment." }, { status: 503 });
  await recordFailure(keys);
  const token = await issueVerification(user.email);
  const link = `${appOrigin(request)}/verify?token=${encodeURIComponent(token)}`;
  const sent = await sendMail(user.email, "Confirm your ChatOnYou Trade email", `Confirm your email address to continue:\n\n${link}\n\nThis link expires in 24 hours. If you did not create this account, ignore this message.`);
  if (!sent) return NextResponse.json({ error: "The verification email could not be sent. Try again shortly." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
