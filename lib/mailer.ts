import { env } from "cloudflare:workers";

// Transactional email. Resend is the only backend wired today; adding another
// means implementing send() against its API, nothing else changes.
function read(key: string) {
  const workerValue = (env as unknown as Record<string, unknown>)[key];
  return (typeof workerValue === "string" ? workerValue : process.env[key] ?? "").trim();
}

export function mailerStatus() {
  const apiKey = read("EMAIL_API_KEY");
  const from = read("EMAIL_FROM");
  return {
    provider: read("EMAIL_PROVIDER") || (apiKey ? "resend" : ""),
    configured: Boolean(apiKey && from),
    missing: [!apiKey && "EMAIL_API_KEY", !from && "EMAIL_FROM"].filter(Boolean) as string[],
  };
}

export function appOrigin(request: Request) {
  const configured = read("APP_ORIGIN");
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

// Returns false rather than throwing: a caller decides whether an undelivered
// message is fatal, and no caller should leak provider errors to the browser.
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const status = mailerStatus();
  if (!status.configured) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${read("EMAIL_API_KEY")}`, "content-type": "application/json" },
      body: JSON.stringify({ from: read("EMAIL_FROM"), to, subject, text }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
