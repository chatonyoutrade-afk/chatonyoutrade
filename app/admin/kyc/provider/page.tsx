import { requireChatGPTUser } from "../../../chatgpt-auth";
import { isKycAdmin } from "../../../../lib/kyc-admin";
import { getKycProviderStatus } from "../../../../lib/kyc-provider";

export const dynamic = "force-dynamic";

const providerChecks = [
  { id: "pan", label: "PAN verification", text: "Name and PAN status confirmed against the issuing source." },
  { id: "identity", label: "Identity document", text: "Aadhaar, passport, licence or voter ID authenticity and data extraction." },
  { id: "address", label: "Address proof", text: "Accepted proof matched to the declared residential address." },
  { id: "liveness", label: "Selfie and liveness", text: "Face match against the identity document plus presentation-attack detection." },
  { id: "sanctions", label: "AML, sanctions and PEP", text: "UNSC, UAPA, WMDA and PEP screening with re-screening on list changes." },
  { id: "bank", label: "Bank-account name", text: "Penny-drop or equivalent name match on the settlement account." },
];

const manualChecks = [
  { label: "Risk rating", text: "Low, medium or high is assigned by the reviewer, never by the provider alone." },
  { label: "Enhanced due diligence", text: "High-risk files need source-of-funds review and senior-management approval." },
  { label: "Final decision", text: "Approve, request re-upload or reject is always a recorded human decision." },
];

const setupSteps = [
  { step: "01", title: "Activate the provider account", text: "Complete provider onboarding for NEOCRAFT LLP and obtain a sandbox workflow covering PAN, document, liveness and AML screening." },
  { step: "02", title: "Store credentials as secrets", text: "Add every variable below as a secret environment variable on the deployment. Credentials must never enter this repository or any client bundle." },
  { step: "03", title: "Run the sandbox end to end", text: "Submit a full client application and confirm the provider returns results for each mapped check before any live traffic." },
  { step: "04", title: "Compliance sign-off", text: "A qualified compliance reviewer approves the workflow, retention period and decision rules before `KYC_PROVIDER_MODE` moves to `live`." },
];

export default async function KycProviderPage() {
  const user = await requireChatGPTUser("/admin/kyc/provider");
  if (!isKycAdmin(user)) return <main className="admin-kyc-shell"><header className="admin-kyc-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>NEOCRAFT LLP · KYC OPERATIONS</span><a href="/">Exit</a></header><section className="admin-access-denied"><i>◇</i><span>RESTRICTED OPERATIONS</span><h1>KYC admin access required.</h1><p>Your signed-in email is not included in the server-side KYC reviewer allowlist.</p><a href="/signout-with-chatgpt?return_to=%2Flogin">Use another account</a></section></main>;

  const status = getKycProviderStatus();
  const tone = status.configured && status.mode === "live" ? "live" : status.configured ? "sandbox" : "unset";
  const headline = status.configured ? `${status.name} connected` : "No provider connected";
  const summary = status.configured
    ? status.mode === "live"
      ? "Live verification is enabled. Every submission is sent to the provider workflow."
      : "Sandbox verification is enabled. Results are test data and must not be used for a production approval."
    : "KYC decisions are manual-only. Reviewers must complete every identity, liveness and sanctions check outside this dashboard before approving.";

  return <main className="admin-kyc-shell">
    <header className="admin-kyc-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>NEOCRAFT LLP · KYC OPERATIONS</span><div><small>Authorised reviewer</small><b>{user.email}</b><a href="/admin/kyc">Review queue</a></div></header>

    <section className="admin-kyc-heading"><div><span>VERIFICATION PROVIDER</span><h1>KYC provider status</h1><p>The provider performs document, liveness and screening checks. It never makes the acceptance decision on its own.</p></div><article><small>INTEGRATION</small><b>{status.configured ? `${status.variables.length}/${status.variables.length}` : `${status.variables.length - status.missing.length}/${status.variables.length}`}</b><span>required variables present</span></article></section>

    <section className="admin-provider-body">
      <div className={`admin-provider-banner ${tone}`}><i>{status.configured ? (status.mode === "live" ? "!" : "◎") : "◇"}</i><div><small>{status.configured ? (status.mode === "live" ? "LIVE MODE" : "SANDBOX MODE") : "NOT CONNECTED"}</small><b>{headline}</b><p>{summary}</p></div></div>

      <section className="admin-provider-section"><header><span>REQUIRED ENVIRONMENT VARIABLES</span><b>{status.missing.length ? `${status.missing.length} missing` : "All present"}</b></header><div className="admin-provider-vars">{status.variables.map((item) => <article key={item.key} className={item.present ? "present" : "missing"}><header><i>{item.present ? "✓" : "!"}</i><code>{item.key}</code>{item.secret ? <em>Secret</em> : null}</header><p>{item.text}</p><small>{item.present ? "Configured on this deployment" : "Not set on this deployment"}</small></article>)}</div><p className="admin-provider-note">Only presence is shown. Credential values are read inside the worker and are never returned to a browser.</p></section>

      <section className="admin-provider-section"><header><span>PROVIDER-OWNED CHECKS</span><b>{providerChecks.length} mapped</b></header><div className="admin-provider-list">{providerChecks.map((item) => <article key={item.id} className={status.configured ? "ready" : ""}><i>{status.configured ? "✓" : "○"}</i><div><b>{item.label}</b><p>{item.text}</p></div><em>{status.configured ? (status.mode === "live" ? "Live" : "Sandbox") : "Manual"}</em></article>)}</div></section>

      <section className="admin-provider-section"><header><span>ALWAYS MANUAL</span><b>Reviewer responsibility</b></header><div className="admin-provider-list">{manualChecks.map((item) => <article key={item.label}><i>◆</i><div><b>{item.label}</b><p>{item.text}</p></div><em>Human</em></article>)}</div></section>

      <div className="admin-privacy-note"><i>◇</i><p><b>Decision rule</b><small>An approval requires a passing provider result and a reviewer attestation for every mandatory check. While no provider is connected, an approval means the reviewer has verified the source documents directly and has recorded that decision in the audit trail.</small></p></div>

      <section className="admin-provider-section"><header><span>ACTIVATION SEQUENCE</span><b>Sandbox before live</b></header><div className="admin-provider-steps">{setupSteps.map((item) => <article key={item.step}><span>{item.step}</span><div><b>{item.title}</b><p>{item.text}</p></div></article>)}</div></section>

      <div className="admin-provider-actions"><a href="/admin/kyc">Back to review queue</a><a href="/compliance">Compliance readiness</a></div>
    </section>

    <footer className="admin-kyc-footer">Real-money trading stays disabled. Provider activation alone does not clear the compliance gates listed on the readiness page.</footer>
  </main>;
}
