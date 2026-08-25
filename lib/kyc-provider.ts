import { env } from "cloudflare:workers";

export type ProviderVariable = { key: string; present: boolean; secret: boolean; text: string };
export type KycProviderStatus = {
  name: string;
  mode: "sandbox" | "live" | "unset";
  configured: boolean;
  missing: string[];
  variables: ProviderVariable[];
};

const sandboxVariables = [
  { key: "KYC_PROVIDER", secret: false, text: "Provider identifier recorded alongside every review decision." },
  { key: "KYC_PROVIDER_MODE", secret: false, text: "Must stay `sandbox` until compliance clears the live workflow." },
  { key: "KYC_PROVIDER_BASE_URL", secret: false, text: "Sandbox API host; production uses a separate approved host." },
  { key: "SANDBOX_API_KEY", secret: true, text: "Server-side Sandbox API key. Never sent to the browser." },
  { key: "SANDBOX_API_SECRET", secret: true, text: "Server-side Sandbox API secret. Never sent to the browser." },
] as const;

function readEnv(key: string) {
  const workerValue = (env as unknown as Record<string, unknown>)[key];
  return (typeof workerValue === "string" ? workerValue : process.env[key] ?? "").trim();
}

// Only presence is ever reported. Credential values stay inside the worker.
export function getKycProviderStatus(): KycProviderStatus {
  const variables = sandboxVariables.map((item) => ({ ...item, present: readEnv(item.key).length > 0 }));
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
// provider result never approves anything on its own.
export const PROVIDER_CHECK_MAP: Record<string, string> = {
  pan: "pan",
  identity: "identity",
  address: "address",
  liveness: "liveness",
  sanctions: "sanctions",
  bank: "bank",
};

type ApplicantInput = { reference: string; fullName: string; dob: string; pan: string };

let cachedAccessToken = "";
let cachedAccessTokenUntil = 0;

async function getSandboxAccessToken(baseUrl: string) {
  if (cachedAccessToken && Date.now() < cachedAccessTokenUntil) return cachedAccessToken;
  const response = await fetch(`${baseUrl}/authenticate`, {
    method: "POST",
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: {
      "x-api-key": readEnv("SANDBOX_API_KEY"),
      "x-api-secret": readEnv("SANDBOX_API_SECRET"),
    },
  });
  if (!response.ok) throw new Error(`Sandbox authentication returned ${response.status}.`);
  const payload = await response.json() as { data?: { access_token?: unknown } };
  const token = String(payload.data?.access_token ?? "");
  if (!token) throw new Error("Sandbox authentication returned no access token.");
  cachedAccessToken = token;
  // Sandbox tokens last 24 hours; refresh early so an in-flight check never uses an expired token.
  cachedAccessTokenUntil = Date.now() + 23 * 60 * 60 * 1000;
  return token;
}

function sandboxRequestHeaders(accessToken: string) {
  return {
    authorization: accessToken,
    "content-type": "application/json",
    "x-api-key": readEnv("SANDBOX_API_KEY"),
  };
}

export type DigiLockerSession = { sessionId: string; authorizationUrl: string };

async function sandboxResponseError(response: Response, operation: string) {
  let providerCode = "";
  try {
    const payload = await response.json() as {
      code?: unknown;
      error?: { code?: unknown } | unknown;
    };
    providerCode = String(
      payload.code ??
      (typeof payload.error === "object" && payload.error !== null && "code" in payload.error
        ? (payload.error as { code?: unknown }).code
        : "") ?? "",
    ).replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 64);
  } catch {
    // Some provider failures do not return JSON. Keep the client-facing error generic.
  }
  const suffix = providerCode ? ` (${providerCode})` : "";
  return new Error(`Sandbox ${operation} returned ${response.status}${suffix}.`);
}

