/**
 * User Account Approval System
 * 
 * Handles approval/rejection of newly registered users before they can create profiles
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Get all pending user approvals
 */
export const getPendingApprovals = query({
  args: {},
  handler: async (ctx) => {
    const pendingUsers = await ctx.db
      .query("pendingUsers")
      .collect();

    return pendingUsers.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      denomination: user.denomination,
      denominationName: user.denominationName,
      branch: user.branch,
      branchName: user.branchName,
      branchLocation: user.branchLocation,
      pastor: user.pastor,
      pastorEmail: user.pastorEmail,
      createdAt: user.createdAt,
      rejectionReason: user.rejectionReason,
    }));
  },
});

/**
 * Get account approval statistics
 */
export const getApprovalStats = query({
  args: {},
  handler: async (ctx) => {
    const pendingUsers = await ctx.db.query("pendingUsers").collect();
    const allUsers = await ctx.db.query("users").collect();
    
    const pending = pendingUsers.filter((u) => !u.rejectionReason).length;
    const approved = allUsers.length;
    const rejected = pendingUsers.filter((u) => u.rejectionReason).length;

    return {
      total: pending + approved,
      pending,
      approved,
      rejected,
    };
  },
});

/**
 * Approve a user account (Admin or Pastor)
 * Moves user from pendingUsers to users table
 */
export const approveUserAccount = mutation({
  args: {
    pendingUserId: v.id("pendingUsers"),
    approverId: v.optional(v.id("users")), // Optional for pastor approvals
    approverType: v.union(v.literal("admin"), v.literal("pastor")),
  },
  handler: async (ctx, args) => {
    const { pendingUserId, approverId, approverType } = args;

    // Verify admin if approverType is admin
    if (approverType === "admin") {
      if (!approverId) {
        throw new Error("Approver ID required for admin approvals");
      }
      const approver = await ctx.db.get(approverId);
      if (!approver || approver.role !== "admin") {
        throw new Error("Only admins can approve accounts");
      }
    }

    // Get pending user
    const pendingUser = await ctx.db.get(pendingUserId);
    if (!pendingUser) {
      throw new Error("Pending user not found");
    }

    // Check if user already exists in users table
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", pendingUser.email))
      .first();

    if (existingUser) {
      throw new Error("User already exists in the system");
    }

    // Move user from pendingUsers to users table
    const userId = await ctx.db.insert("users", {
      email: pendingUser.email,
      phone: pendingUser.phone,
      passwordHash: pendingUser.passwordHash,
      name: pendingUser.name,
      role: "member",
      emailVerified: true,
      createdAt: Date.now(),
      denomination: pendingUser.denomination,
      denominationName: pendingUser.denominationName,
      branch: pendingUser.branch,
      branchName: pendingUser.branchName,
      branchLocation: pendingUser.branchLocation,
      pastor: pendingUser.pastor,
      pastorEmail: pendingUser.pastorEmail,
      accountApprovedBy: approverId || "pastor",
      accountApprovedAt: Date.now(),
    });

    // Remove from pendingUsers table
    await ctx.db.delete(pendingUserId);

    // Create notification
    await ctx.db.insert("notifications", {
      userId,
      title: "Account Approved!",
      message: `Your account has been approved. You can now login and create your professional profile.`,
      type: "system",
      read: false,
      createdAt: Date.now(),
    });

    // Send approval email to user
    try {
      const approverName = approverId 
        ? (await ctx.db.get(approverId))?.name || "Administrator"
        : pendingUser.pastor;

      await ctx.scheduler.runAfter(0, "emails:sendAccountApprovedEmail" as any, {
        userEmail: pendingUser.email,
        userName: pendingUser.name,
        approverName,
      });
    } catch (error) {
      console.error("Failed to send approval email:", error);
      // Don't fail approval if email fails
    }

    return { success: true, userId };
  },
});

/**
 * Approve via token (for pastor email link)
 */
