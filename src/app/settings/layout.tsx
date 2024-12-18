"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useAuthInfo } from "@propelauth/react";
import { useOrganizationContext } from "@/lib/context/organisation.context";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<>loading....</>}>
      <OriginalLayout>{children}</OriginalLayout>
    </Suspense>
  );
}

const OriginalLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const router = useRouter();
  const { isLoggedIn, accessToken } = useAuthInfo();
  const { orgSettingData } = useOrganizationContext();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Define sidebar items
  const defaultSidebarItems = [
    {
      name: "General Settings",
      link: "Settings",
    },
    {
      name: "User Management",
      link: "Management",
    },
    // {
    //   name: "Integrations",
    //   link: "Integrations",
    // },
  ];

  // Determine sidebar items based on organization type
  const sidebarItems = defaultSidebarItems;

  // Check if the current search param matches the sidebar item's search param
  const tab = useMemo(() => {
    return searchParams ? searchParams.get("tab") || "" : "";
  }, [searchParams]);

  const currentPage =
    sidebarItems.find((item) => item.link === tab)?.name || "";

  useEffect(() => {
    if (
      isLoggedIn !== undefined &&
      !isLoggedIn &&
      accessToken !== undefined &&
      !accessToken
    ) {
      router.push("/");
    }
  }, [accessToken, isLoggedIn, router]);

  return (
    <div className='relative flex h-screen text-black dark:text-textPrimaryDark'>
      <div className='absolute top-4 left-4 flex items-center w-full md:w-auto z-20'>
        <button
          className='md:hidden'
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-6 w-6'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M4 6h16M4 12h16M4 18h16'
            />
          </svg>
        </button>

        {/* Current Page Name */}
        {currentPage && (
          <span className='text-[16px] flex-grow ml-[11rem] text-center sm:block md:hidden'>
            {currentPage}
          </span>
        )}
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-[999] top-0 left-0 h-screen w-64 bg-white dark:bg-primaryDark p-4 border-r-[0.5px] border-[#ffffff50] transition-transform duration-300 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className='mb-6 flex items-center gap-2'>
          <button onClick={() => router.push("/chat")}>
            {/* Back Icon */}
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>
          <span className='text-lg font-semibold'>Settings</span>
        </div>

        {/* Sidebar Content */}
        <ul>
          {sidebarItems?.map((x) => {
            return (
              <li
                onClick={() => {
                  router.push(`?tab=${x.link}`);
                  setSidebarOpen(false); // Close sidebar after navigation on mobile
                }}
                key={x.name}
                className={`text-sm px-4 py-3 cursor-pointer ${
                  tab === x.link && "bg-[#e5e5e5] dark:bg-[#202020] rounded-md"
                }`}
              >
                {x.name}
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Background Overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-[99] bg-black opacity-50 md:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className='flex-1 h-screen bg-white dark:bg-primaryDark p-6 shadow-lg overflow-x-hidden'>
        {children}
      </main>
    </div>
  );
};
