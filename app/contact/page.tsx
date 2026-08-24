import type { Metadata } from "next";
import PublicInfoPage from "../public-info-page";

export const metadata: Metadata = { title: "Contact ChatOnYou Trade" };

export default function ContactPage() {
  return <PublicInfoPage eyebrow="CONTACT US" title="Tell us what" mutedTitle="you need help with." intro="For product questions, account help, safety concerns or business enquiries, contact the ChatOnYou Trade support team." primaryHref="/support" primaryLabel="Create support ticket" secondaryHref="mailto:support@chatonyou.com" secondaryLabel="Email support" sections={[
    {number:"01",title:"Product support",text:"Get help with sign-in, setup, paper orders, AI decisions, bots, backtests and portfolio analytics."},
    {number:"02",title:"Safety and compliance",text:"Report a security concern or ask about privacy, risk controls and the product-readiness roadmap."},
    {number:"03",title:"Business enquiries",text:"Use the same support address for partnership, press or company enquiries. Include a clear subject so it reaches the right team."},
    {number:"04",title:"Protect your account",text:"Support will never ask for your password, OTP, recovery phrase, private key or withdrawal approval."},
  ]} />;
}