export async function initiateDigiLockerSession(redirectUrl: string): Promise<DigiLockerSession> {
  const status = getKycProviderStatus();
  if (!status.configured || status.mode === "unset") throw new Error("Sandbox KYC is not configured.");
  const baseUrl = readEnv("KYC_PROVIDER_BASE_URL").replace(/\/$/, "");
  const accessToken = await getSandboxAccessToken(baseUrl);
  const response = await fetch(`${baseUrl}/kyc/digilocker/sessions/init`, {
    method: "POST",
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: sandboxRequestHeaders(accessToken),
    body: JSON.stringify({
      "@entity": "in.co.sandbox.kyc.digilocker.session.request",
      flow: "signin",
      redirect_url: redirectUrl,
      doc_types: ["aadhaar", "pan"],
      // Sandbox requires this to still be at least one hour in the future when
      // its server validates the request, so leave a full extra-hour buffer.
      consent_expiry: Date.now() + 2 * 60 * 60 * 1000,
    }),
  });
  if (!response.ok) throw await sandboxResponseError(response, "DigiLocker initiation");
  const payload = await response.json() as { data?: { session_id?: unknown; authorization_url?: unknown } };
  const sessionId = String(payload.data?.session_id ?? "");
  const authorizationUrl = String(payload.data?.authorization_url ?? "");
  const target = new URL(authorizationUrl);
  const approvedHost = target.protocol === "https:" && (target.hostname.endsWith("meripehchaan.gov.in") || target.hostname.endsWith("digilocker.gov.in"));
  if (!sessionId || !approvedHost) throw new Error("Sandbox returned an invalid DigiLocker session.");
  return { sessionId, authorizationUrl };
}

export async function checkDigiLockerSession(sessionId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) throw new Error("Invalid DigiLocker session reference.");
  const status = getKycProviderStatus();
  if (!status.configured || status.mode === "unset") throw new Error("Sandbox KYC is not configured.");
  const baseUrl = readEnv("KYC_PROVIDER_BASE_URL").replace(/\/$/, "");
  const accessToken = await getSandboxAccessToken(baseUrl);
  const response = await fetch(`${baseUrl}/kyc/digilocker/sessions/${encodeURIComponent(sessionId)}/status`, {
    method: "GET",
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: sandboxRequestHeaders(accessToken),
  });
  if (!response.ok) throw new Error(`Sandbox DigiLocker status returned ${response.status}.`);
  const payload = await response.json() as { data?: { status?: unknown; documents?: unknown; doc_types?: unknown } };
  const state = String(payload.data?.status ?? "created").toLowerCase();
  return { state, completed: ["succeeded", "success", "completed"].includes(state) };
}

function toSandboxDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error("Date of birth is not in the expected format.");
  return `${match[3]}/${match[2]}/${match[1]}`;
}

// Full PAN and DOB exist only in this request and are sent directly to Sandbox
// over HTTPS. The database continues to store only PAN last-four and birth year.
export async function runProviderChecks(applicant: ApplicantInput): Promise<ProviderRun | null> {
  const status = getKycProviderStatus();
  if (!status.configured || status.mode === "unset") return null;
  if (!status.name.toLowerCase().includes("sandbox")) throw new Error("The configured KYC provider is not supported by this adapter.");

  const baseUrl = readEnv("KYC_PROVIDER_BASE_URL").replace(/\/$/, "");
  const accessToken = await getSandboxAccessToken(baseUrl);
  const response = await fetch(`${baseUrl}/kyc/pan/verify`, {
    method: "POST",
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: sandboxRequestHeaders(accessToken),
    body: JSON.stringify({
      "@entity": "in.co.sandbox.kyc.pan_verification.request",
      pan: applicant.pan,
      name_as_per_pan: applicant.fullName,
      date_of_birth: toSandboxDate(applicant.dob),
      consent: "Y",
      reason: "Identity verification for customer onboarding",
    }),
  });

  if (!response.ok) throw new Error(`Sandbox PAN verification returned ${response.status}.`);
  const payload = await response.json() as {
    transaction_id?: unknown;
    data?: { status?: unknown; remarks?: unknown; name_as_per_pan_match?: unknown; date_of_birth_match?: unknown };
  };
  const data = payload.data ?? {};
  const panValid = String(data.status ?? "").toLowerCase() === "valid";
  const nameMatches = data.name_as_per_pan_match === true;
  const dobMatches = data.date_of_birth_match === true;
  const passed = panValid && nameMatches && dobMatches;
  const detail = passed
    ? "PAN is valid and the submitted name and date of birth match."
    : String(data.remarks ?? "PAN, name or date-of-birth verification did not pass.");

  return {
    provider: status.name,
    mode: status.mode === "live" ? "live" : "sandbox",
    reference: String(payload.transaction_id ?? applicant.reference),
    // PAN alone is never a complete KYC approval.
    outcome: passed ? "review" : "fail",
    checks: [{ id: "pan", label: "PAN verification", outcome: passed ? "pass" : "fail", detail }],
    checkedAt: Date.now(),
  };
}
