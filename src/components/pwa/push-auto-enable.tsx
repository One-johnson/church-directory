"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import type { Id } from "../../../convex/_generated/dataModel";

const AUTO_ATTEMPTED_KEY = "push-auto-enable-attempted";

/**
 * Silently enables Web Push for logged-in users when permission is default/granted.
 * Does not re-prompt if the user previously denied or dismissed.
 */
export function PushAutoEnable() {
  const { user, isLoading } = useAuth();
  const { isSupported, isSubscribed, permission, subscribe } =
    usePushNotifications(user?._id as Id<"users"> | undefined);
  const attempted = useRef(false);

  useEffect(() => {
    if (isLoading || !user || !isSupported || isSubscribed || attempted.current) {
      return;
    }

    // User already blocked notifications in the browser
    if (permission === "denied") return;

    try {
      if (sessionStorage.getItem(AUTO_ATTEMPTED_KEY) === user._id) {
        return;
      }
    } catch {
      // ignore
    }

    attempted.current = true;

    const timer = setTimeout(async () => {
      try {
        sessionStorage.setItem(AUTO_ATTEMPTED_KEY, user._id);
      } catch {
        // ignore
      }
      await subscribe({ silent: true });
    }, 2500);

    return () => clearTimeout(timer);
  }, [
    isLoading,
    user,
    isSupported,
    isSubscribed,
    permission,
    subscribe,
  ]);

  return null;
}
