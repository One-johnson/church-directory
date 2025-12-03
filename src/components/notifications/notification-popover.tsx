"use client";

import * as React from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import type { Id } from "../../../convex/_generated/dataModel";

interface Notification {
  _id: Id<"notifications">;
  userId: Id<"users">;
  title: string;
  message: string;
  type:
    | "profile_approved"
    | "profile_rejected"
    | "new_message"
    | "pending_approval"
    | "role_changed"
    | "system";
  read: boolean;
  metadata?: any;
  createdAt: number;
}

export function NotificationPopover(): React.JSX.Element {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);

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

  const handleMarkAsRead = async (
    notificationId: Id<"notifications">
  ): Promise<void> => {
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

  const handleDelete = async (
    notificationId: Id<"notifications">
  ): Promise<void> => {
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

  if (!user) return <></>;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount !== undefined && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-2">
            {notifications && notifications.some((n) => !n.read) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-8 text-xs"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
            {notifications && notifications.some((n) => n.read) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteAllRead}
                className="h-8 text-xs"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Clear read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
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
                              className="h-6 w-6"
                              onClick={() => handleMarkAsRead(notification._id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDelete(notification._id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
