import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  insertNotificationAndPush,
  urlForNotificationType,
  pushTagForType,
  getNotificationPreferences,
  isPushAllowedForType,
  type NotificationType,
} from "./lib/notify";
import { internal } from "./_generated/api";

const notificationType = v.union(
  v.literal("profile_approved"),
  v.literal("profile_rejected"),
  v.literal("new_message"),
  v.literal("pending_approval"),
  v.literal("role_changed"),
  v.literal("system")
);

export const getPreferences = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await getNotificationPreferences(ctx, args.userId);
  },
});

export const updatePreferences = mutation({
  args: {
    userId: v.id("users"),
    messages: v.optional(v.boolean()),
    approvals: v.optional(v.boolean()),
    roleChanges: v.optional(v.boolean()),
    system: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const next = {
      messages:
        args.messages ??
        existing?.messages ??
        DEFAULT_NOTIFICATION_PREFERENCES.messages,
      approvals:
        args.approvals ??
        existing?.approvals ??
        DEFAULT_NOTIFICATION_PREFERENCES.approvals,
      roleChanges:
        args.roleChanges ??
        existing?.roleChanges ??
        DEFAULT_NOTIFICATION_PREFERENCES.roleChanges,
      system:
        args.system ??
        existing?.system ??
        DEFAULT_NOTIFICATION_PREFERENCES.system,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, next);
      return existing._id;
    }

    return await ctx.db.insert("notificationPreferences", {
      userId: args.userId,
      ...next,
    });
  },
});

export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: notificationType,
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await insertNotificationAndPush(ctx, {
      userId: args.userId,
      title: args.title,
      message: args.message,
      type: args.type as NotificationType,
      metadata: args.metadata,
    });
  },
});

export const schedulePushForUser = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    url: v.optional(v.string()),
    type: v.optional(notificationType),
  },
  handler: async (ctx, args) => {
    const type = (args.type || "system") as NotificationType;
    const prefs = await getNotificationPreferences(ctx, args.userId);
    if (!isPushAllowedForType(prefs, type)) {
      return { scheduled: false };
    }

    await ctx.scheduler.runAfter(0, internal.push.sendPushToUser, {
      userId: args.userId,
      title: args.title,
      body: args.message,
      url: args.url || urlForNotificationType(type),
      tag: pushTagForType(type),
      notificationType: type,
    });
    return { scheduled: true };
  },
});

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

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return;
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

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

export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});

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
