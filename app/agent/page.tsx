import { requireAuth } from "../utils/auth";
import { listChats, createChat, getChat } from "./actions";
import Client from "./Client";

export default async function AgentPage() {
    await requireAuth();

    const chats = await listChats();
    const current = chats.length > 0 ? await getChat(chats[0].id) : await createChat("New Chat");

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Agent</h1>
            {current && (
                <Client initialChat={current} initialChats={chats} />
            )}
        </div>
    );
}