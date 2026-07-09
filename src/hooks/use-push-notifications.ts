"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(userId: Id<"users"> | null | undefined) {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const hasSubscription = useQuery(
    api.pushSubscriptions.hasSubscription,
    userId ? { userId } : "skip"
  );
  const saveSubscription = useMutation(api.pushSubscriptions.saveSubscription);
  const removeSubscription = useMutation(
    api.pushSubscriptions.removeSubscription
  );
  const sendTestPush = useAction(api.push.sendTestPush);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const subscribe = useCallback(
    async (options?: { silent?: boolean }): Promise<boolean> => {
      if (!userId || !isSupported) return false;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        if (!options?.silent) {
          toast.error("Push notifications are not configured");
        }
        return false;
      }

      setIsSubscribing(true);
      try {
        // Already granted — skip the prompt
        let permissionResult = Notification.permission;
        if (permissionResult === "default") {
          permissionResult = await Notification.requestPermission();
        }
        setPermission(permissionResult);
        if (permissionResult !== "granted") {
          if (!options?.silent) {
            toast.error("Notification permission denied");
          }
          return false;
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              vapidKey
            ) as BufferSource,
          });
        }

        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          throw new Error("Invalid push subscription");
        }

        await saveSubscription({
          userId,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          userAgent: navigator.userAgent,
        });

        if (!options?.silent) {
          toast.success("Push notifications enabled");
        }
        return true;
      } catch (error) {
        console.error("Push subscribe failed:", error);
        if (!options?.silent) {
          toast.error("Could not enable push notifications");
        }
        return false;
      } finally {
        setIsSubscribing(false);
      }
    },
    [userId, isSupported, saveSubscription]
  );

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!userId || !isSupported) return false;
    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await removeSubscription({ userId, endpoint });
      }
      toast.success("Push notifications disabled");
      return true;
    } catch (error) {
      console.error("Push unsubscribe failed:", error);
      toast.error("Could not disable push notifications");
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [userId, isSupported, removeSubscription]);

  const sendTest = useCallback(async () => {
    if (!userId) return;
    try {
      await sendTestPush({ userId });
      toast.success("Test notification sent");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send test notification");
    }
  }, [userId, sendTestPush]);

  return {
    isSupported,
    permission,
    isSubscribed: !!hasSubscription,
    isSubscribing,
    subscribe,
    unsubscribe,
    sendTest,
  };
}
