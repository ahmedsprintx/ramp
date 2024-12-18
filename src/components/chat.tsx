"use client";

import { useActions, useUIState } from "ai/rsc";
import { usePathname } from "next/navigation";
import ChatPanel from "./chat-panel";
import ChatMessages from "./chat-messages";
import "../app/globals.css";
import { useEffect, useState, useRef } from "react";
import { useAuthInfo } from "@propelauth/react";
import { useWindowSize } from "@/lib/hooks/use-window-size";
import { useOrganizationContext } from "@/lib/context/organisation.context";
import { useChatContext } from "@/lib/context/agent.context";
import { useAIState } from "ai/rsc";
import PromptBoxes from "./ui/prompt-box";
import PromptModal from "./ui/prompt-modal";
import { AI } from "@/lib/actions";
import { generateId } from "ai";
import { UserMessage } from "./user-message";
import { ArrowDown } from "lucide-react";
import React from "react";

type ChatProps = {
  id?: string;
  query?: string;
  isShared?: boolean;
  orgType?: string;
};

const Chat = ({ id, query, isShared, orgType }: ChatProps) => {
  const { user, loading, accessToken } = useAuthInfo();
  const { orgSettingData, orgId } = useOrganizationContext();
  const path = usePathname();
  const [openPromptModal, setOpenPromptModal] = useState<boolean>(false);
  const [showGoDownButton, setShowGoDownButton] = useState(false);

  const { currentOrgType, setCurrentOrgType, company_url } = useChatContext();

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [messages, ...rest] = useUIState();
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const [aiState, setAIState] = useAIState();
  const { setNewChatData } = useChatContext();
  const [, setMessages] = useUIState<typeof AI>();
  const { onSubmitMessage } = useActions();

  useEffect(() => {
    if (messages.length === 0) {
      setAIState({
        messages: [],
        chatId: "",
        isSharePage: false,
        orgType: orgType ? orgType : currentOrgType,
      });
    }
  }, [currentOrgType, setAIState, messages, orgType, path, setCurrentOrgType]);

  useEffect(() => {
    if (
      !window.location.pathname?.includes("/chat/") &&
      aiState.chatId &&
      aiState.messages.length === 2
    ) {
      setNewChatData(aiState.chatId);
    }
  }, [aiState, setNewChatData]);

  const scrollToBottom = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (container) {
      const atBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 100;
      setShowGoDownButton(!atBottom);
    }
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [user, messages]);

  // New effect to auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleQuerySubmit(query: string, formData?: FormData) {
    const userMessageId = generateId();
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: userMessageId,
        role: "user",
        content: query,
        component: <UserMessage message={query} messageId={userMessageId} />,
      },
    ]);

    const data = formData || new FormData();
    if (!formData) {
      data.append("input", query);
    }
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

  const handleClick = async (prompt: string) => {
    await handleQuerySubmit(prompt);
    setOpenPromptModal(false);
  };

  const isSyncInProgress = false;

  return (
    <main className='relative w-full min-h-full overflow-hidden flex items-center justify-center bg-primaryLight dark:bg-primaryDark'>
      {loading ? (
        ""
      ) : (
        <>
          {user || path?.includes("/chat/share") ? (
            <section
              className='flex-1 relative w-full max-w-[900px]'
              style={{ height: isMobile ? "calc(100vh - 55px)" : "" }}
            >
              <section
                ref={chatContainerRef}
                style={{
                  height: `calc(100vh - ${
                    isSyncInProgress ? "188px" : "108px"
                  })`,
                }}
                className='overflow-y-auto px-4 pb-20 pt-8 stylish-scrollbar no-scrollbar'
              >
                {messages.length === 0 ? (
                  <PromptBoxes />
                ) : (
                  <ChatMessages messages={messages} />
                )}
              </section>

              <section className='bg-primaryLight dark:bg-primaryDark absolute bottom-0 w-full p-4 pt-0 backdrop-blur-sm'>
                {!isShared && (
                  <div className='flex items-center'>
                    <ChatPanel setOpenPromptModal={setOpenPromptModal} />
                  </div>
                )}
              </section>
            </section>
          ) : (
            <div className='flex items-center justify-center h-[90vh] w-full'>
              <div
                className={`w-8 h-8 border-4 border-t-4 border-gray-200  rounded-full animate-spin`}
                style={{
                  borderTopColor: orgSettingData?.orgColor || "#6329D6",
                }}
              ></div>
            </div>
          )}
        </>
      )}

      {showGoDownButton && (
        <div
          className='bg-black dark:bg-white p-2 text-center absolute bottom-24 cursor-pointer rounded-full'
          onClick={scrollToBottom}
        >
          <ArrowDown className='text-white dark:text-black h-[18px] w-[18px]' />
        </div>
      )}

      <PromptModal
        isOpen={openPromptModal}
        onClose={() => setOpenPromptModal(false)}
        onClick={handleClick}
        orgType={"3pl"}
      />
    </main>
  );
};

export default Chat;
