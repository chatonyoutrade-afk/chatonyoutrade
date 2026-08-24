import type { Metadata } from "next";
import PublicInfoPage from "../public-info-page";

export const metadata: Metadata = { title: "ChatOnYou Trade Privacy Policy" };

export default function PrivacyPage() {
  return <PublicInfoPage eyebrow="PRIVACY POLICY · 25 AUGUST 2026" title="Privacy should be" mutedTitle="easy to understand." intro="This notice explains the information needed to run your paper account, protect the product and improve the experience." primaryHref="/contact" primaryLabel="Ask a privacy question" sections={[
    {number:"01",title:"Information used",text:"Account identity, language and setup choices may be used together with paper balances, risk settings, simulated orders, bot configurations and audit events."},
    {number:"02",title:"Why it is used",text:"Information supports sign-in, product functionality, safety checks, support, abuse prevention and service improvement."},
    {number:"03",title:"Market and testnet data",text:"Public market requests do not need exchange credentials. Optional testnet connections should use test-only credentials and never a real withdrawal key."},
    {number:"04",title:"Sharing and service providers",text:"Information may be processed by infrastructure, authentication and support providers only as needed to operate and secure the service, or when required by law."},
    {number:"05",title:"Retention and protection",text:"We aim to retain product information only as needed for the stated purposes and protect it with appropriate technical and organisational controls."},
    {number:"06",title:"Your choices",text:"You can ask about your information, request correction or raise a deletion concern by contacting support, subject to applicable requirements."},
  ]} notice="Privacy notice for ChatOnYou Trade, operated by NEOCRAFT LLP. This page will be updated as production systems and legal requirements are finalised." />;
}
