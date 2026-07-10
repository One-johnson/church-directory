"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

/**
 * Handles SW messages for foreground pushes, mark-read-on-click,
 * and keeps the installed-app badge in sync with unread count.
 */
export function PushRuntime() {
  const { user } = useAuth();
  const markAsRead = useMutation(api.notifications.markAsRead);
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user ? { userId: user._id as Id<"users"> } : "skip"
  );
  const handledNids = useRef(new Set<string>());

  // Mark notification read when opened via ?nid=
  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    const params = new URLSearchParams(window.location.search);
    const nid = params.get("nid");
    if (!nid || handledNids.current.has(nid)) return;
    handledNids.current.add(nid);
    markAsRead({ notificationId: nid as Id<"notifications"> }).catch(() => {});
  }, [user, markAsRead]);

  // Badge API + SW message bridge
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "PUSH_FOREGROUND") {
        toast(data.title || "Notification", {
          description: data.body,
          action: data.url
            ? {
                label: "Open",
                onClick: () => {
                  window.location.href = data.url;
                },
              }
            : undefined,
        });
        if (data.notificationId) {
          markAsRead({
            notificationId: data.notificationId as Id<"notifications">,
          }).catch(() => {});
        }
      }

      if (data.type === "MARK_NOTIFICATION_READ" && data.notificationId) {
        markAsRead({
          notificationId: data.notificationId as Id<"notifications">,
        }).catch(() => {});
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [markAsRead]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("setAppBadge" in navigator)) {
      return;
    }
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (typeof unreadCount !== "number") return;
    if (unreadCount > 0) {
      nav.setAppBadge?.(unreadCount).catch(() => {});
    } else {
      nav.clearAppBadge?.().catch(() => {});
    }
  }, [unreadCount]);

  return null;
}
