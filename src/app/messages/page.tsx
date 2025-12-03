"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { usePresence } from "@/hooks/use-presence";
import { AppNavbar } from "@/components/layout/app-navbar";
import { MessageList } from "@/components/messaging/message-list";
import { MessageInput } from "@/components/messaging/message-input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

export default function MessagesPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(
    searchParams.get("to")
  );

  usePresence((user?._id as Id<"users">) || null);

  const conversations = useQuery(
    api.messages.getInbox,
    user ? { userId: user._id as Id<"users"> } : "skip"
  );

  const selectedUser = React.useMemo(() => {
    if (!selectedUserId || !conversations) return null;
    const conv = conversations.find((c) => c.otherUser?._id === selectedUserId);
    return conv?.otherUser || null;
  }, [selectedUserId, conversations]);

  const markAsRead = useMutation(api.messages.markConversationAsRead);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  React.useEffect(() => {
    if (selectedUserId && user) {
      markAsRead({
        fromUserId: selectedUserId as Id<"users">,
        toUserId: user._id as Id<"users">,
      });
    }
  }, [selectedUserId, user, markAsRead]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavbar />
      <div className="flex-1 flex">
        {/* Conversations List */}
        <div
          className={cn(
            "w-full md:w-80 border-r flex flex-col",
            selectedUserId && "hidden md:flex"
          )}
        >
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Messages
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!conversations && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {conversations && conversations.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Visit the directory to connect</p>
              </div>
            )}

            {conversations?.map((conv) => {
              const isSelected = conv.otherUser?._id === selectedUserId;
              const isOnline = conv.otherUser && 'isOnline' in conv.otherUser 
                ? (conv.otherUser as { isOnline?: boolean }).isOnline 
                : false;

              return (
                <button
                  key={conv.otherUser?._id || conv.lastMessage?.createdAt}
                  onClick={() => conv.otherUser?._id && setSelectedUserId(conv.otherUser._id)}
                  className={cn(
                    "w-full p-4 border-b hover:bg-accent transition-colors text-left",
                    isSelected && "bg-accent"
                  )}
                  disabled={!conv.otherUser}
                >
                {">"}
                  <div className="flex gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={conv.otherUser && 'profilePicture' in conv.otherUser ? conv.otherUser.profilePicture as string : undefined} />
                        <AvatarFallback>
                          {conv.otherUser && 'name' in conv.otherUser && typeof conv.otherUser.name === "string"
                            ? conv.otherUser.name.charAt(0)
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">
                          {conv.otherUser && 'name' in conv.otherUser && typeof conv.otherUser.name === "string"
                            ? conv.otherUser.name
                            : "Unknown User"}
                        </span>
                        {conv.unreadCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="h-5 min-w-5 rounded-full px-1.5"
                          >
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(
                          new Date(conv.lastMessage.createdAt),
                          {
                            addSuffix: true,
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation View */}
        <div
          className={cn(
            "flex-1 flex flex-col",
            !selectedUserId && "hidden md:flex"
          )}
        >
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">
                  Choose a conversation to start messaging
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="border-b p-4 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedUserId(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="relative">
                  <Avatar>
                    <AvatarImage
                      src={
                        selectedUser && typeof selectedUser === "object" && "profilePicture" in selectedUser
                          ? selectedUser.profilePicture
                          : undefined
                      }
                    />
                    <AvatarFallback>
                      {selectedUser &&
                      typeof selectedUser === "object" &&
                      "name" in selectedUser &&
                      typeof selectedUser.name === "string"
                        ? selectedUser.name.charAt(0)
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  {selectedUser && typeof selectedUser === "object" && "isOnline" in selectedUser && (selectedUser as any).isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold">
                    {selectedUser && typeof selectedUser === "object" && "name" in selectedUser && typeof selectedUser.name === "string"
                      ? selectedUser.name
                      : "Unknown"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser && typeof selectedUser === "object" && "isOnline" in selectedUser
                      ? ((selectedUser as any).isOnline ? "Online" : "Offline")
                      : ""}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <MessageList
                currentUserId={user._id as Id<"users">}
                otherUserId={selectedUserId as Id<"users">}
                otherUser={selectedUser}
              />

              {/* Input */}
              <MessageInput
                fromUserId={user._id as Id<"users">}
                toUserId={selectedUserId as Id<"users">}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
