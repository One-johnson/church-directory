"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import webpush from "web-push";
import type { Id } from "./_generated/dataModel";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:admin@churchmms.com";

function configureWebPush() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error(
      "VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in Convex environment variables"
    );
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

type PushResult = { sent: number; failed: number };

async function deliverPush(
  ctx: {
    runQuery: Function;
    runMutation: Function;
  },
  args: {
    userId: Id<"users">;
    title: string;
    body: string;
    url?: string;
  }
): Promise<PushResult> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("VAPID keys not configured; skipping push notification");
    return { sent: 0, failed: 0 };
  }

  configureWebPush();

  const subscriptions = (await ctx.runQuery(
    internal.pushSubscriptions.getSubscriptionsForUser,
    { userId: args.userId }
  )) as Array<{
    endpoint: string;
    p256dh: string;
    auth: string;
  }>;

  if (!subscriptions.length) {
    return { sent: 0, failed: 0 };
  }

  const payload = JSON.stringify({
    title: args.title,
    body: args.body,
    url: args.url || "/dashboard",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
  });

  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        sent += 1;
      } catch (error: unknown) {
        failed += 1;
        const status =
          error && typeof error === "object" && "statusCode" in error
            ? (error as { statusCode?: number }).statusCode
            : undefined;
        if (status === 404 || status === 410) {
          await ctx.runMutation(internal.pushSubscriptions.removeByEndpoint, {
            endpoint: sub.endpoint,
          });
        } else {
          const message =
            error && typeof error === "object" && "message" in error
              ? String((error as { message: unknown }).message)
              : String(error);
          console.error("Push send failed:", status, message);
        }
      }
    })
  );

  return { sent, failed };
}

export const sendPushToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<PushResult> => {
    return await deliverPush(ctx, args);
  },
});

/** Public action for testing push from the client. */
export const sendTestPush = action({
  args: {
    userId: v.id("users"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<PushResult> => {
    return await deliverPush(ctx, {
      userId: args.userId,
      title: args.title || "Test notification",
      body: args.body || "Push notifications are working.",
      url: "/account",
    });
  },
});
