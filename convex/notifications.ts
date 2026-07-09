import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const notificationType = v.union(
  v.literal("profile_approved"),
  v.literal("profile_rejected"),
  v.literal("new_message"),
  v.literal("pending_approval"),
  v.literal("role_changed"),
  v.literal("system")
);

function urlForType(
  type:
    | "profile_approved"
    | "profile_rejected"
    | "new_message"
    | "pending_approval"
    | "role_changed"
    | "system",
  metadata?: any
): string {
  switch (type) {
    case "new_message":
      return metadata?.fromUserId
        ? `/messages?to=${metadata.fromUserId}`
        : "/messages";
    case "profile_approved":
    case "profile_rejected":
      return "/dashboard";
    case "pending_approval":
      return "/admin/approvals";
    case "role_changed":
      return "/account";
    default:
      return "/dashboard";
  }
}

// Create a notification (+ schedule Web Push)
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: notificationType,
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      title: args.title,
      message: args.message,
      type: args.type,
      read: false,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    try {
      await ctx.scheduler.runAfter(0, internal.push.sendPushToUser, {
        userId: args.userId,
        title: args.title,
        body: args.message,
        url: urlForType(args.type, args.metadata),
      });
    } catch (error) {
      console.error("Failed to schedule push notification:", error);
    }

    return notificationId;
  },
});

/** Helper used by other mutations that insert notifications directly. */
export const schedulePushForUser = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.push.sendPushToUser, {
      userId: args.userId,
      title: args.title,
      body: args.message,
      url: args.url || "/dashboard",
    });
  },
});

// Get user notifications
export const getUserNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);

    return notifications;
  },
});

// Get unread notification count
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();

    return notifications.length;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();

    await Promise.all(
      notifications.map((notification) =>
        ctx.db.patch(notification._id, { read: true })
      )
    );

    return { count: notifications.length };
  },
});

// Delete a notification
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});

// Delete all read notifications
export const deleteAllRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("read"), true))
      .collect();

    await Promise.all(
      notifications.map((notification) => ctx.db.delete(notification._id))
    );

    return { count: notifications.length };
  },
});
