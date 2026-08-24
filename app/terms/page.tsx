import type { Metadata } from "next";
import PublicInfoPage from "../public-info-page";

export const metadata: Metadata = { title: "ChatOnYou Trade Terms of Use" };

export default function TermsPage() {
  return <PublicInfoPage eyebrow="TERMS OF USE · 25 AUGUST 2026" title="Clear rules for" mutedTitle="a paper-trading product." intro="These terms explain the current product boundary. Use ChatOnYou Trade only for learning, testing and evaluating simulated strategies." primaryHref="/create-account" primaryLabel="Create paper account" sections={[
    {number:"01",title:"Paper use only",text:"The current product uses virtual balances and simulated orders. It does not hold customer money, provide custody or execute real-money trades."},
    {number:"02",title:"No financial advice",text:"AI signals, confidence scores, backtests and portfolio values are informational simulations—not personalized investment advice or guaranteed outcomes."},
    {number:"03",title:"Your responsibility",text:"You are responsible for reviewing every action, keeping account access secure and using the service lawfully."},
    {number:"04",title:"Acceptable use",text:"Do not misuse the service, attempt unauthorized access, disrupt availability, reverse engineer protected systems or use the product to violate applicable law."},
    {number:"05",title:"Availability and changes",text:"Features, market data and simulated results may change, be delayed or become unavailable. We may update the product and these terms as the service develops."},
    {number:"06",title:"Before any live service",text:"Real-money functionality would require separate eligibility, disclosures, controls, agreements and regulatory readiness. It remains disabled."},
  ]} notice="Product terms for ChatOnYou Trade, operated by NEOCRAFT LLP. Formal legal review is required before any live-money launch." />;
}
