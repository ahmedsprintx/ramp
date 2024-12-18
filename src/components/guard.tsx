"use client";

import { useAuthInfo } from "@propelauth/react";
import { usePathname, useRouter } from "next/navigation";

const Guard = ({ ...props }) => {
  const { isLoggedIn, accessToken, loading } = useAuthInfo();
  const router = useRouter();
  const pathname = usePathname();

  const isSharedChatRoute = pathname?.includes('/share/');

  if (
    !isSharedChatRoute &&
    !isLoggedIn &&
    !accessToken &&
    process.env.NEXT_PUBLIC_LOGIN_URL &&
    !loading
  ) {
    router.push("/");
    return <></>;
  }
  return <></>;
};

export default Guard;
