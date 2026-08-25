import { env } from "cloudflare:workers";

export type ProviderVariable = { key: string; present: boolean; secret: boolean; text: string };
export type KycProviderStatus = {
  name: string;
  mode: "sandbox" | "live" | "unset";
  configured: boolean;
  missing: string[];
  variables: ProviderVariable[];
};

const requiredVariables = [
  { key: "KYC_PROVIDER", secret: false, text: "Provider identifier recorded alongside every review decision." },
  { key: "KYC_PROVIDER_MODE", secret: false, text: "Must stay `sandbox` until compliance clears the live workflow." },
  { key: "KYC_PROVIDER_BASE_URL", secret: false, text: "Regional API host issued with the provider account." },
  { key: "KYC_PROVIDER_WORKFLOW_ID", secret: false, text: "Workflow that runs PAN, document, liveness and AML screening." },
  { key: "KYC_PROVIDER_APP_ID", secret: true, text: "Server-side credential. Never sent to the browser." },
  { key: "KYC_PROVIDER_APP_KEY", secret: true, text: "Server-side credential. Never sent to the browser." },
] as const;

function readEnv(key: string) {
  const workerValue = (env as unknown as Record<string, unknown>)[key];
  const value = typeof workerValue === "string" ? workerValue : process.env[key] ?? "";
  return value.trim();
}

// Only presence is ever reported. Credential values stay inside the worker.
export function getKycProviderStatus(): KycProviderStatus {
  const variables = requiredVariables.map((item) => ({ key: item.key, secret: item.secret, text: item.text, present: readEnv(item.key).length > 0 }));
  const missing = variables.filter((item) => !item.present).map((item) => item.key);
  const mode = readEnv("KYC_PROVIDER_MODE").toLowerCase();
  return {
    name: readEnv("KYC_PROVIDER"),
    mode: mode === "live" ? "live" : mode === "sandbox" ? "sandbox" : "unset",
    configured: missing.length === 0,
    missing,
    variables,
  };
}

const PROVIDER_TIMEOUT_MS = 15000;

export type ProviderCheckResult = { id: string; label: string; outcome: "pass" | "fail" | "review" | "skipped"; detail: string };
export type ProviderRun = {
  provider: string;
  mode: "sandbox" | "live";
  reference: string;
  outcome: "pass" | "fail" | "review";
  checks: ProviderCheckResult[];
  checkedAt: number;
};

// Which reviewer attestation each provider check can satisfy. A passing
// provider result never approves anything on its own; it only tells the
// reviewer which boxes the automated run supports.
export const PROVIDER_CHECK_MAP: Record<string, string> = {
  pan: "pan",
  identity: "identity",
  address: "address",
  liveness: "liveness",
  sanctions: "sanctions",
  bank: "bank",
};

function readEnvValue(key: string) {
  const workerValue = (env as unknown as Record<string, unknown>)[key];
  return (typeof workerValue === "string" ? workerValue : process.env[key] ?? "").trim();
}

type ApplicantInput = { reference: string; fullName: string; birthYear: number; panLast4: string; city: string; state: string; pincode: string; idType: string };

// Submits the application to the configured provider workflow and normalises
// the response. Returns null when no provider is configured — the caller then
// stays on the manual path rather than inventing a result.
export async function runProviderChecks(applicant: ApplicantInput): Promise<ProviderRun | null> {
  const status = getKycProviderStatus();
  if (!status.configured || status.mode === "unset") return null;

  const baseUrl = readEnvValue("KYC_PROVIDER_BASE_URL").replace(/\/$/, "");
  // Bounded, so an unresponsive provider fails the run instead of holding the
  // applicant's submission open until the request is killed.
  const response = await fetch(`${baseUrl}/workflows/${encodeURIComponent(readEnvValue("KYC_PROVIDER_WORKFLOW_ID"))}/runs`, {
    method: "POST",
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: {
      "content-type": "application/json",
      appId: readEnvValue("KYC_PROVIDER_APP_ID"),
      appKey: readEnvValue("KYC_PROVIDER_APP_KEY"),
    },
    body: JSON.stringify({
      transactionId: applicant.reference,
      applicant: {
        name: applicant.fullName,
        birthYear: applicant.birthYear,
        panLast4: applicant.panLast4,
        address: { city: applicant.city, state: applicant.state, pincode: applicant.pincode },
        idType: applicant.idType,
      },
    }),
  });

  if (!response.ok) throw new Error(`The verification provider returned ${response.status}.`);
  const payload = await response.json() as Record<string, unknown>;
  const rawChecks = Array.isArray(payload.checks) ? payload.checks as Record<string, unknown>[] : [];
  const checks: ProviderCheckResult[] = rawChecks.map((item) => ({
    id: String(item.id ?? ""),
    label: String(item.label ?? item.id ?? "Check"),
    outcome: normaliseOutcome(item.status ?? item.outcome),
    detail: String(item.detail ?? item.reason ?? ""),
  })).filter((item) => item.id);

  // An unrecognised or missing overall verdict is treated as needing review,
  // never as a pass.
  const overall = normaliseOutcome(payload.status ?? payload.outcome);
  const outcome = checks.some((item) => item.outcome === "fail") ? "fail" : overall === "pass" ? "pass" : overall === "fail" ? "fail" : "review";

  return {
    provider: status.name,
    mode: status.mode === "live" ? "live" : "sandbox",
    reference: String(payload.referenceId ?? payload.transactionId ?? applicant.reference),
    outcome,
    checks,
    checkedAt: Date.now(),
  };
}

function normaliseOutcome(value: unknown): ProviderCheckResult["outcome"] {
  const text = String(value ?? "").toLowerCase();
  if (["pass", "passed", "approved", "success", "auto_approved"].includes(text)) return "pass";
  if (["fail", "failed", "rejected", "declined"].includes(text)) return "fail";
  if (["skip", "skipped", "not_applicable"].includes(text)) return "skipped";
  return "review";
}
