import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getUser } from "../../../auth";
import { getDb } from "../../../../db";
import { kycApplications } from "../../../../db/schema";
import { checkDigiLockerSession, initiateDigiLockerSession, type ProviderCheckResult } from "../../../../lib/kyc-provider";

export const dynamic = "force-dynamic";

function parseChecks(value: string | null): ProviderCheckResult[] {
  try { return value ? JSON.parse(value) as ProviderCheckResult[] : []; }
  catch { return []; }
}

function sessionFromChecks(checks: ProviderCheckResult[]) {
  return checks.find((item) => item.id === "digilocker_session")?.detail ?? "";
}

async function applicationFor(email: string) {
  const [application] = await getDb().select().from(kycApplications).where(eq(kycApplications.userEmail, email)).limit(1);
  return application;
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!user.emailVerified) return NextResponse.json({ error: "Confirm your email before connecting DigiLocker." }, { status: 403 });
  const application = await applicationFor(user.email);
  if (!application) return NextResponse.json({ error: "Submit your KYC details before connecting DigiLocker." }, { status: 409 });

  try {
    const returnUrl = new URL("/kyc/digilocker/return", new URL(request.url).origin).toString();
    const session = await initiateDigiLockerSession(returnUrl);
    const checks = parseChecks(application.providerChecks).filter((item) => !["digilocker_session", "identity", "address"].includes(item.id));
    checks.push({ id: "digilocker_session", label: "DigiLocker consent", outcome: "review", detail: session.sessionId });
    await getDb().update(kycApplications).set({ providerChecks: JSON.stringify(checks), updatedAt: Date.now() }).where(eq(kycApplications.id, application.id));
    return NextResponse.json({ authorizationUrl: session.authorizationUrl });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "DigiLocker could not be started." }, { status: 502 });
  }
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const application = await applicationFor(user.email);
  if (!application) return NextResponse.json({ status: "not_started", completed: false });
  const checks = parseChecks(application.providerChecks);
  const sessionId = sessionFromChecks(checks);
  if (!sessionId) return NextResponse.json({ status: "not_started", completed: false });

  try {
    const result = await checkDigiLockerSession(sessionId);
    if (result.completed) {
      const nextChecks = checks.filter((item) => !["digilocker_session", "identity", "address"].includes(item.id));
      nextChecks.push(
        { id: "digilocker_session", label: "DigiLocker consent", outcome: "pass", detail: sessionId },
        { id: "identity", label: "DigiLocker identity document", outcome: "review", detail: "Consent completed; authorised reviewer must validate the consented document." },
        { id: "address", label: "DigiLocker address evidence", outcome: "review", detail: "Consent completed; authorised reviewer must match the document address to the application." },
      );
      await getDb().update(kycApplications).set({ providerChecks: JSON.stringify(nextChecks), updatedAt: Date.now() }).where(eq(kycApplications.id, application.id));
    }
    return NextResponse.json({ status: result.state, completed: result.completed });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "DigiLocker status is unavailable." }, { status: 502 });
  }
}
