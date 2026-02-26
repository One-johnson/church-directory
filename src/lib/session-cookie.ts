/**
 * Session cookie helpers (client-side).
 * Session ID is stored in a cookie so the client can send it to Convex (no localStorage).
 */

const SESSION_COOKIE_NAME = "convex_session";
const MAX_AGE_DAYS = 30;

export function setSessionCookie(sessionId: string): void {
  if (typeof document === "undefined") return;
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function getSessionCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.split("=")[1] ?? "");
  } catch {
    return null;
  }
}

export function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0`;
}
