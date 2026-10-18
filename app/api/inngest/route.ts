import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { functions } from "@/lib/inngest/functions";

/**
 * Inngest webhook endpoint.
 *
 * This route is public — Inngest calls it to execute background functions.
 * It handles GET (SDK UI / introspection), POST (event execution), and PUT
 * (deployment sync). No auth is required; Inngest verifies the signing key
 * internally in production.
 *
 * In local development, run `npx inngest-cli@latest dev` to start the Inngest
 * dev server and point it at this route.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
