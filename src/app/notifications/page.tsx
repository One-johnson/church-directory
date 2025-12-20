"use client";

import * as React from "react";
import { Bell, Check, CheckCheck, Trash2, X, ArrowLeft } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import type { Id } from "../../../convex/_generated/dataModel";

interface Notification {
  _id: Id<"notifications">;
  userId: Id<"users">;
  title: string;
  message: string;
  type: "profile_approved" | "profile_rejected" | "new_message" | "pending_approval" | "role_changed" | "system";
  read: boolean;
  metadata?: any;
  createdAt: number;
}

export default function NotificationsPage(): React.JSX.Element {
  const { user } = useAuth();
  const router = useRouter();

  const notifications = useQuery(
    api.notifications.getUserNotifications,
    user ? { userId: user._id } : "skip"
  ) as Notification[] | undefined;

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user ? { userId: user._id } : "skip"
  ) as number | undefined;

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const deleteAllRead = useMutation(api.notifications.deleteAllRead);

  const handleMarkAsRead = async (notificationId: Id<"notifications">): Promise<void> => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async (): Promise<void> => {
    if (!user) return;
    try {
      await markAllAsRead({ userId: user._id });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDelete = async (notificationId: Id<"notifications">): Promise<void> => {
    try {
      await deleteNotification({ notificationId });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleDeleteAllRead = async (): Promise<void> => {
    if (!user) return;
    try {
      await deleteAllRead({ userId: user._id });
    } catch (error) {
      console.error("Failed to delete read notifications:", error);
    }
  };

  const getNotificationColor = (type: Notification["type"]): string => {
    switch (type) {
      case "profile_approved":
        return "bg-green-500";
      case "profile_rejected":
        return "bg-red-500";
      case "new_message":
        return "bg-blue-500";
      case "pending_approval":
        return "bg-yellow-500";
      case "role_changed":
        return "bg-purple-500";
      case "system":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!user) {
    router.push("/login");
    return <></>;
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount !== undefined && unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          {notifications && notifications.some((n) => !n.read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
          {notifications && notifications.some((n) => n.read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAllRead}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-card rounded-lg border">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-base">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.read ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${getNotificationColor(
                        notification.type
                      )}`}
                    />
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <div className="flex gap-1 flex-shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleMarkAsRead(notification._id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(notification._id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
