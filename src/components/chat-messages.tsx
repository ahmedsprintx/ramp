import { CircleUser, Bot } from "lucide-react";
import React, { Fragment } from "react";

type ChatMessagesProps = {
  messages: Array<{
    role: string;
    content: string;
    component: React.ReactNode;
  }>;
};

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  return (
    <>
      {messages.map((message, index) => {
        return <Fragment key={index}>{message.component}</Fragment>;
      })}
    </>
  );
};

export default ChatMessages;
