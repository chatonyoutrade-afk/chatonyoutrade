import type { Metadata } from "next";
import PublicInfoPage from "../public-info-page";

export const metadata: Metadata = { title: "ChatOnYou Help Center" };

export default function HelpPage() {
  return <PublicInfoPage eyebrow="HELP CENTER" title="Start safely." mutedTitle="Learn each flow." intro="Use the guided resources below to understand the paper terminal, AI decisions, bots, risk controls and account settings." primaryHref="/trade/guide" primaryLabel="Open interactive AI guide" secondaryHref="/support" secondaryLabel="Create support ticket" sections={[
    {number:"01",title:"Getting started",text:"Create an account, finish the paper setup and receive a virtual ₹10,000 balance. No real deposit is required.",items:["Account and setup","Language and region","Paper balance basics"]},
    {number:"02",title:"Trading and markets",text:"Learn how to review an asset, prepare a BUY or SELL order, set protection levels and confirm a simulated trade.",items:["Market screen","Order confirmation","History and portfolio"]},
    {number:"03",title:"AI and bots",text:"Understand BUY, SELL and NO TRADE decisions, then test rule-based paper bots and backtests without real funds."},
    {number:"04",title:"Safety tools",text:"Configure risk limits, pause automation or stop active paper flows immediately from Emergency Stop."},
  ]} />;
}
