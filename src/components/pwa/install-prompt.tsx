"use client";

import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/use-pwa";
import { Button } from "@/components/ui/button";
import { Download, X, Share } from "lucide-react";

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 7;

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return true;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showAfterDelay, setShowAfterDelay] = useState(false);

  useEffect(() => {
    setIsDismissed(wasDismissedRecently());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent;
    const mobile =
      window.matchMedia("(max-width: 768px)").matches ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    setIsMobile(mobile);
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Delay prompt so it doesn't interrupt first paint
    const t = setTimeout(() => setShowAfterDelay(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result) {
      setIsDismissed(true);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  // Android / Chromium: native beforeinstallprompt
  const showAndroidPrompt =
    isMobile &&
    showAfterDelay &&
    isInstallable &&
    !isInstalled &&
    !isDismissed;

  // iOS Safari: no beforeinstallprompt — show manual instructions
  const showIOSHint =
    isMobile &&
    showAfterDelay &&
    isIOS &&
    !isInstalled &&
    !isDismissed &&
    !isInstallable;

  if (!showAndroidPrompt && !showIOSHint) {
    return null;
  }

  return (
    <div
      role="banner"
      className="fixed bottom-16 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg md:bottom-0 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          {showIOSHint ? (
            <Share className="h-5 w-5 text-primary-foreground" />
          ) : (
            <Download className="h-5 w-5 text-primary-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Add to Home Screen</h3>
          {showIOSHint ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Tap Share, then &quot;Add to Home Screen&quot; for quick access and
              a full-screen app experience.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              Install UD Professionals Directory for quick access and offline
              use
            </p>
          )}

          <div className="flex gap-2 mt-3">
            {showAndroidPrompt && (
              <Button size="sm" onClick={handleInstall}>
                Install
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
