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
