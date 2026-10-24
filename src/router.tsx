import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // SSR has already loaded public page data. Keeping it fresh briefly
        // prevents hydration from immediately repeating every server call and
        // replacing visible content when a transient request fails.
        staleTime: 60_000,
        gcTime: 300_000,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // Dehydrate the SSR query cache into the HTML so the browser (and Google's
  // renderer) reuses it instead of re-fetching every page's data after load.
  // Without this, a blocked/failed client refetch replaced the full page
  // with the error screen, which Google reported as Soft 404.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
