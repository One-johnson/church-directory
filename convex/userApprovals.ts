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
    const users = await ctx.db
      .query("users")
      .withIndex("by_account_approval", (q) => q.eq("accountApproved", false))
      .collect();

    return users.map((user) => ({
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
      accountRejectionReason: user.accountRejectionReason,
    }));
  },
});

/**
 * Get account approval statistics
 */
export const getApprovalStats = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    
    const pending = allUsers.filter((u) => !u.accountApproved && !u.accountRejectionReason).length;
    const approved = allUsers.filter((u) => u.accountApproved).length;
    const rejected = allUsers.filter((u) => u.accountRejectionReason).length;

    return {
      total: allUsers.length,
      pending,
      approved,
      rejected,
    };
  },
});

/**
 * Approve a user account
 */
export const approveUserAccount = mutation({
  args: {
    userId: v.id("users"),
    approverId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId, approverId } = args;

    // Verify approver is admin or pastor
    const approver = await ctx.db.get(approverId);
    if (!approver || (approver.role !== "admin" && approver.role !== "pastor")) {
      throw new Error("Only admins and pastors can approve accounts");
    }

    // Update user account
    await ctx.db.patch(userId, {
      accountApproved: true,
      accountApprovedBy: approverId,
      accountApprovedAt: Date.now(),
      accountRejectionReason: undefined, // Clear any previous rejection
    });

    // Get user for notification
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Create notification
    await ctx.db.insert("notifications", {
      userId,
      title: "Account Approved!",
      message: `Your account has been approved by ${approver.name}. You can now create your professional profile.`,
      type: "system",
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reject a user account
 */
export const rejectUserAccount = mutation({
  args: {
    userId: v.id("users"),
    approverId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, approverId, reason } = args;

    // Verify approver is admin or pastor
    const approver = await ctx.db.get(approverId);
    if (!approver || (approver.role !== "admin" && approver.role !== "pastor")) {
      throw new Error("Only admins and pastors can reject accounts");
    }

    // Update user account
    await ctx.db.patch(userId, {
      accountApproved: false,
      accountRejectionReason: reason,
    });

    // Get user for notification
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Create notification
    await ctx.db.insert("notifications", {
      userId,
      title: "Account Requires Attention",
      message: `Your account registration needs review. Reason: ${reason}. Please contact your church admin for assistance.`,
      type: "system",
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Bulk approve users
 */
export const bulkApproveUsers = mutation({
  args: {
    userIds: v.array(v.id("users")),
    approverId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userIds, approverId } = args;

    // Verify approver
    const approver = await ctx.db.get(approverId);
    if (!approver || (approver.role !== "admin" && approver.role !== "pastor")) {
      throw new Error("Only admins and pastors can approve accounts");
    }

    for (const userId of userIds) {
      await ctx.db.patch(userId, {
        accountApproved: true,
        accountApprovedBy: approverId,
        accountApprovedAt: Date.now(),
        accountRejectionReason: undefined,
      });

      // Create notification
      await ctx.db.insert("notifications", {
        userId,
        title: "Account Approved!",
        message: `Your account has been approved by ${approver.name}. You can now create your professional profile.`,
        type: "system",
        read: false,
        createdAt: Date.now(),
      });
    }

    return { success: true, count: userIds.length };
  },
});

/**
 * Bulk reject users
 */
export const bulkRejectUsers = mutation({
  args: {
    userIds: v.array(v.id("users")),
    approverId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { userIds, approverId, reason } = args;

    // Verify approver
    const approver = await ctx.db.get(approverId);
    if (!approver || (approver.role !== "admin" && approver.role !== "pastor")) {
      throw new Error("Only admins and pastors can reject accounts");
    }

    for (const userId of userIds) {
      await ctx.db.patch(userId, {
        accountApproved: false,
        accountRejectionReason: reason,
      });

      // Create notification
      await ctx.db.insert("notifications", {
        userId,
        title: "Account Requires Attention",
        message: `Your account registration needs review. Reason: ${reason}. Please contact your church admin for assistance.`,
        type: "system",
        read: false,
        createdAt: Date.now(),
      });
    }

    return { success: true, count: userIds.length };
  },
});
