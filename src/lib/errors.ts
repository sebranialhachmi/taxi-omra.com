// Shared error-handling utilities.
// Translate raw Supabase/Postgres/Zod/network errors into bilingual, user-safe
// messages, and wrap mutations with a consistent toast + logging pipeline.

import { toast } from "sonner";
import { ZodError } from "zod";

type Locale = "ar" | "en";

export type FriendlyMessage = { en: string; ar: string };

const GENERIC: FriendlyMessage = {
  en: "Something went wrong. Please try again.",
  ar: "حدث خطأ ما. حاول مرة أخرى.",
};

// Map well-known Postgres SQLSTATE codes / PostgREST errors to friendly copy.
const CODE_MAP: Record<string, FriendlyMessage> = {
  "23505": { en: "This record already exists.", ar: "هذا السجل موجود بالفعل." },
  "23503": { en: "Related record is missing or in use.", ar: "السجل المرتبط مفقود أو قيد الاستخدام." },
  "23502": { en: "A required field is missing.", ar: "حقل مطلوب مفقود." },
  "23514": { en: "Value doesn't meet the required rules.", ar: "القيمة لا تستوفي الشروط المطلوبة." },
  "22001": { en: "Value is too long.", ar: "القيمة طويلة جدًا." },
  "22P02": { en: "Invalid value format.", ar: "تنسيق القيمة غير صالح." },
  "42501": { en: "You don't have permission to do that.", ar: "ليست لديك صلاحية لهذا الإجراء." },
  "42P01": { en: "Resource not available.", ar: "المورد غير متاح." },
  "PGRST116": { en: "Record not found.", ar: "السجل غير موجود." },
  "PGRST301": { en: "Session expired. Please sign in again.", ar: "انتهت الجلسة. يُرجى تسجيل الدخول مرة أخرى." },
};

const AUTH_MAP: Record<string, FriendlyMessage> = {
  "invalid_credentials": { en: "Wrong email or password.", ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة." },
  "email_not_confirmed": { en: "Please confirm your email first.", ar: "يُرجى تأكيد بريدك الإلكتروني أولاً." },
  "user_already_exists": { en: "An account with this email already exists.", ar: "يوجد حساب بهذا البريد الإلكتروني بالفعل." },
  "over_email_send_rate_limit": { en: "Too many attempts. Try again in a few minutes.", ar: "محاولات كثيرة. حاول بعد قليل." },
  "weak_password": { en: "Password is too weak.", ar: "كلمة المرور ضعيفة." },
};

function pick(msg: FriendlyMessage, locale: Locale) {
  return locale === "ar" ? msg.ar : msg.en;
}

/** Translate any error-ish value into a friendly, user-facing string. */
export function errorToMessage(err: unknown, locale: Locale = "en"): string {
  if (!err) return pick(GENERIC, locale);

  if (err instanceof ZodError) {
    const first = err.issues[0];
    return first?.message ?? pick(GENERIC, locale);
  }

  const e = err as any;

  // Supabase PostgREST / Postgres error
  if (typeof e.code === "string" && CODE_MAP[e.code]) return pick(CODE_MAP[e.code], locale);

  // Supabase Auth error
  if (typeof e.code === "string" && AUTH_MAP[e.code]) return pick(AUTH_MAP[e.code], locale);
  if (typeof e.error_code === "string" && AUTH_MAP[e.error_code]) return pick(AUTH_MAP[e.error_code], locale);

  // Network / offline
  if (e.name === "TypeError" && /fetch|network/i.test(String(e.message))) {
    return locale === "ar"
      ? "تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى."
      : "Can't reach the server. Check your connection and try again.";
  }

  if (e.name === "AbortError") {
    return locale === "ar" ? "تم إلغاء الطلب." : "Request was cancelled.";
  }

  // Status-code hints from thrown Response-like errors
  const status = e.status ?? e.statusCode;
  if (status === 401 || status === 403) {
    return locale === "ar" ? "ليست لديك صلاحية لهذا الإجراء." : "You don't have permission to do that.";
  }
  if (status === 404) return locale === "ar" ? "غير موجود." : "Not found.";
  if (status === 429) return locale === "ar" ? "محاولات كثيرة. حاول لاحقًا." : "Too many attempts. Please try again later.";
  if (typeof status === "number" && status >= 500) {
    return locale === "ar" ? "الخدمة غير متاحة مؤقتًا." : "Service temporarily unavailable.";
  }

  // Prefer .message when it looks human-friendly (short, no SQL noise)
  const raw = typeof e.message === "string" ? e.message : typeof err === "string" ? err : "";
  const looksTechnical = /\b(select|insert|update|delete|from|where|violates|constraint|relation|schema|jwt|rls)\b/i.test(raw);
  if (raw && !looksTechnical && raw.length < 200) return raw;

  return pick(GENERIC, locale);
}

/**
 * Run an async operation with unified error toasts and console logging.
 * Returns `{ data }` on success or `{ error }` on failure — never throws.
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  opts: {
    locale?: Locale;
    successMessage?: string;
    errorPrefix?: string;
    silent?: boolean;
    onError?: (err: unknown) => void;
  } = {},
): Promise<{ data?: T; error?: unknown }> {
  try {
    const data = await fn();
    if (opts.successMessage) toast.success(opts.successMessage);
    return { data };
  } catch (err) {
    console.error(err);
    opts.onError?.(err);
    if (!opts.silent) {
      const msg = errorToMessage(err, opts.locale ?? "en");
      toast.error(opts.errorPrefix ? `${opts.errorPrefix}: ${msg}` : msg);
    }
    return { error: err };
  }
}

/**
 * Convenience wrapper around a Supabase query builder result
 * `{ data, error }` — surfaces the error via toast and returns null on failure.
 */
export async function safeQuery<T>(
  promise: PromiseLike<{ data: T | null; error: unknown | null }>,
  opts: { locale?: Locale; errorPrefix?: string; silent?: boolean } = {},
): Promise<T | null> {
  try {
    const { data, error } = await promise;
    if (error) {
      console.error(error);
      if (!opts.silent) {
        const msg = errorToMessage(error, opts.locale ?? "en");
        toast.error(opts.errorPrefix ? `${opts.errorPrefix}: ${msg}` : msg);
      }
      return null;
    }
    return data;
  } catch (err) {
    console.error(err);
    if (!opts.silent) {
      const msg = errorToMessage(err, opts.locale ?? "en");
      toast.error(opts.errorPrefix ? `${opts.errorPrefix}: ${msg}` : msg);
    }
    return null;
  }
}
