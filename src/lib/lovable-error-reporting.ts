// Minimal client error reporting: logs to the console. (The old version wrote
// to a Supabase table and a Lovable telemetry hook, neither of which exist now.)
export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[client error]", error, context);
}

export function installGlobalErrorHandlers() {
  if (typeof window === "undefined" || (window as any).__errorReporterInstalled) return;
  (window as any).__errorReporterInstalled = true;
  window.addEventListener("error", (e) => reportLovableError(e.error ?? e.message, { mechanism: "onerror" }));
  window.addEventListener("unhandledrejection", (e) => reportLovableError(e.reason, { mechanism: "unhandledrejection" }));
}