export const approveUserAccountByToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Find pending user by token
    const pendingUser = await ctx.db
      .query("pendingUsers")
      .withIndex("by_token", (q) => q.eq("approvalToken", args.token))
      .first();

    if (!pendingUser) {
      throw new Error("Invalid or expired approval token");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", pendingUser.email))
      .first();

    if (existingUser) {
      throw new Error("User already approved");
    }

    // Move user from pendingUsers to users table
    const userId = await ctx.db.insert("users", {
      email: pendingUser.email,
      phone: pendingUser.phone,
      passwordHash: pendingUser.passwordHash,
      name: pendingUser.name,
      role: "member",
      emailVerified: true,
      createdAt: Date.now(),
      denomination: pendingUser.denomination,
      denominationName: pendingUser.denominationName,
      branch: pendingUser.branch,
      branchName: pendingUser.branchName,
      branchLocation: pendingUser.branchLocation,
      pastor: pendingUser.pastor,
      pastorEmail: pendingUser.pastorEmail,
      accountApprovedBy: "pastor",
      accountApprovedAt: Date.now(),
    });

    // Remove from pendingUsers table
    await ctx.db.delete(pendingUser._id);

    // Create notification
    await ctx.db.insert("notifications", {
      userId,
      title: "Account Approved!",
      message: `Your account has been approved by ${pendingUser.pastor}. You can now login and create your professional profile.`,
      type: "system",
      read: false,
      createdAt: Date.now(),
    });

    // Send approval email to user
    try {
      await ctx.scheduler.runAfter(0, "emails:sendAccountApprovedEmail" as any, {
        userEmail: pendingUser.email,
        userName: pendingUser.name,
        approverName: pendingUser.pastor,
      });
    } catch (error) {
      console.error("Failed to send approval email:", error);
    }

    return { success: true, userId, userName: pendingUser.name };
  },
});

/**
 * Reject a user account
 */
export const rejectUserAccount = mutation({
  args: {
    pendingUserId: v.id("pendingUsers"),
    approverId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { pendingUserId, approverId, reason } = args;

    // Verify approver is admin
    const approver = await ctx.db.get(approverId);
    if (!approver || approver.role !== "admin") {
      throw new Error("Only admins can reject accounts");
    }

    // Get pending user
    const pendingUser = await ctx.db.get(pendingUserId);
    if (!pendingUser) {
      throw new Error("Pending user not found");
    }

    // Mark as rejected (keep in pending for admin record)
    await ctx.db.patch(pendingUserId, {
      rejectionReason: reason,
    });

    return { success: true };
  },
});

/**
 * Bulk approve users
 */
export const bulkApproveUsers = mutation({
  args: {
    pendingUserIds: v.array(v.id("pendingUsers")),
    approverId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { pendingUserIds, approverId } = args;

    // Verify approver
    const approver = await ctx.db.get(approverId);
    if (!approver || approver.role !== "admin") {
      throw new Error("Only admins can approve accounts");
    }

    for (const pendingUserId of pendingUserIds) {
      const pendingUser = await ctx.db.get(pendingUserId);
      if (!pendingUser) continue;

      // Move to users table
      const userId = await ctx.db.insert("users", {
        email: pendingUser.email,
        phone: pendingUser.phone,
        passwordHash: pendingUser.passwordHash,
        name: pendingUser.name,
        role: "member",
        emailVerified: true,
        createdAt: Date.now(),
        denomination: pendingUser.denomination,
        denominationName: pendingUser.denominationName,
        branch: pendingUser.branch,
        branchName: pendingUser.branchName,
        branchLocation: pendingUser.branchLocation,
        pastor: pendingUser.pastor,
        pastorEmail: pendingUser.pastorEmail,
        accountApprovedBy: approverId,
        accountApprovedAt: Date.now(),
      });

      // Remove from pending
      await ctx.db.delete(pendingUserId);

      // Create notification
      await ctx.db.insert("notifications", {
        userId,
        title: "Account Approved!",
        message: `Your account has been approved by ${approver.name}. You can now create your professional profile.`,
        type: "system",
        read: false,
        createdAt: Date.now(),
      });

      // Send approval email
      try {
        await ctx.scheduler.runAfter(0, "emails:sendAccountApprovedEmail" as any, {
          userEmail: pendingUser.email,
          userName: pendingUser.name,
          approverName: approver.name,
        });
      } catch (error) {
        console.error("Failed to send approval email:", error);
      }
    }

    return { success: true, count: pendingUserIds.length };
  },
});

/**
 * Bulk reject users
 */
export const bulkRejectUsers = mutation({
  args: {
    pendingUserIds: v.array(v.id("pendingUsers")),
    approverId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { pendingUserIds, approverId, reason } = args;

    // Verify approver
    const approver = await ctx.db.get(approverId);
    if (!approver || approver.role !== "admin") {
      throw new Error("Only admins can reject accounts");
    }

    for (const pendingUserId of pendingUserIds) {
      await ctx.db.patch(pendingUserId, {
        rejectionReason: reason,
      });
    }

    return { success: true, count: pendingUserIds.length };
  },
});
