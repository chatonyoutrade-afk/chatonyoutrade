import type { Metadata } from "next";
import PublicInfoPage from "../public-info-page";

export const metadata: Metadata = { title: "About ChatOnYou Trade" };

export default function AboutPage() {
  return <PublicInfoPage eyebrow="ABOUT CHATONYOU" title="AI clarity for traders." mutedTitle="Control stays human." intro="ChatOnYou Trade is a learning-first crypto paper-trading workspace built to make market signals, risk and automated decisions easier to understand." primaryHref="/trade" primaryLabel="Explore the product" secondaryHref="/how-it-works" secondaryLabel="See how it works" sections={[
    {number:"01",title:"Our purpose",text:"Turn complex market information into clear, reviewable decisions—without presenting confidence scores as certainty.",items:["Explain every AI decision","Keep paper mode as the default","Make risk visible before action"]},
    {number:"02",title:"Who operates the product",text:"ChatOnYou Trade is a product operated by NEOCRAFT LLP. The current experience is designed for simulation, education and product testing."},
    {number:"03",title:"What we are building",text:"A calm workspace where people can study markets, test strategies, configure risk limits and review performance before considering any live integration."},
    {number:"04",title:"Our boundary",text:"We do not promise returns. The current website does not hold customer funds, provide custody or execute real-money trades."},
  ]} />;
}
