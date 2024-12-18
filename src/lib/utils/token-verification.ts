import { validateAccessToken } from "@propelauth/nextjs/server";
type user = {
  companyUrl?: string;
  userId?: string;
};

const tokenVerificationAndGettingUser = async (token?: string) => {
  let message = "";
  let user: user = {};

  try {
    if (!token) {
      // If the token is not present, respond with an error
      return {
        isError: true,
        message: "Token Not Found",
        user,
      };
    }

    const tokenValidation: any = await validateAccessToken(`Bearer ${token}`);

    user = tokenValidation?.properties?.metadata;

    return {
      isError: false,
      message,
      user,
    };
  } catch (error: any) {
    console.log("Error in Token Verification", error);
    return { hasError: true, message: error.message, user };
  }
};

export { tokenVerificationAndGettingUser };
