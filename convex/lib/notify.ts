import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

type NotificationType =
  | "profile_approved"
  | "profile_rejected"
  | "new_message"
  | "pending_approval"
  | "role_changed"
  | "system";

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

/** Insert in-app notification and schedule a Web Push delivery. */
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
    await ctx.scheduler.runAfter(0, internal.push.sendPushToUser, {
      userId: args.userId,
      title: args.title,
      body: args.message,
      url:
        args.url ||
        urlForNotificationType(args.type, args.metadata as Record<string, unknown>),
    });
  } catch (error) {
    console.error("Failed to schedule push:", error);
  }

  return notificationId;
}
