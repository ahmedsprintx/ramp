import React, { useEffect, useState } from "react";
import { useAuthInfo } from "@propelauth/react";
import { useRouter } from "next/navigation";
import { useOrganizationContext } from "@/lib/context/organisation.context";
import { Menu, Settings } from "lucide-react";
import Image from "next/image";
import ThemeSwitch from "./ui/theme-switch";

import { usePostHogEvents } from "@/lib/hooks/usePostHogEvents";

const Navbar: React.FC<any> = ({ toggleSidebar }) => {
  const { user, isLoggedIn, userClass } = useAuthInfo();
  const { orgId, orgName, orgSettingData } = useOrganizationContext();
  const router = useRouter();
  const { captureEvent } = usePostHogEvents(`${user?.email}`);
  const onClickSetting = () => {
    captureEvent("clicked_on_setting_icon", {});
    router.push("/settings?tab=Settings");
  };

  return (
    <nav
      className={`bg-primaryLight dark:bg-primaryDark p-4 text-textPrimaryLight dark:text-textPrimaryDark ${
        isLoggedIn ? "block" : "hidden"
      }`}
    >
      <div className='container mx-auto flex justify-between items-center'>
        <div className=' font-poppins text-[16px] hidden md:flex'>
          {orgName}
        </div>
        <div
          className='h-[24px] w-[24px] block md:hidden'
          onClick={() => toggleSidebar()}
        >
          <Menu className='text-black dark:text-white h-[24px] w-[24px]' />
        </div>

        <div className='font-poppins text-[16px] flex md:hidden'></div>

        <div className='flex justify-center items-center gap-4'>
          <div className='hidden md:flex items-center space-x-4'>
            {isLoggedIn ? (
              <div className='flex justify-center items-center gap-[10px]'>
                {userClass?.orgIdToUserOrgInfo &&
                (userClass?.orgIdToUserOrgInfo[orgId]?.userAssignedRole ===
                  "Owner" ||
                  userClass?.orgIdToUserOrgInfo[orgId]?.userAssignedRole ===
                    "Admin") ? (
                  <Settings
                    onClick={onClickSetting}
                    className='text-black dark:text-white -[24px] w-[24px] cursor-pointer'
                  />
                ) : (
                  ""
                )}
                <ThemeSwitch />
              </div>
            ) : (
              <>
                <ThemeSwitch />
              </>
            )}
          </div>

          <div
            className='p-[10px] rounded-[38px] flex justify-center items-center md:hidden cursor-pointer'
            onClick={() => router.push("/chat")}
            style={{
              background: orgSettingData?.orgColor
                ? `${orgSettingData?.orgColor}`
                : "#6329D6",
            }}
          >
            <Image
              src={"/assets/icons/plusicon.svg"}
              alt='menu'
              height={16}
              width={16}
              className='h-[16px] w-[16px] cursor-pointer'
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
