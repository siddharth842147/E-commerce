import { Inngest } from "inngest";

/**
 * Shared Inngest client for the Kartiva notification service.
 *
 * INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY are read from env automatically.
 * In local dev (Inngest dev server), set INNGEST_EVENT_KEY=any to skip signing.
 */
export const inngest = new Inngest({ id: "kartiva" });
