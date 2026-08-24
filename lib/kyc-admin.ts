import { env } from "cloudflare:workers";
import type { ChatGPTUser } from "../app/chatgpt-auth";

function adminEmails() {
  const workerValue = (env as unknown as Record<string, unknown>).KYC_ADMIN_EMAILS;
  const value = typeof workerValue === "string" ? workerValue : process.env.KYC_ADMIN_EMAILS ?? "";
  return new Set(value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
}

export function isKycAdmin(user: ChatGPTUser | null) {
  return Boolean(user && adminEmails().has(user.email.toLowerCase()));
}

