import Chat from "@/components/chat";
import { AI } from "@/lib/actions";
import { getSharedChat } from "@/lib/chat";


export default async function SharedChat({ params }: { params: { id: string } }) {

  const chat = await getSharedChat(params.id)

  if (!chat) {
    return (
      <div className="flex justify-center items-center h-[90vh] text-textPrimaryLight dark:text-textPrimaryDark">
        This chat is not shared yet!
      </div>
    )
  }
  return (
    <AI initialAIState={{ chatId: `${chat?.id}`, messages: [...chat?.messages || []], isSharePage: true }}>
      <Chat id={params?.id} isShared={true} />
    </AI>
  );
}
