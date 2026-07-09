"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Detects a waiting service worker and prompts the user to refresh for updates.
 */
export function ServiceWorkerUpdateToast() {
  const prompted = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const onControllerChange = () => {
      // New SW took control — soft reload once
      if (!prompted.current) return;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    const checkWaiting = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        const showUpdateToast = (worker: ServiceWorker) => {
          if (prompted.current) return;
          prompted.current = true;
          toast("Update available", {
            description: "A new version of the app is ready.",
            duration: Infinity,
            action: {
              label: "Refresh",
              onClick: () => {
                worker.postMessage({ type: "SKIP_WAITING" });
                // Fallback reload if skipWaiting isn't handled
                setTimeout(() => window.location.reload(), 500);
              },
            },
          });
        };

        if (registration.waiting) {
          showUpdateToast(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              showUpdateToast(installing);
            }
          });
        });

        // Periodic check
        const interval = setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);

        return () => clearInterval(interval);
      } catch {
        // ignore
      }
    };

    const cleanupPromise = checkWaiting();

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, []);

  return null;
}
