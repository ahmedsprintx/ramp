"use client";

import { Poppins } from "next/font/google";
import { AppStateProvider } from "@/lib/utils/app-state";
import { AuthProvider } from "@propelauth/react";
import Guard from "@/components/guard";
import "./globals.css";
import Navbar from "@/components/navbar";
import Sidebar from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { ChatProvider } from "@/lib/context/agent.context";
import { OrganizationProvider } from "@/lib/context/organisation.context";
import { useEffect, useRef, useState } from "react";
import { useWindowSize } from "@/lib/hooks/use-window-size";
import { Providers } from "@/lib/context/theme-provider";
import React from "react";
// toastify
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Router } from "next/router";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

const poppins = Poppins({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { width } = useWindowSize();
  const isMobile = width <= 768;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleCloseSidebar = () => setIsSidebarOpen(false);

  const isSidebarCondition =
    pathname?.includes("/chat") && !pathname?.includes("/share");

  const isNavbarCondition = pathname?.includes("/chat");

  const handleClickOutside = (event: MouseEvent) => {
    if (
      sidebarRef.current &&
      !sidebarRef.current.contains(event.target as Node)
    ) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isSidebarOpen, isMobile]);

  useEffect(() => {
    posthog.init(`${process.env.NEXT_PUBLIC_POSTHOG_KEY}`, {
      api_host: `${process.env.NEXT_PUBLIC_POSTHOG_HOST}`,
      person_profiles: "identified_only",
      // Enable debug mode in development
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") posthog.debug();
      },
    });

    const handleRouteChange = () => posthog?.capture("$pageview");

    Router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      Router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, []);

  if (isMobile) {
    return (
      <div className='no-scrollbar bg-primaryLight dark:bg-primaryDark max-h-screen overflow-y-hidden'>
        <div
          className={`max-h-screen fixed inset-0 transition-opacity duration-300 ease-in-out z-40 ${
            isSidebarOpen ? "opacity-50" : "opacity-0 pointer-events-none"
          }`}
        />
        <div
          ref={sidebarRef}
          className={`w-[70vw] max-h-screen fixed top-0 left-0 h-full transition-transform duration-300 ease-in-out z-50 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar handleCloseSidebar={handleCloseSidebar} />
        </div>
        <div
          className={`transition-transform duration-300 ease-in-out h-screen ${
            isSidebarOpen ? "translate-x-[70%]" : "translate-x-0"
          }`}
        >
          {isNavbarCondition ? <Navbar toggleSidebar={toggleSidebar} /> : <></>}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex justify-start items-center w-full h-full ${
        isSidebarCondition ? "px-[20px]" : ""
      } gap-[20px]`}
    >
      <div
        className={`${
          isSidebarCondition ? "max-w-[264px] w-full block" : "w-0 hidden"
        }`}
      >
        <Sidebar handleCloseSidebar={handleCloseSidebar} />
      </div>
      <div
        className={`${
          isSidebarCondition ? "w-full" : "w-full p-0"
        } h-[100vh] overflow-scroll no-scrollbar ${
          isNavbarCondition ? "py-[20px]" : ""
        }`}
      >
        {isNavbarCondition ? <Navbar toggleSidebar={toggleSidebar} /> : <></>}
        {children}
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={`${poppins.variable} font-sans`}>
      <PostHogProvider client={posthog}>
        <body className='bg-primaryLight dark:bg-primaryDark h-screen relative overflow-y-hidden'>
          <AuthProvider
            authUrl={`${process.env.NEXT_PUBLIC_AUTH_URL}` || "UNDEFINED_KEY"}
          >
            <AppStateProvider>
              <ChatProvider>
                {/* This need to commecnted  */}
                <OrganizationProvider>
                  <Providers>
                    {/* <header>
                      <Guard />
                    </header> */}
                    <ClientLayout>{children}</ClientLayout>
                  </Providers>
                </OrganizationProvider>
              </ChatProvider>
            </AppStateProvider>
          </AuthProvider>
          <ToastContainer />
        </body>
      </PostHogProvider>
    </html>
  );
}
