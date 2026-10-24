import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, createRootRouteWithContext, useRouter, useRouterState, HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { localeFromPath, DEFAULT_LOCALE } from "@/lib/i18n";

import appCss from "../styles.css?url";
import { reportLovableError, installGlobalErrorHandlers } from "../lib/lovable-error-reporting";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { errorToMessage } from "@/lib/errors";
import { SITE } from "@/lib/site-info";
import { HeadInjector } from "@/components/HeadInjector";
import { getPublicHeadSettings } from "@/lib/head-settings.functions";
import { ContactInfoProvider } from "@/lib/contact-info";

/**
 * Server-rendered head tags coming from the admin "System settings" page.
 * These MUST be in the SSR HTML — Google Search Console cannot see tags that
 * are only injected client-side after hydration.
 */
function extraHeadMeta(settings: Record<string, string>) {
  const meta: Array<Record<string, string>> = [];
  const g = settings["google_site_verification"]?.trim();
  const b = settings["bing_site_verification"]?.trim();
  const contentOf = (raw: string) =>
    raw.includes("<") ? (raw.match(/content=["']([^"']+)["']/i)?.[1] ?? "") : raw;
  if (g) meta.push({ name: "google-site-verification", content: contentOf(g) });
  if (b) meta.push({ name: "msvalidate.01", content: contentOf(b) });

  const custom = settings["head_meta_custom"] ?? "";
  for (const tag of custom.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = tag.match(/\sname=["']([^"']+)["']/i)?.[1];
    const property = tag.match(/\sproperty=["']([^"']+)["']/i)?.[1];
    const content = tag.match(/\scontent=["']([^"']*)["']/i)?.[1] ?? "";
    if (name) meta.push({ name, content });
    else if (property) meta.push({ property, content });
  }
  return meta;
}


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">الصفحة غير موجودة / Page not found</p>
        <a href="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Home</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { console.error(error); reportLovableError(error, { boundary: "root" }); }, [error]);
  const friendly = errorToMessage(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">حدث خطأ / Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{friendly}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm font-medium">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    try {
      return { headSettings: await getPublicHeadSettings() };
    } catch {
      return { headSettings: {} as Record<string, string> };
    }
  },
  head: ({ loaderData, matches }) => {
    // Determine the title based on the route hierarchy: 
    // Child routes should have passed their titles up if possible, 
    // or we fall back to a safe site default.
    const lastMatch = matches[matches.length - 1];
    const routeTitle = (lastMatch?.meta as any)?.find((m: any) => m.title)?.title;
    
    // Fallback: If no page-specific title, provide a sensible default.
    const defaultTitle = `${SITE.brand.en} | ${SITE.brand.ar}`;
    const effectiveTitle = routeTitle || defaultTitle;

    return {
      meta: [
        ...extraHeadMeta(loaderData?.headSettings ?? {}),
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: effectiveTitle },
        { name: "theme-color", content: "#0d0d0d" },
        { property: "og:site_name", content: SITE.brand.en },
        { property: "og:title", content: effectiveTitle },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: effectiveTitle },
        { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/yTgJBA4SfjVCi3apFH5XARkLEQi1/social-images/social-1783936969962-Gemini_Generated_Image_9nz6uv9nz6uv9nz6-removebg-preview.webp" },
        { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/yTgJBA4SfjVCi3apFH5XARkLEQi1/social-images/social-1783936969962-Gemini_Generated_Image_9nz6uv9nz6uv9nz6-removebg-preview.webp" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
    };
  },

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // Resolve locale from the pathname so SSR emits the correct <html lang/dir>
  // for /ar/* vs /en/*. Falls back to the default when the prefix is absent.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const locale = localeFromPath(pathname) ?? DEFAULT_LOCALE;
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head><HeadContent /></head>
      <body className="hydrated">{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => { installGlobalErrorHandlers(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <HeadInjector />
            <ContactInfoProvider>
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </ContactInfoProvider>
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
