import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads a set of head-related settings from the public.settings table
 * and injects them into <head> at runtime. This makes it possible for admins
 * to add Google Search Console verification, Google Analytics, and other
 * third-party tracking snippets without editing code.
 *
 * Settings keys read:
 *   - google_site_verification  (string, content for <meta name="google-site-verification">)
 *   - bing_site_verification    (string, content for <meta name="msvalidate.01">)
 *   - head_meta_custom          (string, raw HTML injected as-is into head, meta tags only)
 *   - head_scripts_custom       (string, raw HTML for <script>/analytics snippets)
 */
export function HeadInjector() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("key,value")
        .in("key", [
          "google_site_verification",
          "bing_site_verification",
          "head_meta_custom",
          "head_scripts_custom",
        ]);
      if (cancelled || !data) return;
      const map = new Map<string, string>();
      data.forEach((r: any) => {
        const v = typeof r.value === "string" ? r.value : (r.value?.value ?? "");
        if (v) map.set(r.key, String(v));
      });

      const injected: HTMLElement[] = [];

      const addMeta = (name: string, content: string) => {
        if (!content) return;
        // Already server-rendered by the root route head() — don't duplicate.
        if (document.head.querySelector(`meta[name="${name}"]`)) return;
        const el = document.createElement("meta");
        el.setAttribute("name", name);
        el.setAttribute("content", content.includes("<") ? (content.match(/content=["']([^"']+)["']/i)?.[1] ?? "") : content);
        el.setAttribute("data-injected", "settings");
        document.head.appendChild(el);
        injected.push(el);
      };

      addMeta("google-site-verification", map.get("google_site_verification") ?? "");
      addMeta("msvalidate.01", map.get("bing_site_verification") ?? "");

      const injectRaw = (raw: string) => {
        if (!raw) return;
        const wrap = document.createElement("div");
        wrap.innerHTML = raw;
        Array.from(wrap.childNodes).forEach((n) => {
          if (n.nodeType === 1) {
            const src = n as HTMLElement;
            // For <script>, must create fresh element for it to execute
            if (src.tagName === "SCRIPT") {
              const s = document.createElement("script");
              Array.from(src.attributes).forEach((a) => s.setAttribute(a.name, a.value));
              s.text = src.textContent ?? "";
              s.setAttribute("data-injected", "settings");
              document.head.appendChild(s);
              injected.push(s);
            } else {
              // Meta tags from head_meta_custom are already server-rendered.
              const mName = src.getAttribute("name");
              if (src.tagName === "META" && mName && document.head.querySelector(`meta[name="${mName}"]`)) return;
              src.setAttribute("data-injected", "settings");
              document.head.appendChild(src);
              injected.push(src);
            }
          }
        });
      };
      injectRaw(map.get("head_meta_custom") ?? "");
      injectRaw(map.get("head_scripts_custom") ?? "");
    })();

    return () => {
      cancelled = true;
      document.querySelectorAll('[data-injected="settings"]').forEach((el) => el.remove());
    };
  }, []);
  return null;
}
