import { requireUser } from "../../../auth";
import { isKycAdmin } from "../../../../lib/kyc-admin";
import { getKycProviderStatus } from "../../../../lib/kyc-provider";

export const dynamic = "force-dynamic";

const providerChecks = [
  { id: "pan", label: "PAN verification", text: "Connected now: PAN validity, exact name and date-of-birth match.", automated: true },
  { id: "identity", label: "Identity document", text: "DigiLocker consent and document availability are integrated; reviewer matching remains required.", automated: true },
  { id: "address", label: "Address proof", text: "DigiLocker consent is integrated; address matching remains a reviewer step.", automated: false },
  { id: "liveness", label: "Selfie and liveness", text: "A supported liveness provider or approved manual process is required.", automated: false },
  { id: "sanctions", label: "AML, sanctions and PEP", text: "A screening provider or approved manual search process is required.", automated: false },
  { id: "bank", label: "Bank-account name", text: "Sandbox bank verification will follow account/IFSC collection.", automated: false },
];

const manualChecks = [
  { label: "Risk rating", text: "Low, medium or high is assigned by the reviewer, never by the provider alone." },
  { label: "Enhanced due diligence", text: "High-risk files need source-of-funds review and senior-management approval." },
  { label: "Final decision", text: "Approve, request re-upload or reject is always a recorded human decision." },
];

const setupSteps = [
  { step: "01", title: "Activate the provider account", text: "Completed for NEOCRAFT LLP. Sandbox API credentials are stored only as deployment secrets." },
  { step: "02", title: "Store credentials as secrets", text: "Add every variable below as a secret environment variable on the deployment. Credentials must never enter this repository or any client bundle." },
  { step: "03", title: "Run the sandbox end to end", text: "Submit a documented test identity and confirm PAN results before building DigiLocker, bank, liveness and AML stages." },
  { step: "04", title: "Compliance sign-off", text: "A qualified compliance reviewer approves the workflow, retention period and decision rules before `KYC_PROVIDER_MODE` moves to `live`." },
];

export default async function KycProviderPage() {
  const user = await requireUser("/admin/kyc/provider");
  if (!isKycAdmin(user)) return <main className="admin-kyc-shell"><header className="admin-kyc-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>NEOCRAFT LLP · KYC OPERATIONS</span><a href="/">Exit</a></header><section className="admin-access-denied"><i>◇</i><span>RESTRICTED OPERATIONS</span><h1>KYC admin access required.</h1><p>Your signed-in email is not included in the server-side KYC reviewer allowlist.</p><a href="/logout">Use another account</a></section></main>;

  const status = getKycProviderStatus();
  const tone = status.configured && status.mode === "live" ? "live" : status.configured ? "sandbox" : "unset";
  const headline = status.configured ? `${status.name} connected` : "No provider connected";
  const summary = status.configured
    ? status.mode === "live"
      ? "Live PAN verification is enabled. Remaining mandatory checks still require approved integrations."
      : "Sandbox PAN verification is enabled. Results are test data and cannot be used for a production approval."
    : "KYC decisions are manual-only. Reviewers must complete every identity, liveness and sanctions check outside this dashboard before approving.";

  return <main className="admin-kyc-shell">
    <header className="admin-kyc-top"><a href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><span>NEOCRAFT LLP · KYC OPERATIONS</span><div><small>Authorised reviewer</small><b>{user.email}</b><a href="/admin/kyc">Review queue</a></div></header>

    <section className="admin-kyc-heading"><div><span>VERIFICATION PROVIDER</span><h1>KYC provider status</h1><p>Sandbox currently automates PAN verification only. It never makes the acceptance decision on its own.</p></div><article><small>INTEGRATION</small><b>{status.configured ? `${status.variables.length}/${status.variables.length}` : `${status.variables.length - status.missing.length}/${status.variables.length}`}</b><span>required variables present</span></article></section>

    <section className="admin-provider-body">
      <div className={`admin-provider-banner ${tone}`}><i>{status.configured ? (status.mode === "live" ? "!" : "◎") : "◇"}</i><div><small>{status.configured ? (status.mode === "live" ? "LIVE MODE" : "SANDBOX MODE") : "NOT CONNECTED"}</small><b>{headline}</b><p>{summary}</p></div></div>

      <section className="admin-provider-section"><header><span>REQUIRED ENVIRONMENT VARIABLES</span><b>{status.missing.length ? `${status.missing.length} missing` : "All present"}</b></header><div className="admin-provider-vars">{status.variables.map((item) => <article key={item.key} className={item.present ? "present" : "missing"}><header><i>{item.present ? "✓" : "!"}</i><code>{item.key}</code>{item.secret ? <em>Secret</em> : null}</header><p>{item.text}</p><small>{item.present ? "Configured on this deployment" : "Not set on this deployment"}</small></article>)}</div><p className="admin-provider-note">Only presence is shown. Credential values are read inside the worker and are never returned to a browser.</p></section>

      <section className="admin-provider-section"><header><span>MANDATORY CHECK COVERAGE</span><b>2 of {providerChecks.length} integrated</b></header><div className="admin-provider-list">{providerChecks.map((item) => { const ready = status.configured && item.automated; return <article key={item.id} className={ready ? "ready" : ""}><i>{ready ? "✓" : "○"}</i><div><b>{item.label}</b><p>{item.text}</p></div><em>{ready ? (status.mode === "live" ? "Live" : "Sandbox") : "Pending"}</em></article>; })}</div></section>

      <section className="admin-provider-section"><header><span>ALWAYS MANUAL</span><b>Reviewer responsibility</b></header><div className="admin-provider-list">{manualChecks.map((item) => <article key={item.label}><i>◆</i><div><b>{item.label}</b><p>{item.text}</p></div><em>Human</em></article>)}</div></section>

      <div className="admin-privacy-note"><i>◇</i><p><b>Decision rule</b><small>A passing PAN result is only one checkpoint. Approval remains blocked until identity, address, liveness, sanctions and bank ownership are verified and recorded by an authorised reviewer.</small></p></div>

      <section className="admin-provider-section"><header><span>ACTIVATION SEQUENCE</span><b>Sandbox before live</b></header><div className="admin-provider-steps">{setupSteps.map((item) => <article key={item.step}><span>{item.step}</span><div><b>{item.title}</b><p>{item.text}</p></div></article>)}</div></section>

      <div className="admin-provider-actions"><a href="/admin/kyc">Back to review queue</a><a href="/compliance">Compliance readiness</a></div>
    </section>

    <footer className="admin-kyc-footer">Real-money trading stays disabled. Provider activation alone does not clear the compliance gates listed on the readiness page.</footer>
  </main>;
}
