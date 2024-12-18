import Chat from "@/components/chat";
import { AI } from "@/lib/actions";
import { v4 as uuid } from "uuid";

export default function Home() {
  const id = uuid();

  return (
    <div className=''>
      <AI initialAIState={{ chatId: "", messages: [] }}>
        <Chat id={id} />
      </AI>
    </div>
  );
}
