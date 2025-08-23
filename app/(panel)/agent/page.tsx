import { requireAuth } from "../utils/auth";
import { listChats, createChat, getChat } from "./actions";
import Client from "./Client";

export default async function AgentPage() {
    await requireAuth();

    const chats = await listChats();
    const current = chats.length > 0 ? await getChat(chats[0].id) : await createChat("New Chat");

    return (
        <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]">
            <div className="flex-1 overflow-hidden p-2 md:p-4">
                <div className="h-full min-h-0 w-full rounded-lg border border-white/10 bg-gray-800/50 backdrop-blur flex flex-col">
                    <div className="p-3 md:p-4 flex-none">
                        <h1 className="text-xl md:text-2xl font-bold text-gray-100">Agent</h1>
                    </div>
                    <div className="flex-1 min-h-0 px-3 md:px-4 pb-3 md:pb-4">
                        {current && (
                            <Client initialChat={current} initialChats={chats} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}