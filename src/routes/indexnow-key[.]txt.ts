// IndexNow ownership proof: the key is also sent as `keyLocation` with every ping.
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/indexnow-key.txt")({
  server: {
    handlers: {
      GET: async () => {
        const { getSettings } = await import("@/server/db.server");
        const key = (await getSettings(["indexnow_key"])).indexnow_key;
        if (typeof key !== "string" || !key) return new Response("Not found", { status: 404 });
        return new Response(key, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
      },
    },
  },
});
