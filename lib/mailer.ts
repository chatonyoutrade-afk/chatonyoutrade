import { env } from "cloudflare:workers";

// Transactional email. Resend is the only backend wired today; adding another
// means implementing send() against its API, nothing else changes.
function read(key: string) {
  const workerValue = (env as unknown as Record<string, unknown>)[key];
  return (typeof workerValue === "string" ? workerValue : process.env[key] ?? "").trim();
}

function apiKey() {
  return read("EMAIL_API_KEY") || read("RESEND_API_KEY");
}

function fromAddress() {
  const configured = read("EMAIL_FROM");
  if (configured) return configured;

  const resendDomain = read("RESEND_EMAIL_DOMAIN");
  return resendDomain ? `ChatOnYou <noreply@${resendDomain}>` : "";
}

export function mailerStatus() {
  const key = apiKey();
  const from = fromAddress();
  return {
    provider: read("EMAIL_PROVIDER") || (key ? "resend" : ""),
    configured: Boolean(key && from),
    missing: [!key && "EMAIL_API_KEY or RESEND_API_KEY", !from && "EMAIL_FROM or RESEND_EMAIL_DOMAIN"].filter(Boolean) as string[],
  };
}

export function appOrigin(request: Request) {
  const configured = read("APP_ORIGIN");
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

// Returns a delivery result rather than throwing: callers decide whether an
// undelivered message is fatal, without leaking provider errors to the browser.
export async function sendMailWithResult(to: string, subject: string, text: string): Promise<{ sent: boolean; id: string | null }> {
  const status = mailerStatus();
  if (!status.configured) return { sent: false, id: null };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey()}`, "content-type": "application/json" },
      body: JSON.stringify({ from: fromAddress(), to, subject, text }),
    });
    if (!response.ok) return { sent: false, id: null };
    const result = await response.json().catch(() => null) as { id?: unknown } | null;
    return { sent: true, id: typeof result?.id === "string" ? result.id : null };
  } catch {
    return { sent: false, id: null };
  }
}

export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  return (await sendMailWithResult(to, subject, text)).sent;
}
