"use client";

import React, { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { useUIState, useActions, useAIState } from "ai/rsc";
import { AI } from "@/lib/actions";
import { AIMessage } from "@/lib/types";
import { useAuthInfo } from "@propelauth/react";
import { useOrganizationContext } from "@/lib/context/organisation.context";
import Image from "next/image";
import { useAppState } from "@/lib/utils/app-state";
import { useChatContext } from "@/lib/context/agent.context";
import { generateId } from "ai";

type ErrorCardProps = {
  errorMessage: string;
};

export const ErrorCard: React.FC<ErrorCardProps> = ({ errorMessage }) => {
  const { user, accessToken } = useAuthInfo();
  const { currentOrgType, company_url } = useChatContext();

  const { orgSettingData } = useOrganizationContext();

  const [messages, setMessages] = useUIState<typeof AI>();
  const [aiState, setAIState] = useAIState<typeof AI>();
  const { onSubmitMessage } = useActions();

  const handleRetry = async () => {
    // Remove the last message from the UIState
    setMessages(messages.slice(0, -1));

    const aiMessages = aiState.messages;
    // Get the last message with role = user
    const lastUserMessage = [...aiMessages]
      .reverse()
      .find((m) => m.role === "user");

    let retryMessages: AIMessage[] = [];
    // Remove messages after lastUserMessage, cannot identify by id, so process by order
    if (lastUserMessage) {
      const lastUserMessageIndex = aiMessages.findIndex(
        (m) => m === lastUserMessage
      );
      retryMessages = aiMessages.slice(0, lastUserMessageIndex + 1);
    }
    // Request retry from the server and add the response to the current messages
    const response = await onSubmitMessage(
      generateId(),
      user,
      accessToken,
      undefined,
      company_url || "",
      currentOrgType || "3pl",
      retryMessages
    );
    setMessages((currentMessages) => [...currentMessages, response]);
  };

  return (
    <div className='flex items-center gap-4 mb-4'>
      <Image
        src={"/assets/icons/ai-circle.svg"}
        alt='menu'
        height={24}
        width={24}
        className='h-[24px] w-[24px]'
      />

      <div className='flex max-w-[90%] text-textPrimaryLight dark:text-textPrimaryDark rounded-lg  gap-3 overflow-scroll no-scrollbar'>
        <form
          className='flex items-center gap-3'
          onSubmit={(e) => {
            e.preventDefault();
            handleRetry();
          }}
        >
          <label className='text-red-600'>{errorMessage}</label>
          <button
            type='submit'
            className={`flex items-center px-3 py-1 text-sm font-medium text-white bg-[${
              orgSettingData?.orgColor || "#6329d6"
            }] rounded-md space-y-0`}
          >
            <RefreshCcw size={14} className='mr-1' />
            Retry
          </button>
        </form>
      </div>
    </div>
  );
};
