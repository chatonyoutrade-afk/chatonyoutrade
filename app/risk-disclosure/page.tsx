import type { Metadata } from "next";
import PublicInfoPage from "../public-info-page";

export const metadata: Metadata = { title: "ChatOnYou Trade Risk Disclosure" };

export default function RiskDisclosurePage() {
  return <PublicInfoPage eyebrow="RISK DISCLOSURE · PAPER MODE" title="Understand the risk." mutedTitle="Never trust a promise." intro="Crypto markets and automated systems carry significant risk. Simulated results can help you learn, but they cannot predict live outcomes." primaryHref="/trade/settings" primaryLabel="Review risk settings" secondaryHref="/trade/emergency-stop" secondaryLabel="Open Emergency Stop" sections={[
    {number:"01",title:"Market risk",text:"Crypto assets can move sharply, lose substantial value and trade differently across venues. Losses in live markets can be rapid."},
    {number:"02",title:"Model risk",text:"AI decisions can be incomplete, incorrect or late. A confidence score is not certainty and NO TRADE does not remove all risk."},
    {number:"03",title:"Simulation limits",text:"Paper trading and backtests may not reproduce live liquidity, slippage, fees, spread, partial fills, outages or emotional decision-making."},
    {number:"04",title:"Technology and data risk",text:"Market feeds, APIs, networks, exchanges and software can fail or provide delayed, missing or inaccurate information."},
    {number:"05",title:"Automation risk",text:"A bot can repeat a poor rule faster than a person. Use strict limits, monitor activity and keep Emergency Stop available."},
    {number:"06",title:"No guaranteed returns",text:"Nothing on this website promises profit or future performance. Never trade money you cannot afford to lose."},
  ]} />;
}
