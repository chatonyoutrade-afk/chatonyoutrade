import { requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function TradeLayout({children}:{children:React.ReactNode}){
 await requireChatGPTUser("/trade");
 return children;
}
