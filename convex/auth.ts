import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getUserIdFromSession, getUserIdFromSessionOrThrow } from "./session";

// Legacy: SHA-256 for verifying old hashes during migration (do not use for new passwords)
async function sha256Hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate secure approval token
function generateApprovalToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Generate secure session ID
function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Internal: get user credentials for login (used by login action only) */
export const getCredentialsByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!user) return null;
    return { userId: user._id, passwordHash: user.passwordHash };
  },
});

/** Internal: check if email is in pending (used by login action only) */
export const getPendingUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("pendingUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return pending !== null;
  },
});

/** Internal: create a session for the user (used by login action only) */
export const createSession = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessionId = generateSessionId();
    const now = Date.now();
    await ctx.db.insert("sessions", {
      userId: args.userId,
      sessionId,
      expiresAt: now + SESSION_DURATION_MS,
      createdAt: now,
    });
    return sessionId;
  },
});

/** Internal: upgrade legacy SHA-256 hash to bcrypt after first login */
export const upgradePasswordHash = internalMutation({
  args: { userId: v.id("users"), newPasswordHash: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { passwordHash: args.newPasswordHash });
  },
});

/** Internal: get approved user by email (for password reset only) */
export const getUserIdAndEmailByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!user) return null;
    return { userId: user._id, email: user.email, name: user.name };
  },
});

/** Internal: create a password reset token */
export const createPasswordResetToken = internalMutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("passwordResetTokens", {
      userId: args.userId,
      token: args.token,
      expiresAt: args.expiresAt,
      createdAt: now,
    });
  },
});

/** Internal: get password reset token record (for validation) */
export const getPasswordResetToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!record) return null;
    return { userId: record.userId, expiresAt: record.expiresAt, _id: record._id };
  },
});

/** Internal: set new password and delete reset token (one-time use) */
export const setPasswordAndConsumeResetToken = internalMutation({
  args: { token: v.string(), newPasswordHash: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!record) throw new Error("Invalid or expired reset link. Please request a new one.");
    if (record.expiresAt < Date.now()) {
      await ctx.db.delete(record._id);
      throw new Error("Invalid or expired reset link. Please request a new one.");
    }
    await ctx.db.patch(record.userId, { passwordHash: args.newPasswordHash });
    await ctx.db.delete(record._id);
  },
});

// Register a new user (legacy - for backward compatibility)
export const register = mutation({
  args: {
    email: v.string(),
    phone: v.optional(v.string()),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    throw new Error("Please use the enhanced registration form with denomination and branch selection");
  },
});

// Register with denomination and branch (password must be hashed by caller - use authActions.registerWithDenomination)
export const registerWithDenomination = mutation({
  args: {
    email: v.string(),
    phone: v.optional(v.string()),
    passwordHash: v.string(),
    name: v.string(),
    denomination: v.string(),
    denominationName: v.string(),
    branch: v.string(),
    branchName: v.string(),
    branchLocation: v.string(),
    pastor: v.string(),
    pastorEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists in users table
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Check if user already exists in pending users
    const existingPending = await ctx.db
      .query("pendingUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingPending) {
      throw new Error("Registration already pending approval for this email");
    }

    const passwordHash = args.passwordHash;

    // Check if this is the first user (auto-admin and auto-approved)
    const userCount = await ctx.db.query("users").collect();
    const isFirstUser = userCount.length === 0;

    if (isFirstUser) {
      // First user: Add directly to users table as admin
      const userId = await ctx.db.insert("users", {
        email: args.email,
        phone: args.phone,
        passwordHash,
        name: args.name,
        role: "admin",
        emailVerified: true,
        createdAt: Date.now(),
        denomination: args.denomination,
        denominationName: args.denominationName,
        branch: args.branch,
        branchName: args.branchName,
        branchLocation: args.branchLocation,
        pastor: args.pastor,
        pastorEmail: args.pastorEmail,
        accountApprovedBy: "system",
        accountApprovedAt: Date.now(),
      });

      console.log(`🎉 First user registered with admin privileges: ${args.email}`);
      return { userId, message: "Registration successful - First admin account created" };
    }

    // Generate approval token for pastor email link
    const approvalToken = generateApprovalToken();

    // Add to pendingUsers table (not users table)
    const pendingUserId = await ctx.db.insert("pendingUsers", {
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
      approvalToken,
      createdAt: Date.now(),
    });

    // Send email to pastor for approval
    try {
      await ctx.scheduler.runAfter(0, "emails:sendRegistrationEmail" as any, {
        pastorEmail: args.pastorEmail,
        pastorName: args.pastor,
        userName: args.name,
        userEmail: args.email,
        userPhone: args.phone,
        denominationName: args.denominationName,
        branchName: args.branchName,
        branchLocation: args.branchLocation,
        approvalToken, // Include token for pastor approval link
      });
    } catch (error) {
      console.error("Failed to send registration email to pastor:", error);
      // Don't fail registration if email fails
    }

    // Send email to all admins for notification
    try {
      const admins = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();

      for (const admin of admins) {
        await ctx.scheduler.runAfter(0, "emails:sendAdminRegistrationNotificationEmail" as any, {
          adminEmail: admin.email,
          adminName: admin.name,
          userName: args.name,
          userEmail: args.email,
          userPhone: args.phone,
          denominationName: args.denominationName,
          branchName: args.branchName,
          branchLocation: args.branchLocation,
          pastorName: args.pastor,
        });
      }
    } catch (error) {
      console.error("Failed to send registration email to admins:", error);
      // Don't fail registration if email fails
    }

    return { 
      pendingUserId, 
      message: "Registration submitted for approval. You'll receive an email once your account is approved." 
    };
  },
});

// Get current user by session (preferred) or legacy userId (for backward compatibility with cached clients)
export const getCurrentUser = query({
  args: {
    sessionId: v.optional(v.union(v.string(), v.null())),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let userId: Id<"users"> | null = null;
    if (args.sessionId) {
      userId = await getUserIdFromSession(ctx, args.sessionId);
    }
    if (userId === null && args.userId) {
      userId = args.userId;
    }
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    return {
      _id: user._id,
      userId: user._id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      denomination: user.denomination,
      denominationName: user.denominationName,
      branch: user.branch,
      branchName: user.branchName,
      branchLocation: user.branchLocation,
      pastor: user.pastor,
      pastorEmail: user.pastorEmail,
      accountApprovedBy: user.accountApprovedBy,
      accountApprovedAt: user.accountApprovedAt,
    };
  },
});

// Logout: invalidate session (call with current sessionId)
export const logout = mutation({
  args: { sessionId: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    if (!args.sessionId) return;
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId as string))
      .first();
    if (session) await ctx.db.delete(session._id);
  },
});

// Update user role (Admin only)
export const updateUserRole = mutation({
  args: {
    sessionId: v.union(v.string(), v.null()),
    targetUserId: v.id("users"),
    newRole: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSessionOrThrow(ctx, args.sessionId);
    const requester = await ctx.db.get(userId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    await ctx.db.patch(args.targetUserId, {
      role: args.newRole,
    });

    return { message: "User role updated successfully" };
  },
});
