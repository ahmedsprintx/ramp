import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        xs: "375px",
        xss: "320px",
        sm: "425px",
      },
      fontFamily: {
        poppins: ["var(--font-poppins)", ...fontFamily.sans],
        sans: ["var(--font-poppins)", ...fontFamily.sans],
      },
      boxShadow: {
        "custom-white": "0px 0px 4px 0px rgba(255, 255, 255, 0.20)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      backgroundSize: {
        "500%": "500% 100%",
      },
      animation: {
        fadeInSlideDown: "fadeInSlideDown 0.5s ease-out",
        fadeOutSlideUp: "fadeOutSlideUp 0.5s  forwards",
        shine: "shine 2s linear infinite",
      },
      keyframes: {
        fadeInSlideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeOutSlideUp: {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-10px)" },
        },
        shine: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
      },
      colors: {
        primaryLight: "#f0f0f0", // Light
        primaryDark: "#141414", // Dark

        sidebarBackgroundDark: "rgba(255, 255, 255, 0.02)", // Dark
        sidebarBackgroundLight: "#fff", //Light

        chatHistoryTextDark: "#969696", // Dark
        chatHistoryTextLight: "#515151", // Light

        sidebarOptionTextColorDark: "#fff", // Dark
        sidebarOptionTextColorLight: "#000", // Light

        selectedOptionColorDark: "#ffffff1b", // Dark
        selectedOptionColorLght: "#EFEFEF", // Light

        userMessageBgDark: "#ffffff1A", // Dark
        userMessageBgLight: "#fff", // Light

        primaryRed: "#F00",

        textPrimaryDark: "#fff", // Dark
        textPrimaryLight: "#000", //Light
      },
    },
  },
  plugins: [],
};

export default config;
