"use client";

import { useAuthInfo } from "@propelauth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const Home = () => {
  const router = useRouter();
  const { isLoggedIn } = useAuthInfo();

  useEffect(() => {
    isLoggedIn === true
      ? router.push("/chat")
      : isLoggedIn === false
      ? router.push(`${process.env.NEXT_PUBLIC_LOGIN_URL}`)
      : "";
  }, [isLoggedIn, router]);
  return <></>;
};

export default Home;
