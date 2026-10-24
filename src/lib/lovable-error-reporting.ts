// Persistent client error reporter. Writes to error_logs (RLS: anon INSERT allowed)
// AND forwards to the Lovable telemetry hook so both dashboards see it.
// Also installs global window handlers on first import.

import { supabase } from "@/integrations/supabase/client";

type LovableErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type LovableEvents = {
  captureException?: (error: unknown, context?: Record<string, unknown>, options?: LovableErrorOptions) => void;
};

declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
    __errorReporterInstalled?: boolean;
  }
}

async function persist(error: unknown, context: Record<string, unknown>, mechanism: string) {
  if (typeof window === "undefined") return;
  const err = error instanceof Error ? error : new Error(String(error));
  try {
    await supabase.from("error_logs").insert({
      level: "error",
      source: "client",
      message: err.message.slice(0, 500),
      stack: (err.stack ?? "").slice(0, 4000),
      url: window.location.href,
      metadata: { ...context, mechanism, ua: navigator.userAgent.slice(0, 200) },
    });
  } catch {
    // Never let logging crash the app.
  }
}

export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(error, { source: "react_error_boundary", route: window.location.pathname, ...context }, { mechanism: "react_error_boundary", handled: false, severity: "error" });
  void persist(error, context, "react_error_boundary");
}

export function installGlobalErrorHandlers() {
  if (typeof window === "undefined" || window.__errorReporterInstalled) return;
  window.__errorReporterInstalled = true;

  // Throttle user-facing toasts so a chatty rejection storm doesn't spam.
  let lastToastAt = 0;
  const notify = async (err: unknown) => {
    const now = Date.now();
    if (now - lastToastAt < 3000) return;
    lastToastAt = now;
    try {
      const [{ toast }, { errorToMessage }] = await Promise.all([
        import("sonner"),
        import("./errors"),
      ]);
      toast.error(errorToMessage(err));
    } catch {
      // Toast infra unavailable — swallow, we already persisted.
    }
  };

  window.addEventListener("error", (e) => {
    void persist(e.error ?? e.message, { filename: e.filename, lineno: e.lineno, colno: e.colno }, "onerror");
  });
  window.addEventListener("unhandledrejection", (e) => {
    void persist(e.reason, {}, "unhandledrejection");
    void notify(e.reason);
  });
}
