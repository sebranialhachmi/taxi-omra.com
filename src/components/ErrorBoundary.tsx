// App-level React error boundary. Sits inside providers so a render throw
// anywhere below <Outlet /> shows a friendly fallback instead of a white screen.
// TanStack's route-level errorComponent covers loader/route errors; this covers
// render/state errors inside components after the route has mounted.

import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

type Props = { children: ReactNode; fallback?: (reset: () => void, error: Error) => ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
    reportLovableError(error, { boundary: "app_error_boundary", componentStack: info.componentStack ?? undefined });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.reset, this.state.error);
      return (
        <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold">حدث خطأ / Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              نعتذر عن هذا الخطأ. يمكنك المحاولة مرة أخرى أو الرجوع للصفحة الرئيسية.
              <br />
              We're sorry. You can try again or return to the homepage.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                onClick={this.reset}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Try again
              </button>
              <a
                href="/"
                className="rounded-md border px-4 py-2 text-sm font-medium"
              >
                Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
