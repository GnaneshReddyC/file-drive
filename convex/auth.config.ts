import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://simple-ray-59.clerk.accounts.dev",
      applicationID: "convex",
    },
  ]
} satisfies AuthConfig;