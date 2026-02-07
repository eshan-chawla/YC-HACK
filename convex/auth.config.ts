import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Set CLERK_JWT_ISSUER_DOMAIN in the Convex dashboard env vars.
      // Development format: https://verb-noun-00.clerk.accounts.dev
      // Production format:  https://clerk.<your-domain>.com
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
