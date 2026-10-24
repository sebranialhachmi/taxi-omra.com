// Admin authentication: scrypt password hashes, random session tokens stored
// hashed in MySQL, and an HttpOnly cookie. There is exactly one kind of user.
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getCookie, setCookie, deleteCookie, getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { one, insert, exec } from "./db.server";

const COOKIE = "admin_session";
const SESSION_DAYS = 14;

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(password, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---- login throttling (per IP, in memory: fine for a single Node process) ----
const attempts = new Map<string, { n: number; first: number }>();
const WINDOW_MS = 10 * 60_000;
const MAX_ATTEMPTS = 8;

function clientKey(): string {
  return getRequestIP({ xForwardedFor: true }) ?? getRequestHeader("user-agent") ?? "unknown";
}

export function assertLoginAllowed() {
  const k = clientKey();
  const a = attempts.get(k);
  if (a && Date.now() - a.first > WINDOW_MS) attempts.delete(k);
  if ((attempts.get(k)?.n ?? 0) >= MAX_ATTEMPTS) throw new Error("Too many attempts. Try again in a few minutes.");
}

export function noteLoginFailure() {
  const k = clientKey();
  const a = attempts.get(k);
  attempts.set(k, a && Date.now() - a.first <= WINDOW_MS ? { n: a.n + 1, first: a.first } : { n: 1, first: Date.now() });
}

export function clearLoginFailures() {
  attempts.delete(clientKey());
}

export async function startSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await insert("sessions", { token_hash: sha(token), user_id: userId, expires_at: expires });
  setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const token = getCookie(COOKIE);
  if (token) await exec("DELETE FROM `sessions` WHERE `token_hash` = ?", [sha(token)]);
  deleteCookie(COOKIE, { path: "/" });
}

/** The logged-in admin, or null. */
export async function currentAdmin(): Promise<{ id: number; email: string } | null> {
  const token = getCookie(COOKIE);
  if (!token) return null;
  const s = await one("sessions", { token_hash: sha(token) });
  if (!s || new Date(s.expires_at).getTime() < Date.now()) return null;
  const u = await one("admin_users", { id: s.user_id });
  return u ? { id: u.id, email: u.email } : null;
}

export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) throw new Error("Not authorized");
  return admin;
}
