/**
 * Maps backend/Convex error messages to user-friendly messages for the UI.
 * Prevents raw Convex/technical errors from being shown to users.
 */

const AUTH_MESSAGES: Record<string, string> = {
  "User with this email already exists": "An account with this email already exists. Try signing in or use a different email.",
  "Registration already pending approval for this email": "This email is already awaiting approval. Check your inbox or contact your administrator.",
  "Your account is pending approval. Please wait for confirmation email.": "Your account is still pending approval. You’ll receive an email when it’s approved.",
  "Invalid email or password": "Invalid email or password. Please check and try again.",
  "Please use the enhanced registration form with denomination and branch selection": "Please use the registration form and select your denomination and branch.",
  "Unauthorized: Invalid or expired session": "Your session has expired. Please sign in again.",
  "Unauthorized: Admin access required": "You don’t have permission to do that.",
};

const PROFILE_MESSAGES: Record<string, string> = {
  "Profile already exists for this user": "You already have a profile. Use Edit Profile to update it.",
  "Profile not found": "Profile could not be found. Please refresh and try again.",
  "Unauthorized: Admin access required": "You don’t have permission to do that.",
};

const GENERIC_FALLBACKS: Record<string, string> = {
  register: "Registration didn’t work. Please check your details and try again.",
  login: "We couldn’t sign you in. Please check your email and password.",
  profile: "Something went wrong. Please try again.",
  admin: "Something went wrong. Please try again.",
  default: "Something went wrong. Please try again.",
};

function getMessage(error: unknown, context: keyof typeof GENERIC_FALLBACKS = "default"): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const all = { ...AUTH_MESSAGES, ...PROFILE_MESSAGES };
  if (all[raw]) return all[raw];
  // Don't expose Convex/technical errors
  const lower = raw.toLowerCase();
  if (
    lower.includes("argumentvalidationerror") ||
    lower.includes("convex") ||
    lower.includes("validator") ||
    lower.includes("required field")
  ) {
    return GENERIC_FALLBACKS[context] ?? GENERIC_FALLBACKS.default;
  }
  return GENERIC_FALLBACKS[context] ?? GENERIC_FALLBACKS.default;
}

/** User-friendly message for auth flows (login, register). */
export function getAuthErrorMessage(error: unknown): string {
  return getMessage(error, "login");
}

/** User-friendly message for registration only (slightly different fallback). */
export function getRegisterErrorMessage(error: unknown): string {
  return getMessage(error, "register");
}

/** User-friendly message for profile create/update. */
export function getProfileErrorMessage(error: unknown): string {
  return getMessage(error, "profile");
}

/** User-friendly message for admin actions. */
export function getAdminErrorMessage(error: unknown): string {
  return getMessage(error, "admin");
}

/** Generic user-friendly message. */
export function getFriendlyErrorMessage(error: unknown): string {
  return getMessage(error, "default");
}
