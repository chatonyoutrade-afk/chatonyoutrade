import { env } from "cloudflare:workers";
import type { AppUser } from "../app/auth";

// Reviewers allowed to open /admin/kyc and /admin/kyc/provider.
//
// KYC_ADMIN_EMAILS on the deployment overrides this list entirely, so
// reviewers can be added or removed later without a code change. The list
// below is what applies when that variable is not set.
//
// Both Gmail spellings of the owner address are included because the
// comparison is an exact string match against the signed-in account.
const defaultAdminEmails = ["sumit.khatod1990@gmail.com", "sumitkhatod1990@gmail.com"];

function adminEmails() {
  const workerValue = (env as unknown as Record<string, unknown>).KYC_ADMIN_EMAILS;
  const value = typeof workerValue === "string" ? workerValue : process.env.KYC_ADMIN_EMAILS ?? "";
  const configured = value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return new Set(configured.length ? configured : defaultAdminEmails);
}

export function isKycAdmin(user: AppUser | null) {
  return Boolean(user && adminEmails().has(user.email.toLowerCase()));
}
