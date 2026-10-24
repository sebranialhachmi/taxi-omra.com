import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Security headers applied to every HTML/text response. Kept permissive enough
// to preserve current functionality (Google Fonts, Supabase, WhatsApp, images).
const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(self), camera=(), microphone=(), payment=()",
};

function applySecurityHeaders(response: Response): Response {
  // Never mutate opaque/streamed responses' bodies — just append headers.
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// URLs containing literal template braces (e.g. a schema.org SearchAction
// urlTemplate accidentally crawled) can bounce between encoded/decoded forms
// and produce a redirect loop. Serve a clean 404 instead.
function isMalformedTemplateUrl(request: Request): boolean {
  const { pathname, search } = new URL(request.url);
  // Internal RPC / API calls legitimately carry JSON payloads (encoded braces)
  // in the query string — never treat those as malformed crawler URLs.
  if (/^\/(_serverFn|api|_build|@|node_modules)(\/|$)/.test(pathname)) return false;
  const raw = pathname + search;
  return raw.includes("{") || raw.includes("}") || /%7[bd]/i.test(raw);
}

// Canonical host: force apex + https so www/http duplicates collapse into one
// indexable URL instead of competing versions in search results.
const CANONICAL_HOST = "omrataxi-sa.online";

const EDGE_LEGACY_REDIRECTS: Record<string, string> = {
  "/jeddah-airport-to-makkah-taxi": "/jeddah-to-makkah-taxi",
  "/makkah-to-jeddah-taxi": "/routes/makkah-to-jeddah",
  "/jeddah-to-madinah-taxi": "/routes/jeddah-to-madinah",
  "/madinah-to-jeddah-taxi": "/routes/madinah-to-jeddah",
  "/services/jeddah-airport-to-makkah": "/jeddah-to-makkah-taxi",
  "/services/makkah-to-madinah": "/makkah-to-madinah-taxi",
  "/services/jeddah-to-makkah": "/jeddah-to-makkah-taxi",
  "/city/makkah": "/taxi-makkah",
  "/city/jeddah": "/taxi-jeddah",
  "/city/madinah": "/taxi-madinah",
  "/city/taif": "/taxi-taif",
  "/city/riyadh": "/taxi-riyadh",
  "/city/dammam": "/taxi-dammam",
};

function canonicalHostRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  const host = (request.headers.get("host") ?? url.host).toLowerCase();
  const bareHost = host.replace(/^www\./, "");
  if (bareHost !== CANONICAL_HOST) return null;

  const proto = (request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "")).toLowerCase();
  if (host === CANONICAL_HOST && proto === "https") return null;

  // Root goes straight to the default-locale homepage (avoid a 2-hop chain).
  const path = url.pathname === "/" ? "/ar" : url.pathname;
  const target = `https://${CANONICAL_HOST}${path}${url.search}`;
  return new Response(null, { status: 301, headers: { Location: target } });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Internal router layout ids ("/_public/...") were never real pages.
      // Serve 410 Gone so crawlers drop them instead of following redirects.
      if (/^\/_public(\/|$)/.test(new URL(request.url).pathname)) {
        return applySecurityHeaders(
          new Response("Gone", {
            status: 410,
            headers: { "content-type": "text/plain; charset=utf-8" },
          }),
        );
      }

      const hostRedirect = canonicalHostRedirect(request);
      if (hostRedirect) return applySecurityHeaders(hostRedirect);

      // Old crawled URLs with no matching page: the router never runs the
      // layout redirect for unmatched paths, so map them here in one 301 hop.
      {
        const u = new URL(request.url);
        const m = u.pathname.replace(/\/+$/, "").match(/^(?:\/(ar|en))?(\/.+)$/);
        const target = m ? EDGE_LEGACY_REDIRECTS[m[2]] : undefined;
        if (target) {
          return applySecurityHeaders(
            new Response(null, { status: 301, headers: { Location: `/${m![1] ?? "ar"}${target}` } }),
          );
        }
      }


      if (isMalformedTemplateUrl(request)) {
        return applySecurityHeaders(
          new Response("Not Found", {
            status: 404,
            headers: { "content-type": "text/plain; charset=utf-8" },
          }),
        );
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);

      // A stale/unknown server-function id (typically after a deploy or HMR
      // reload) makes the router throw "forgot to return a response". Answer
      // the RPC with a clean 404 instead of an HTML 500 that blanks the page.
      if (
        response.status >= 500 &&
        new URL(request.url).pathname.startsWith("/_serverFn")
      ) {
        return applySecurityHeaders(
          new Response(JSON.stringify({ error: "Server function not found" }), {
            status: 404,
            headers: { "content-type": "application/json" },
          }),
        );
      }

      return applySecurityHeaders(await normalizeCatastrophicSsrResponse(response));


    } catch (error) {
      console.error(error);
      return applySecurityHeaders(new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      }));
    }
  },
};

