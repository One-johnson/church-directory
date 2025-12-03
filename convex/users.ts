import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all users (Admin only)
export const getAllUsers = query({
  args: { requesterId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const users = await ctx.db.query("users").collect();

    // Get profile info for each user
    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        return {
          _id: user._id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          hasProfile: !!profile,
          profileStatus: profile?.status,
        };
      })
    );

    return usersWithProfiles;
  },
});

// Update user role
export const updateUserRole = mutation({
  args: {
    requesterId: v.id("users"),
    targetUserId: v.id("users"),
    newRole: v.union(v.literal("admin"), v.literal("pastor"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const targetUser = await ctx.db.get(args.targetUserId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.targetUserId, {
      role: args.newRole,
    });

    // Notify user of role change
    await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      title: "Role Updated",
      message: `Your role has been changed to ${args.newRole}`,
      type: "role_changed",
      read: false,
      metadata: { oldRole: targetUser.role, newRole: args.newRole },
      createdAt: Date.now(),
    });

    return { message: "User role updated successfully" };
  },
});

// Bulk update user roles
export const bulkUpdateUserRoles = mutation({
  args: {
    requesterId: v.id("users"),
    updates: v.array(
      v.object({
        userId: v.id("users"),
        newRole: v.union(v.literal("admin"), v.literal("pastor"), v.literal("member")),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const results = await Promise.all(
      args.updates.map(async (update) => {
        try {
          const targetUser = await ctx.db.get(update.userId);
          if (!targetUser) {
            return { userId: update.userId, success: false, error: "User not found" };
          }

          await ctx.db.patch(update.userId, {
            role: update.newRole,
          });

          // Notify user
          await ctx.db.insert("notifications", {
            userId: update.userId,
            title: "Role Updated",
            message: `Your role has been changed to ${update.newRole}`,
            type: "role_changed",
            read: false,
            metadata: { oldRole: targetUser.role, newRole: update.newRole },
            createdAt: Date.now(),
          });

          return { userId: update.userId, success: true };
        } catch (error) {
          return { userId: update.userId, success: false, error: String(error) };
        }
      })
    );

    return results;
  },
});

// Delete user (Admin only)
export const deleteUser = mutation({
  args: {
    requesterId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Don't allow deleting self
    if (args.requesterId === args.targetUserId) {
      throw new Error("Cannot delete your own account");
    }

    // Delete user's profile if exists
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first();

    if (profile) {
      await ctx.db.delete(profile._id);
    }

    // Delete user's messages
    const sentMessages = await ctx.db
      .query("messages")
      .withIndex("by_from", (q) => q.eq("fromUserId", args.targetUserId))
      .collect();

    const receivedMessages = await ctx.db
      .query("messages")
      .withIndex("by_to", (q) => q.eq("toUserId", args.targetUserId))
      .collect();

    await Promise.all([
      ...sentMessages.map((msg) => ctx.db.delete(msg._id)),
      ...receivedMessages.map((msg) => ctx.db.delete(msg._id)),
    ]);

    // Delete user's notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .collect();

    await Promise.all(notifications.map((notif) => ctx.db.delete(notif._id)));

    // Finally delete the user
    await ctx.db.delete(args.targetUserId);

    return { message: "User deleted successfully" };
  },
});
