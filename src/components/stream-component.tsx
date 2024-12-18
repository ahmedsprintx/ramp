"use client";

import { StreamableValue, useAIState, useStreamableValue } from "ai/rsc";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { BotMessage } from "./bot-message";
import { useAppState } from "@/lib/utils/app-state";
import { useChatContext } from "@/lib/context/agent.context";
import { usePathname, useRouter } from "next/navigation";

export type SearchSectionProps = {
  result?: StreamableValue<string>;
};

const StreamComponent = ({ result }: SearchSectionProps) => {
  const [data, error, pending] = useStreamableValue(result);
  const path = usePathname();
  const router = useRouter();

  const [content, setContent] = useState<string>("");
  const { setIsGenerating } = useAppState();
  const [aiState, setAIState] = useAIState();
  const { setNewChatData } = useChatContext();

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [userScrolled, setUserScrolled] = useState(false);

  const updateContent = useCallback((newContent: string, pending: boolean) => {
    setContent(newContent);
    setIsGenerating(pending);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!userScrolled && chatEndRef.current) {
      chatEndRef.current.scrollIntoView();
    }
  }, [userScrolled]);

  useEffect(() => {
    if (!data) return;
    updateContent(data, pending);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(scrollToBottom, 10);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [data, pending, updateContent, scrollToBottom]);

  const handleScroll = () => {
    const chatContainer = chatEndRef.current?.parentElement;
    if (chatContainer) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      setUserScrolled(scrollTop + clientHeight < scrollHeight - 10); // Allow a 10px tolerance
    }
  };

  useEffect(() => {
    const chatContainer = chatEndRef.current?.parentElement;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // Update URL if chat path changes
  useEffect(() => {
    if (
      !path?.includes("/chat/") &&
      aiState.chatId &&
      aiState.messages.length > 0 &&
      !pending
    ) {
      window.history.replaceState({}, "", `/chat/${aiState.chatId}`);
    }
  }, [aiState, pending, path, router]);

  return (
    <>
      <BotMessage content={content} />
      <div ref={chatEndRef} />
    </>
  );
};

export default StreamComponent;
