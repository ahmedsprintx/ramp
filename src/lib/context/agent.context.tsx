"use client";

import { useAuthInfo } from "@propelauth/react";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface ChatContextType {
  newChatData: any;
  setNewChatData: (data: any) => void;
  currentOrgType: string;
  setCurrentOrgType: (data: string) => void;
  company_url: string;
  setCompany_url: (data: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { orgHelper } = useAuthInfo();
  const userPrimaryOrganization = orgHelper?.getOrgIds()?.[0];
  const [newChatData, setNewChatData] = useState<any>(null);
  const [currentOrgType, setCurrentOrgType] = useState<string>("");
  const [company_url, setCompany_url] = useState<string>("");

  useEffect(() => {
    if (userPrimaryOrganization) {
      const currentOrg = orgHelper?.getOrg(userPrimaryOrganization);
      setCurrentOrgType(currentOrg?.orgMetadata?.type);
      setCompany_url(currentOrg?.orgMetadata?.companyUrl);
    }
  }, [orgHelper, userPrimaryOrganization]);

  return (
    <ChatContext.Provider
      value={{
        newChatData,
        setNewChatData,
        currentOrgType,
        setCurrentOrgType,
        company_url,
        setCompany_url,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
