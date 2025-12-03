"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);

      if (navigator.onLine) {
        window.location.reload();
      }
    };

    setIsOnline(navigator.onLine);

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <WifiOff className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">You're Offline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            It looks like you've lost your internet connection. Please check
            your network settings and try again.
          </p>

          {isOnline ? (
            <div className="text-sm text-green-600 dark:text-green-400">
              Connection restored! Redirecting...
            </div>
          ) : (
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}

          <div className="text-xs text-muted-foreground mt-4">
            <p>Some features may be available offline:</p>
            <ul className="list-disc list-inside mt-2 text-left">
              <li>View cached pages</li>
              <li>Read saved messages</li>
              <li>View your profile</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
