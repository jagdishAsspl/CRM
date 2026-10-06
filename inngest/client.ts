import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: process.env.INNGEST_ID || "nextcrm-app",
  name: process.env.INNGEST_APP_NAME || "NextCRM App",
  eventKey: process.env.INNGEST_EVENT_KEY || "local-dev-key",
  signingKey: process.env.INNGEST_SIGNING_KEY,
  isDev: process.env.NODE_ENV !== "production" || !process.env.INNGEST_EVENT_KEY,
});
