import { initBaseAuth } from "@propelauth/node";

const propelauth = initBaseAuth({
  authUrl: `${process.env.NEXT_PUBLIC_AUTH_URL}` || "UNDEFIEND URL",
  apiKey: `${process.env.PROPELAUTH_API_KEY}` || "UNDEFIEND API KEY",
  manualTokenVerificationMetadata: {
    verifierKey: `${process.env.PROPELAUTH_VERIFIER_KEY} || "PROPELAUTH_VERIFIER_KEY`,
    issuer:
      `${process.env.PROPELAUTH_VERIFIER_ISSUER}` ||
      "UNDEFINED VERIFIER ISSUER",
  },
});

export { propelauth };
