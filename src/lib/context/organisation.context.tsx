"use client";

import { useAuthInfo } from "@propelauth/react";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";

interface OrganizationContextType {
  orgId: string;
  orgName: string;
  orgSettingData: any;
  setOrgId: (data: any) => void;
  setOrgName: (data: any) => void;
  setOrgSettingData: (data: any) => void;
}

const organizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { orgHelper } = useAuthInfo();

  const userPrimaryOrganization = orgHelper?.getOrgs()?.[0];
  //@ts-ignore
  // user?.properties?.metadata?.orgId || user?.metadata?.orgId || "";

  const [orgId, setOrgId] = useState<string>("");
  const [orgName, setOrgName] = useState<string>("");
  const [orgSettingData, setOrgSettingData] = useState<any>(null); //logo && color && type

  useEffect(() => {
    if (userPrimaryOrganization) {
      setOrgId(userPrimaryOrganization?.orgId || "");
      setOrgName(userPrimaryOrganization?.orgName || "");
      setOrgSettingData(userPrimaryOrganization?.orgMetadata);
    }
  }, [orgHelper, userPrimaryOrganization]);

  return (
    <organizationContext.Provider
      value={{
        orgId,

        orgName,
        orgSettingData,
        setOrgId,
        setOrgName,
        setOrgSettingData,
      }}
    >
      {children}
    </organizationContext.Provider>
  );
};

export const useOrganizationContext = () => {
  const context = useContext(organizationContext);
  if (context === undefined) {
    throw new Error("useOrganizationContext must be used within a OrgProvider");
  }
  return context;
};
