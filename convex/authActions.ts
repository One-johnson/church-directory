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
      // Migrate: verify with SHA-256 then upgrade to bcrypt
      const bcrypt = await import("bcrypt");
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
      const bcrypt = await import("bcrypt");
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
    const bcrypt = await import("bcrypt");
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
