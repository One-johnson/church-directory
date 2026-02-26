"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { usePresence } from "@/hooks/use-presence";

import { MessageList } from "@/components/messaging/message-list";
import { MessageInput, type ReplyingTo } from "@/components/messaging/message-input";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Loader2, ArrowLeft, Bell, BellOff, Archive, ArchiveRestore } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

/* -------------------- MAIN CLIENT COMPONENT -------------------- */
function MessagesContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(
    searchParams.get("to")
  );
  const [editingMessage, setEditingMessage] = React.useState<{
    id: Id<"messages">;
    content: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showArchived, setShowArchived] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<ReplyingTo | null>(null);

  usePresence((user?._id as Id<"users">) || null);

  const conversations = useQuery(
    api.messages.getInbox,
    user ? { userId: user._id as Id<"users">, includeArchived: showArchived } : "skip"
  );

  const filteredConversations = React.useMemo(() => {
    if (!conversations) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((conv) => {
      const name =
        conv.otherUser &&
        "name" in conv.otherUser &&
        typeof conv.otherUser.name === "string"
          ? (conv.otherUser.name as string).toLowerCase()
          : "";
      return name.includes(term);
    });
  }, [conversations, searchTerm]);

  const selectedConversation = React.useMemo(() => {
    if (!selectedUserId || !conversations) return null;
    return conversations.find(
      (c) => (c.otherUser as { _id?: string })._id === selectedUserId
    ) ?? null;
  }, [selectedUserId, conversations]);

  const selectedUser = React.useMemo(
    () => (selectedConversation && "otherUser" in selectedConversation ? selectedConversation.otherUser : null),
    [selectedConversation]
  );

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

  React.useEffect(() => {
    if (selectedUserId && conversations && !showArchived) {
      const stillInList = conversations.some(
        (c) => (c.otherUser as { _id?: string })?._id === selectedUserId
      );
      if (!stillInList) setSelectedUserId(null);
    }
  }, [conversations, selectedUserId, showArchived]);

  const handleEditMessage = (messageId: Id<"messages">, content: string) => {
    setEditingMessage({ id: messageId, content });
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  const handleReplyMessage = (
    messageId: Id<"messages">,
    content: string,
    fromUserId: Id<"users">
  ) => {
    const fromName =
      fromUserId === (user?._id as Id<"users">)
        ? "You"
        : selectedUser && typeof selectedUser === "object" && "name" in selectedUser
          ? String(selectedUser.name)
          : "Unknown";
    setReplyingTo({ id: messageId, content, fromUserId, fromUserName: fromName });
  };

  const handleClearReply = () => setReplyingTo(null);

  const setConversationMuted = useMutation(api.messages.setConversationMuted);
  const setConversationArchived = useMutation(api.messages.setConversationArchived);

  const isMuted = selectedConversation?.muted ?? false;
  const isArchived = selectedConversation?.archived ?? false;

  const presenceLabel = React.useMemo(() => {
    if (!selectedUser || typeof selectedUser !== "object") return "";

    const userObj = selectedUser as any;

    if (userObj.isOnline) {
      return "Online";
    }

    if (userObj.lastSeen) {
      try {
        return `Last seen ${formatDistanceToNow(new Date(userObj.lastSeen), {
          addSuffix: true,
        })}`;
      } catch {
        return "Offline";
      }
    }

    return "Offline";
  }, [selectedUser]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Conversations List */}
        <div
          className={cn(
            "w-full md:w-80 border-r flex flex-col",
            selectedUserId && "hidden md:flex"
          )}
        >
          <div className="p-4 border-b bg-background flex-shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" aria-hidden="true" />
              Messages
            </h2>
          </div>

          <div className="p-3 border-b bg-background flex-shrink-0 space-y-2">
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-input"
              />
              Show archived
            </label>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!conversations && (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  className="h-8 w-8 animate-spin text-primary"
                  aria-hidden="true"
                />
              </div>
            )}

            {conversations && conversations.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Visit the directory to connect</p>
              </div>
            )}

            {conversations &&
              conversations.length > 0 &&
              filteredConversations.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  No conversations match your search
                </div>
              )}

            {filteredConversations.map((conv) => {
              const otherUserId =
                conv.otherUser && "_id" in conv.otherUser
                  ? (conv.otherUser as { _id: string })._id
                  : undefined;
              const isSelected = otherUserId === selectedUserId;
              const isOnline =
                conv.otherUser && "isOnline" in conv.otherUser
                  ? (conv.otherUser as { isOnline?: boolean }).isOnline
                  : false;

              return (
                <button
                  key={otherUserId || conv.lastMessage?.createdAt}
                  onClick={() => otherUserId && setSelectedUserId(otherUserId)}
                  className={cn(
                    "w-full p-4 border-b hover:bg-accent transition-colors text-left",
                    isSelected && "bg-accent"
                  )}
                  disabled={!conv.otherUser}
                >
                  <div className="flex gap-3">
                    <div className="relative">
                      <ProfileAvatar
                        profilePicture={
                          conv.otherUser && "profilePicture" in conv.otherUser
                            ? (conv.otherUser.profilePicture as string)
                            : undefined
                        }
                        alt={
                          conv.otherUser && "name" in conv.otherUser
                            ? String(conv.otherUser.name)
                            : "User"
                        }
                        fallback={
                          conv.otherUser &&
                          "name" in conv.otherUser &&
                          typeof conv.otherUser.name === "string"
                            ? conv.otherUser.name.charAt(0)
                            : "U"
                        }
                      />
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">
                          {conv.otherUser &&
                          "name" in conv.otherUser &&
                          typeof conv.otherUser.name === "string"
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
                          { addSuffix: true }
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
            "flex-1 flex flex-col min-h-0",
            !selectedUserId && "hidden md:flex"
          )}
        >
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose someone to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header - sticky so it stays visible when message list scrolls */}
              <div className="sticky top-0 z-10 border-b p-4 flex items-center gap-3 bg-background flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedUserId(null)}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="relative">
                  <ProfileAvatar
                    profilePicture={
                      selectedUser &&
                      typeof selectedUser === "object" &&
                      "profilePicture" in selectedUser
                        ? selectedUser.profilePicture
                        : undefined
                    }
                    alt={
                      selectedUser && "name" in selectedUser
                        ? String(selectedUser.name)
                        : "User"
                    }
                    fallback={
                      selectedUser &&
                      typeof selectedUser === "object" &&
                      "name" in selectedUser &&
                      typeof selectedUser.name === "string"
                        ? selectedUser.name.charAt(0)
                        : "U"
                    }
                  />

                  {selectedUser &&
                    (selectedUser as any).isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">
                    {selectedUser &&
                    typeof selectedUser === "object" &&
                    "name" in selectedUser &&
                    typeof selectedUser.name === "string"
                      ? selectedUser.name
                      : "Unknown"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {presenceLabel}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setConversationMuted({
                        userId: user._id as Id<"users">,
                        otherUserId: selectedUserId as Id<"users">,
                        muted: !isMuted,
                      })
                    }
                    aria-label={isMuted ? "Unmute conversation" : "Mute conversation"}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <BellOff className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setConversationArchived({
                        userId: user._id as Id<"users">,
                        otherUserId: selectedUserId as Id<"users">,
                        archived: !isArchived,
                      })
                    }
                    aria-label={isArchived ? "Unarchive conversation" : "Archive conversation"}
                    title={isArchived ? "Unarchive" : "Archive"}
                  >
                    {isArchived ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Message list - fixed height with its own scroll */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <MessageList
                  currentUserId={user._id as Id<"users">}
                  otherUserId={selectedUserId as Id<"users">}
                  otherUser={selectedUser}
                  onEditMessage={handleEditMessage}
                  onReplyMessage={handleReplyMessage}
                />
              </div>

              {/* Input - fixed at bottom */}
              <div className="flex-shrink-0">
                <MessageInput
                fromUserId={user._id as Id<"users">}
                toUserId={selectedUserId as Id<"users">}
                editingMessage={editingMessage}
                onCancelEdit={handleCancelEdit}
                replyingTo={replyingTo}
                onClearReply={handleClearReply}
              />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------- SUSPENSE WRAPPER (REQUIRED) ---------------------- */

export default function MessagesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MessagesContent />
    </React.Suspense>
  );
}
