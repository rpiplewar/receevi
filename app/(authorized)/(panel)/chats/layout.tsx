import { FEUser } from "@/types/user";
import { createClient } from "@/utils/supabase-server";
import { AgantContextProvider } from "./AgentContext";
import ChatContactsClient from "./ChatContactsClient";
import { ContactContextProvider } from "./CurrentContactContext";
import ChatsLayoutClient from "./ChatsLayoutClient";

export default async function ChatsLayout({ children }: {
    children: React.ReactNode;
}) {
    const supabase = createClient();

    const { data: allAgentsId } = await supabase.from('user_roles').select('user_id').eq('role', 'agent')
    const agentUserIds = allAgentsId?.map((ag) => ag.user_id)
    let agents: FEUser[] = []
    if (agentUserIds) {
        const { data: agentsFromDB } = await supabase.from('profiles').select('*').in('id', agentUserIds)
        agents = agentsFromDB?.map(ag => {
            return {
                id: ag.id,
                email: ag.email,
                firstName: ag.first_name,
                lastName: ag.last_name,
                role: 'agent'
            }
        }) || []
    }

    return (
        <ContactContextProvider>
            <AgantContextProvider agents={agents}>
                {/* p-0 on mobile (edge-to-edge), p-4 on desktop */}
                <div className="p-0 md:p-4 h-full">
                    <div className="shadow-none md:shadow-lg md:rounded-xl bg-white flex h-full overflow-hidden">
                        {/* Contact list — ChatsLayoutClient handles mobile show/hide */}
                        <ChatsLayoutClient>
                            <ChatContactsClient />
                        </ChatsLayoutClient>
                        {/* Chat window — always visible, fills remaining space */}
                        <div className="flex-grow min-w-0">
                            {children}
                        </div>
                    </div>
                </div>
            </AgantContextProvider>
        </ContactContextProvider>
    )
}
