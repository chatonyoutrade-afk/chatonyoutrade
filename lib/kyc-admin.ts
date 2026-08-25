import { env } from "cloudflare:workers";
import type { AppUser } from "../app/auth";

// Reviewers allowed to open /admin/kyc and /admin/kyc/provider.
//
// KYC_ADMIN_EMAILS must be set on the deployment: a comma-separated list of
// exact account emails. There is deliberately no default. A default shipped in
// this repository would be a published string that grants reviewer access to
// whoever registers it first, because reviewer status is decided by matching
// the address on a signed-in account.
//
// Membership alone is not enough. The address must also be proven, so that
// registering a known reviewer email cannot by itself reach an applicant's
// name, PAN fragment or address.
function adminEmails() {
  const workerValue = (env as unknown as Record<string, unknown>).KYC_ADMIN_EMAILS;
  const value = typeof workerValue === "string" ? workerValue : process.env.KYC_ADMIN_EMAILS ?? "";
  return new Set(value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
}

export function isKycAdmin(user: AppUser | null) {
  if (!user || !user.emailVerified) return false;
  return adminEmails().has(user.email.toLowerCase());
}
