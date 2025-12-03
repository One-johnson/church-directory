"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function usePresence(userId: Id<"users"> | null) {
  const updatePresence = useMutation(api.presence.updatePresence);

  useEffect(() => {
    if (!userId) return;

    const setOnline = () => {
      updatePresence({ userId, isOnline: true });
    };

    const setOffline = () => {
      updatePresence({ userId, isOnline: false });
    };

    setOnline();

    const interval = setInterval(setOnline, 60000);

    window.addEventListener("beforeunload", setOffline);
    window.addEventListener("focus", setOnline);
    window.addEventListener("blur", setOffline);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", setOffline);
      window.removeEventListener("focus", setOnline);
      window.removeEventListener("blur", setOffline);
      setOffline();
    };
  }, [userId, updatePresence]);
}
