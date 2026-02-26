"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import type { FunctionReference } from "convex/server";
import { api, internal } from "./_generated/api";

/**
 * Login: verify password (bcrypt or legacy SHA-256), create session, return sessionId.
 * Client should store sessionId in a cookie and pass it to getCurrentUser / other functions.
 */
export const loginAction = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ sessionId: string }> => {
    const credentials = await ctx.runQuery(internal.auth.getCredentialsByEmail, {
      email: args.email,
    });

    if (!credentials) {
      // Check if pending
      const pending = await ctx.runQuery(internal.auth.getPendingUserByEmail, {
        email: args.email,
      });
      if (pending) {
        throw new Error(
          "Your account is pending approval. Please wait for confirmation email."
        );
      }
      throw new Error("Invalid email or password");
    }

    const { userId, passwordHash } = credentials;
    let valid = false;

    if (isLegacyHash(passwordHash)) {
      // Migrate: verify with SHA-256 then upgrade to bcrypt (bcryptjs = pure JS, works on Convex ARM64)
      const bcrypt = await import("bcryptjs");
      const inputSha = await sha256Hash(args.password);
      valid = inputSha === passwordHash;
      if (valid) {
        const newHash = await bcrypt.hash(args.password, 10);
        await ctx.runMutation(internal.auth.upgradePasswordHash, {
          userId,
          newPasswordHash: newHash,
        });
      }
    } else {
      const bcrypt = await import("bcryptjs");
      valid = await bcrypt.compare(args.password, passwordHash);
    }

    if (!valid) {
      throw new Error("Invalid email or password");
    }

    const sessionId = await ctx.runMutation(internal.auth.createSession, {
      userId,
    });
    return { sessionId };
  },
});

/**
 * Register with denomination: hash password with bcrypt, then call mutation.
 */
export const registerWithDenomination = action({
  args: {
    email: v.string(),
    phone: v.optional(v.string()),
    password: v.string(),
    name: v.string(),
    denomination: v.string(),
    denominationName: v.string(),
    branch: v.string(),
    branchName: v.string(),
    branchLocation: v.string(),
    pastor: v.string(),
    pastorEmail: v.string(),
  },
  handler: async (ctx, args): Promise<{ pendingUserId?: unknown; userId?: unknown; message: string }> => {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(args.password, 10);

    const registerMutation = api.auth.registerWithDenomination as FunctionReference<"mutation", "public">;
    const result = await ctx.runMutation(registerMutation, {
      email: args.email,
      phone: args.phone,
      passwordHash,
      name: args.name,
      denomination: args.denomination,
      denominationName: args.denominationName,
      branch: args.branch,
      branchName: args.branchName,
      branchLocation: args.branchLocation,
      pastor: args.pastor,
      pastorEmail: args.pastorEmail,
    });

    return result;
  },
});

/**
 * Request password reset: if email is registered, create token and send reset link.
 * Always returns the same message to avoid email enumeration.
 */
export const requestPasswordReset = action({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<{ message: string }> => {
    const user = await ctx.runQuery(internal.auth.getUserIdAndEmailByEmail, {
      email: args.email.trim().toLowerCase(),
    });

    const message =
      "If that email is registered, you'll receive a reset link shortly. Check your inbox and spam folder.";

    if (!user) return { message };

    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, (b) => b.toString(16).padStart(2, "0")).join("");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    await ctx.runMutation(internal.auth.createPasswordResetToken, {
      userId: user.userId,
      token,
      expiresAt,
    });

    const APP_URL =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://church-directory-ebon.vercel.app";
    const resetLink = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await ctx.runAction(api.emails.sendPasswordResetEmail, {
        recipientEmail: user.email,
        recipientName: user.name,
        resetLink,
      });
    } catch (e) {
      console.error("Failed to send password reset email:", e);
      // Don't reveal failure; user might retry
    }

    return { message };
  },
});

/**
 * Reset password using token from email link. Token is consumed (one-time use).
 */
export const resetPassword = action({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args): Promise<{ message: string }> => {
    const trimmedToken = args.token.trim();
    if (!trimmedToken) {
      throw new Error("Invalid or expired reset link. Please request a new one.");
    }
    if (args.newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const record = await ctx.runQuery(internal.auth.getPasswordResetToken, {
      token: trimmedToken,
    });
    if (!record || record.expiresAt < Date.now()) {
      throw new Error("Invalid or expired reset link. Please request a new one.");
    }

    const bcrypt = await import("bcryptjs");
    const newPasswordHash = await bcrypt.hash(args.newPassword, 10);

    await ctx.runMutation(internal.auth.setPasswordAndConsumeResetToken, {
      token: trimmedToken,
      newPasswordHash,
    });

    return { message: "Password updated. You can sign in with your new password." };
  },
});

// Helpers (must match auth.ts for legacy hash)
function isLegacyHash(hash: string): boolean {
  return !hash.startsWith("$2");
}

async function sha256Hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
