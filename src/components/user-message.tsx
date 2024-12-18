"use client";

import { AI } from "@/lib/actions";
import { deleteUserAndLastAssistantMessage } from "@/lib/chat";
import { useChatContext } from "@/lib/context/agent.context";
import { useOrganizationContext } from "@/lib/context/organisation.context";
import { useAppState } from "@/lib/utils/app-state";
import { useAuthInfo } from "@propelauth/react";
import { generateId } from "ai";
import { useAIState, useActions, useUIState } from "ai/rsc";
import { Check, CircleUser, Pencil, X } from "lucide-react";
import { useState, KeyboardEvent, useEffect } from "react";

type UserMessageProps = {
  message?: string;
  chatId?: string;
  messageId?: string;
};

export const UserMessage: React.FC<UserMessageProps> = ({
  message,
  chatId,
  messageId,
}) => {
  const [editMessage, setEditMessage] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);

  const { isGenerating } = useAppState();
  const [aiState, _] = useAIState();
  const [, setMessages] = useUIState<typeof AI>();
  const { onSubmitMessage } = useActions();
  const { accessToken, user } = useAuthInfo();
  const { currentOrgType, company_url } = useChatContext();

  const { orgSettingData } = useOrganizationContext();

  const lastUserMessage = aiState?.messages
    ?.filter((m: any) => m.role === "user")
    .pop()?.content;
  const lastUserMessageId = aiState?.messages
    ?.filter((m: any) => m.role === "user")
    .pop()?.id;

  async function handleQuerySubmit(query: string, formData?: FormData) {
    const userMessageId = generateId();
    setMessages((currentMessages) => [
      ...currentMessages.slice(0, -2),
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
      accessToken,
      user,
      data,
      company_url || "",
      currentOrgType || "3pl",
      [],
      true
    );
    setMessages((currentMessages) => [...currentMessages, responseMessage]);
  }

  const handleSubmitAction = async () => {
    if (!editedMessage?.trim()) {
      return;
    }
    setEditMessage(false);
    const res = await deleteUserAndLastAssistantMessage(
      chatId!,
      `${lastUserMessage}`
    );
    if (res) {
      handleQuerySubmit(editedMessage!);
    }
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmitAction();
    }
  };

  return (
    <div className='flex justify-end gap-[10px] mb-4'>
      <div className='flex justify-start items-center gap-[10px] max-w-[90%] group'>
        {aiState.messages?.length > 0 && messageId === lastUserMessageId && (
          <>
            {!editMessage && !isGenerating && (
              <div
                onClick={() => setEditMessage(!editMessage)}
                className='rounded-full p-[5px] cursor-pointer invisible group-hover:visible'
              >
                <Pencil className='h-[16px] w-[16px]' />
              </div>
            )}
          </>
        )}
        <div
          className='flex bg-userMessageBgLight dark:bg-userMessageBgDark rounded-lg rounded-tl-[10px] rounded-tr-[0px] rounded-br-[10px] rounded-bl-[10px] py-[10px] px-[20px]'
          style={{
            border: editMessage
              ? `0.5px solid ${orgSettingData?.orgColor || "#6329d6"}`
              : "0.5px solid transparent",
            boxShadow: editMessage
              ? `0px 0px 4px 0px ${orgSettingData?.orgColor || "#6329d6"}`
              : "",
          }}
        >
          {aiState.messages?.length > 0 &&
          messageId === lastUserMessageId &&
          editMessage ? (
            <div className='flex justify-center items-center gap-[10px]'>
              <p
                contentEditable
                onInput={(e) =>
                  setEditedMessage(e.currentTarget.textContent || "")
                }
                onKeyDown={handleKeyDown}
                className={`border-none focus:outline-none font-poppins text-textPrimaryLight dark:text-textPrimaryDark text-[14px] font-light break-words break-all`}
              >
                {message}
              </p>
              <div className='flex justify-center items-center gap-[5px]'>
                <X
                  className='h-[16px] w-[16px] text-[#969696] cursor-pointer'
                  onClick={() => setEditMessage(false)}
                />
                <Check
                  className={`h-[16px] w-[16px]  ${
                    !editedMessage?.trim()
                      ? "cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  onClick={handleSubmitAction}
                />
              </div>
            </div>
          ) : (
            <p
              className={`font-poppins text-textPrimaryLight dark:text-textPrimaryDark text-[14px] font-light break-words`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
      <CircleUser className='h-[24px] w-[24px] text-gray-700 dark:text-white' />
    </div>
  );
};
