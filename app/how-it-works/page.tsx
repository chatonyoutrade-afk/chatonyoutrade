import type { Metadata } from "next";
import PublicInfoPage from "../public-info-page";

export const metadata: Metadata = { title: "How ChatOnYou Trade Works" };

export default function HowItWorksPage() {
  return <PublicInfoPage eyebrow="HOW IT WORKS" title="From market data" mutedTitle="to a controlled decision." intro="The product turns live market context into an explainable paper-trading workflow. You can review, test and stop every simulated action." primaryHref="/create-account" primaryLabel="Create paper account" secondaryHref="/trade/guide" secondaryLabel="Open detailed guide" sections={[
    {number:"01",title:"Read the market",text:"Prices, candles, momentum, volume and other public market inputs provide the context for analysis."},
    {number:"02",title:"Create an AI decision",text:"The decision engine returns BUY, SELL or NO TRADE with a confidence score and plain-language reasoning."},
    {number:"03",title:"Apply risk rules",text:"Position size, stop-loss, daily loss and open-position limits are checked before a simulated order can continue."},
    {number:"04",title:"Review or automate",text:"In assisted mode, you confirm the prepared order. Paper bots can act only inside the limits you configure."},
    {number:"05",title:"Record the result",text:"Virtual orders, decisions and safety events are recorded so performance can be reviewed later."},
    {number:"06",title:"Stay in control",text:"Pause automation, use Emergency Stop or reset the paper account whenever you need a clean restart."},
  ]} />;
}
