import type { Metadata } from "next";
import PublicInfoPage from "../public-info-page";

export const metadata: Metadata = { title: "Create a ChatOnYou Paper Account" };

export default function CreateAccountPage() {
  return <PublicInfoPage eyebrow="CREATE ACCOUNT" title="Your paper account" mutedTitle="starts with control." intro="Create your account, complete KYC, choose your risk settings and practise the complete trading flow using virtual funds." primaryHref="/login?view=signup" primaryLabel="Create your account" secondaryHref="/login" secondaryLabel="Sign in instead" sections={[
    {number:"01",title:"Create your account",text:"Register with your email address and a password of at least 10 characters. Your password is stored only as a salted PBKDF2 hash."},
    {number:"02",title:"Complete KYC",text:"Provide identity and address evidence, then track the verification status before account setup."},
    {number:"03",title:"Configure paper account",text:"Choose your language, AI mode, markets and risk limits, then receive ₹10,000 in virtual funds."},
    {number:"04",title:"Explore safely",text:"Review markets, test AI decisions, build paper bots, backtest ideas and change safety controls without depositing money."},
  ]} />;
}
