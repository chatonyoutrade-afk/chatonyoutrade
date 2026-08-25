import { env } from "cloudflare:workers";
import type { ChatGPTUser } from "../app/chatgpt-auth";

// Reviewers come from the KYC_ADMIN_EMAILS environment variable: a
// comma-separated list of the exact account emails allowed to open
// /admin/kyc and /admin/kyc/provider. There is no default. If the variable
// is unset, no account is a reviewer and both pages refuse access.
function adminEmails() {
  const workerValue = (env as unknown as Record<string, unknown>).KYC_ADMIN_EMAILS;
  const value = typeof workerValue === "string" ? workerValue : process.env.KYC_ADMIN_EMAILS ?? "";
  return new Set(value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
}

export function isKycAdmin(user: ChatGPTUser | null) {
  return Boolean(user && adminEmails().has(user.email.toLowerCase()));
}
