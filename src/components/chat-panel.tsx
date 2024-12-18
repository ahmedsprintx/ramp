import { useEffect, useRef, useState } from "react";
import type { AI } from "@/lib/actions";
import { useUIState, useActions } from "ai/rsc";
import { useAppState } from "@/lib/utils/app-state";
import { generateId } from "ai";

import Textarea from "react-textarea-autosize";
import { UserMessage } from "./user-message";
import { Spinner } from "./ui/spinner";
import { useAuthInfo } from "@propelauth/react";
import { useRouter } from "next/navigation";
import { useOrganizationContext } from "@/lib/context/organisation.context";
import { useChatContext } from "@/lib/context/agent.context";
import Image from "next/image";

interface ChatPanelProps {
  setOpenPromptModal?: (value: boolean) => void;
}

const ChatPanel = ({ setOpenPromptModal }: ChatPanelProps) => {
  const { accessToken, isLoggedIn, user } = useAuthInfo();
  const { currentOrgType, company_url } = useChatContext();

  const { orgSettingData } = useOrganizationContext();
  const [input, setInput] = useState("");
  const [, setMessages] = useUIState<typeof AI>();
  const { isGenerating, setIsGenerating } = useAppState();
  const { onSubmitMessage } = useActions();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  async function handleQuerySubmit(query: string, formData?: FormData) {
    setInput(query);
    setIsGenerating(true);
    const userMessageId = generateId();
    // Add user message to UI state
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: userMessageId,
        role: "user",
        content: query,
        component: <UserMessage message={query} messageId={userMessageId} />,
      },
    ]);

    // Submit and get response message
    const data = formData || new FormData();
    if (!formData) {
      data.append("input", query);
    }
    setInput("");
    const responseMessage = await onSubmitMessage(
      userMessageId,
      user,
      accessToken,
      data,
      company_url || "",
      currentOrgType || "3pl"
    );
    setMessages((currentMessages) => [...currentMessages, responseMessage]);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    isLoggedIn
      ? await handleQuerySubmit(input, formData)
      : router.push(`${process.env.NEXT_PUBLIC_LOGIN_URL}`);
  };

  useEffect(() => {
    // focus on input when the page loads
    inputRef.current?.focus();
  }, []);

  return (
    <div className='w-full relative'>
      <form
        onSubmit={handleSubmit}
        className='relative w-full flex justify-center items-center gap-[10px] mb-[10px]'
      >
        <Textarea
          ref={inputRef}
          name='input'
          rows={1}
          maxRows={5}
          tabIndex={0}
          placeholder='Ask a question...'
          spellCheck={false}
          value={input}
          className="w-full resize-none text-gray-800  min-h-[41px] max-h-36 rounded-[50px] bg-white border-0 border-input py-[10px] px-[20px] text-sm  file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50' scrollbar-hide pr-[40px]"
          onChange={(e) => {
            setInput(e.target.value);
          }}
          onKeyDown={(e) => {
            // Enter should submit the form
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing &&
              !isGenerating
            ) {
              // Prevent the default action to avoid adding a new line
              if (input.trim().length === 0) {
                e.preventDefault();
                return;
              }
              e.preventDefault();
              const textarea = e.target as HTMLTextAreaElement;
              textarea.form?.requestSubmit();
            }
          }}
          onHeightChange={(height) => {
            // Ensure inputRef.current is defined
            if (!inputRef.current) return;

            // The initial height and left padding is 70px and 2rem
            const initialHeight = 70;
            // The initial border radius is 32px
            const initialBorder = 32;
            // The height is incremented by multiples of 20px
            const multiple = (height - initialHeight) / 20;

            // Decrease the border radius by 4px for each 20px height increase
            const newBorder = initialBorder - 4 * multiple;
            // The lowest border radius will be 8px
            inputRef.current.style.borderRadius = Math.max(8, newBorder) + "px";
          }}
          // onFocus={() => setShowEmptyScreen(true)}
          // onBlur={() => setShowEmptyScreen(false)}
        />

        <Image
          src={"/assets/icons/promp-icon.svg"}
          alt=''
          height={100}
          width={100}
          onClick={() =>
            !isGenerating && setOpenPromptModal && setOpenPromptModal(true)
          }
          className='h-[24px] w-[24px] absolute right-[100px]'
          style={{ cursor: isGenerating ? "not-allowed" : "pointer" }}
        />

        <button
          type='submit'
          className={` font-poppins py-[10px] px-[20px]  text-white text-[14px] rounded-[90px] h-[40px] w-[76px] flex justify-center items-center ${
            input.length === 0 ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          style={{
            backgroundColor:
              input.length === 0 || isGenerating
                ? "rgb(156 163 175)"
                : orgSettingData?.orgColor || "rgb(99, 41, 214)",
          }}
          disabled={input.length === 0 || isGenerating}
        >
          {isGenerating ? <Spinner /> : "Send"}
        </button>
      </form>
      <p className='font-poppins text-center text-textPrimaryLight dark:text-textPrimaryDark font-light text-[12px] '>
        Powered by Heft IQ
      </p>
    </div>
  );
};

export default ChatPanel;
