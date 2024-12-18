"use client";
import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useOrganizationContext } from "@/lib/context/organisation.context";
import SettingsComponent from "@/components/settings/index";
import UserManagementComponent from "@/components/user-management/index";

interface ComponentListItem {
  name: string;
  link: string;
  component: React.ReactNode;
}

const MainSettings: React.FC = () => {
  const { orgSettingData } = useOrganizationContext();
  const searchParams = useSearchParams();

  // Define component lists with both link and name
  const brandsComponentLists: ComponentListItem[] = [
    {
      name: "General Settings",
      link: "Settings",
      component: <SettingsComponent />,
    },
    {
      name: "User Management",
      link: "Management",
      component: <UserManagementComponent />,
    },
  ];

  // const threePlComponentList: ComponentListItem[] = [
  //   {
  //     name: "General Settings",
  //     link: "Settings",
  //     component: <SettingsComponent />,
  //   },
  //   {
  //     name: "User Management",
  //     link: "Management",
  //     component: <UserManagementComponent />,
  //   },
  //   {
  //     name: "Data Sync",
  //     link: "Integrations",
  //     component: <IntegrationsComponent />,
  //   },
  //   {
  //     name: "Brands",
  //     link: "Brands",
  //     component: <Brands />,
  //   },
  // ];

  // Determine component list based on organization type
  const componentLists = brandsComponentLists;

  // Memoize the current tab
  const tab = useMemo(() => {
    return searchParams?.get("tab") || "";
  }, [searchParams]);

  // Find the matched component using the link
  const MatchedComponent = useMemo(() => {
    return componentLists.find(
      (item) => item.link.toLowerCase() === tab.toLowerCase()
    )?.component;
  }, [tab, componentLists]);

  // Render the matched component or first component as fallback
  return MatchedComponent ? (
    <>{MatchedComponent}</>
  ) : componentLists.length > 0 ? (
    <>{componentLists[0].component}</>
  ) : (
    <div>No matching component found</div>
  );
};

export default MainSettings;
