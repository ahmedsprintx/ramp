import Chat from "@/components/chat";
import { AI } from "@/lib/actions";
import { getChat } from "@/lib/chat";
import { redirect } from "next/navigation";
export default async function ChatHistory({
  params,
}: {
  params: { id: string };
}) {
  if (params.id === "new") redirect("/chat");
  const chat = await getChat(params.id);

  return (
    <div className=''>
      <AI
        initialAIState={{
          chatId: `${chat?.id}`,
          messages: [...(chat?.messages || [])],
        }}
      >
        <Chat id={params?.id} orgType={chat?.orgType || "3pl"} />
      </AI>
    </div>
  );
}
