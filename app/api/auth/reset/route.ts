import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { appUsers } from "../../../../db/schema";
import { issueReset } from "../../../../lib/tokens";
import { appOrigin, mailerStatus, sendMail } from "../../../../lib/mailer";
import { checkThrottle, clientKeys, recordFailure } from "../../../../lib/throttle";

export const dynamic = "force-dynamic";

// Always answers the same way, whether or not the address has an account, so
// this endpoint cannot be used to discover who is registered.
const ACKNOWLEDGEMENT = "If that email has an account, a reset link is on its way.";

export async function POST(request: Request) {
  if (!mailerStatus().configured) return NextResponse.json({ error: "Password reset is not available on this deployment yet." }, { status: 503 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const email = String(body.email ?? "").trim().toLowerCase();
  const keys = clientKeys(request, email, "reset");
  const throttle = await checkThrottle(keys);
  if (throttle.blocked) {
    return NextResponse.json({ error: `Too many requests. Try again in ${Math.ceil(throttle.retryAfterSeconds / 60)} minutes.` }, { status: 429, headers: { "retry-after": String(throttle.retryAfterSeconds) } });
  }
  await recordFailure(keys);
  const [user] = await getDb().select({ email: appUsers.email }).from(appUsers).where(eq(appUsers.email, email)).limit(1);
  if (user) {
    const token = await issueReset(user.email);
    const link = `${appOrigin(request)}/reset?token=${encodeURIComponent(token)}`;
    await sendMail(user.email, "Reset your ChatOnYou Trade password", `Use this link to choose a new password:\n\n${link}\n\nThis link expires in 1 hour and can be used once. If you did not request a reset, ignore this message and your password stays unchanged.`);
  }
  return NextResponse.json({ ok: true, message: ACKNOWLEDGEMENT });
}
