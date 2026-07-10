"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { api } from "../../../convex/_generated/api";
import {
  ArrowLeft,
  User,
  Sun,
  Moon,
  Laptop,
  LogOut,
  Loader2,
  Bell,
  BellOff,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

export default function AccountPage(): React.JSX.Element {
  const router = useRouter();
  const { user, sessionId, logout } = useAuth();
  const { setTheme, theme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] =
    React.useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState<boolean>(false);

  const {
    isSupported: pushSupported,
    isSubscribed,
    isSubscribing,
    subscribe,
    unsubscribe,
    clearAllSubscriptions,
    sendTest,
  } = usePushNotifications(user?._id as Id<"users"> | undefined);

  const prefs = useQuery(
    api.notifications.getPreferences,
    user ? { userId: user._id as Id<"users"> } : "skip"
  );
  const updatePreferences = useMutation(api.notifications.updatePreferences);

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = (): void => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    toast.loading("Logging out...", { id: "logout-toast" });

    try {
      await clearAllSubscriptions();
      await new Promise((resolve: (value: unknown) => void) =>
        setTimeout(resolve, 400)
      );
      logout();
      toast.success("Successfully logged out!", { id: "logout-toast" });
      router.push("/");
    } catch {
      toast.error("Failed to logout. Please try again.", {
        id: "logout-toast",
      });
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  const togglePref = async (
    key: "messages" | "approvals" | "roleChanges" | "system",
    value: boolean
  ) => {
    if (!user) return;
    try {
      await updatePreferences({
        userId: user._id as Id<"users">,
        [key]: value,
      });
    } catch {
      toast.error("Could not update notification preferences");
    }
  };

  if (!user) {
    return <></>;
  }

  return (
    <div className="min-h-screen bg-background pt-4 md:pt-20 pb-20">
      <div className="container max-w-2xl mx-auto px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={undefined} alt={user.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge variant="outline" className="mt-2 w-fit">
                  {user.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push("/profile/edit")}
            >
              <User className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Get alerts for new messages and profile updates, even when the app
              is closed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!pushSupported ? (
              <p className="text-sm text-muted-foreground">
                Push notifications are not supported in this browser.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {isSubscribed ? "Enabled" : "Disabled"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isSubscribed
                        ? "You will receive push alerts on this device"
                        : "Enable to receive push alerts on this device"}
                    </p>
                  </div>
                  <Button
                    variant={isSubscribed ? "outline" : "default"}
                    size="sm"
                    disabled={isSubscribing}
                    onClick={() =>
                      isSubscribed ? unsubscribe() : subscribe()
                    }
                    className="shrink-0"
                  >
                    {isSubscribing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isSubscribed ? (
                      <>
                        <BellOff className="mr-2 h-4 w-4" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Bell className="mr-2 h-4 w-4" />
                        Enable
                      </>
                    )}
                  </Button>
                </div>

                {isSubscribed && prefs && (
                  <div className="space-y-3 rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Alert types
                    </p>
                    {(
                      [
                        {
                          key: "messages" as const,
                          label: "Messages",
                          description: "New chat messages",
                        },
                        {
                          key: "approvals" as const,
                          label: "Approvals",
                          description: "Profile and approval status",
                        },
                        {
                          key: "roleChanges" as const,
                          label: "Role changes",
                          description: "When your role is updated",
                        },
                        {
                          key: "system" as const,
                          label: "System",
                          description: "Account and system notices",
                        },
                      ] as const
                    ).map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <Label htmlFor={`pref-${item.key}`} className="text-sm">
                            {item.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <Switch
                          id={`pref-${item.key}`}
                          checked={prefs[item.key]}
                          onCheckedChange={(checked) =>
                            togglePref(item.key, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                {isSubscribed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => sessionId && sendTest(sessionId)}
                    disabled={!sessionId}
                  >
                    Send test notification
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Theme</CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className="w-full"
                onClick={() => setTheme("light")}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className="w-full"
                onClick={() => setTheme("dark")}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                className="w-full"
                onClick={() => setTheme("system")}
              >
                <Laptop className="mr-2 h-4 w-4" />
                System
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will need to sign in again
              to access your account. Push alerts for this device will be
              cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              disabled={isLoggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
