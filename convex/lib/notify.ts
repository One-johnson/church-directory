import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

export type NotificationType =
  | "profile_approved"
  | "profile_rejected"
  | "new_message"
  | "pending_approval"
  | "role_changed"
  | "system";

export type NotificationPreferences = {
  messages: boolean;
  approvals: boolean;
  roleChanges: boolean;
  system: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  messages: true,
  approvals: true,
  roleChanges: true,
  system: true,
};

function withNotificationId(url: string, notificationId: Id<"notifications">) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}nid=${notificationId}`;
}

export function urlForNotificationType(
  type: NotificationType,
  metadata?: Record<string, unknown>
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

export function pushTagForType(
  type: NotificationType,
  metadata?: Record<string, unknown>
): string {
  switch (type) {
    case "new_message":
      return metadata?.fromUserId
        ? `msg-${metadata.fromUserId}`
        : "new-message";
    case "pending_approval":
      return "pending-approval";
    case "profile_approved":
    case "profile_rejected":
      return "profile-status";
    case "role_changed":
      return "role-changed";
    default:
      return "system";
  }
}

export async function getNotificationPreferences(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<NotificationPreferences> {
  const row = await ctx.db
    .query("notificationPreferences")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!row) return DEFAULT_NOTIFICATION_PREFERENCES;

  return {
    messages: row.messages,
    approvals: row.approvals,
    roleChanges: row.roleChanges,
    system: row.system,
  };
}

export function isPushAllowedForType(
  prefs: NotificationPreferences,
  type: NotificationType
): boolean {
  switch (type) {
    case "new_message":
      return prefs.messages;
    case "profile_approved":
    case "profile_rejected":
    case "pending_approval":
      return prefs.approvals;
    case "role_changed":
      return prefs.roleChanges;
    case "system":
    default:
      return prefs.system;
  }
}

/** Insert in-app notification and schedule a Web Push delivery (if allowed). */
export async function insertNotificationAndPush(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, unknown>;
    url?: string;
  }
) {
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
    const prefs = await getNotificationPreferences(ctx, args.userId);
    if (!isPushAllowedForType(prefs, args.type)) {
      return notificationId;
    }

    const baseUrl =
      args.url ||
      urlForNotificationType(
        args.type,
        args.metadata as Record<string, unknown>
      );

    await ctx.scheduler.runAfter(0, internal.push.sendPushToUser, {
      userId: args.userId,
      title: args.title,
      body: args.message,
      url: withNotificationId(baseUrl, notificationId),
      tag: pushTagForType(args.type, args.metadata as Record<string, unknown>),
      notificationId,
      notificationType: args.type,
    });
  } catch (error) {
    console.error("Failed to schedule push:", error);
  }

  return notificationId;
}
