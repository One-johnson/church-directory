"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format, isSameDay } from "date-fns";
import { Smile, MoreVertical, Trash2, Edit2, ArrowDown, Reply } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

interface MessageListProps {
  currentUserId: Id<"users">;
  otherUserId: Id<"users">;
  otherUser: any;
  onEditMessage?: (messageId: Id<"messages">, content: string) => void;
  onReplyMessage?: (messageId: Id<"messages">, content: string, fromUserId: Id<"users">) => void;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function MessageList({ currentUserId, otherUserId, otherUser, onEditMessage, onReplyMessage }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; messageId: Id<"messages"> | null; forEveryone: boolean }>({
    open: false,
    messageId: null,
    forEveryone: false,
  });
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const messages = useQuery(api.messages.getConversation, {
    userId1: currentUserId,
    userId2: otherUserId,
  });

  const isTyping = useQuery(api.messages.getTypingStatus, {
    userId: currentUserId,
    conversationWith: otherUserId,
  });

  const addReaction = useMutation(api.messages.addReaction);
  const removeReaction = useMutation(api.messages.removeReaction);
  const deleteMessage = useMutation(api.messages.deleteMessage);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const isNearBottom = distanceFromBottom < 100;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowScrollToBottom(false);
    } else if (messages && messages.length > 0) {
      setShowScrollToBottom(true);
    }
  }, [messages]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    setShowScrollToBottom(distanceFromBottom >= 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollToBottom(false);
  };

  const handleReaction = async (messageId: Id<"messages">, emoji: string) => {
    const message = messages?.find((m) => m._id === messageId);
    const existingReaction = message?.reactions?.find(
      (r) => r.userId === currentUserId
    );

    if (existingReaction?.emoji === emoji) {
      await removeReaction({ messageId, userId: currentUserId });
    } else {
      await addReaction({ messageId, userId: currentUserId, emoji });
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteDialog.messageId) return;

    try {
      await deleteMessage({
        messageId: deleteDialog.messageId,
        userId: currentUserId,
        forEveryone: deleteDialog.forEveryone,
      });
      toast.success(deleteDialog.forEveryone ? "Message deleted for everyone" : "Message deleted for you");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } finally {
      setDeleteDialog({ open: false, messageId: null, forEveryone: false });
    }
  };

  const openDeleteDialog = (messageId: Id<"messages">, forEveryone: boolean) => {
    setDeleteDialog({ open: true, messageId, forEveryone });
  };

  const lastOutgoingMessageId = useMemo(() => {
    if (!messages?.length) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].fromUserId === currentUserId) return messages[i]._id;
    }
    return null;
  }, [messages, currentUserId]);

  if (!messages) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.fromUserId === currentUserId;
            const userReaction = message.reactions?.find(
              (r) => r.userId === currentUserId
            );
            const replyToMessage = message.replyToMessageId
              ? messages.find((m) => m._id === message.replyToMessageId)
              : null;
            const isLastOutgoing =
              message._id === lastOutgoingMessageId && isCurrentUser;

            const currentDate = new Date(message.createdAt);
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const showDateDivider =
              !previousMessage ||
              !isSameDay(currentDate, new Date(previousMessage.createdAt));

            return (
              <div key={message._id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4">
                    <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-muted">
                      {format(currentDate, "EEEE, MMM d")}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    "flex gap-2 group",
                    isCurrentUser ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {!isCurrentUser && (
                    <ProfileAvatar
                      profilePicture={otherUser?.profilePicture}
                      alt={otherUser?.name}
                      className="h-8 w-8"
                      fallback={otherUser?.name?.charAt(0) || "U"}
                    />
                  )}

                  <div
                    className={cn(
                      "flex flex-col gap-1",
                      isCurrentUser ? "items-end" : "items-start"
                    )}
                  >
                    <div className="relative group/message">
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg px-4 py-2",
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {replyToMessage && (
                          <div
                            className={cn(
                              "text-xs border-l-2 pl-2 mb-2 opacity-90",
                              isCurrentUser
                                ? "border-primary-foreground/50"
                                : "border-muted-foreground/50"
                            )}
                          >
                            <span className="font-medium">
                              {replyToMessage.fromUserId === currentUserId
                                ? "You"
                                : otherUser?.name ?? "Unknown"}
                            </span>
                            <p className="truncate max-w-[200px]">
                              {replyToMessage.content.slice(0, 80)}
                              {replyToMessage.content.length > 80 ? "…" : ""}
                            </p>
                          </div>
                        )}
                        {message.content}
                        {message.editedAt && (
                          <span className="text-xs opacity-70 ml-2">
                            (edited)
                          </span>
                        )}
                      </div>

                      {/* Message Actions Dropdown */}
                      <div
                        className={cn(
                          "absolute top-0 opacity-0 group-hover/message:opacity-100 transition-opacity",
                          isCurrentUser ? "-left-8" : "-right-8"
                        )}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              aria-label="Message options"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align={isCurrentUser ? "end" : "start"}
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                onReplyMessage?.(message._id, message.content, message.fromUserId)
                              }
                            >
                              <Reply className="mr-2 h-4 w-4" />
                              Reply
                            </DropdownMenuItem>
                            {isCurrentUser && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    onEditMessage?.(message._id, message.content)
                                  }
                                >
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    openDeleteDialog(message._id, true)
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete for everyone
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(message._id, false)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete for me
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {isLastOutgoing && (
                        <span className="text-xs text-muted-foreground">
                          {message.read && message.readAt
                            ? `Read ${formatDistanceToNow(new Date(message.readAt), { addSuffix: true })}`
                            : "Sent"}
                        </span>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Add reaction"
                          >
                            <Smile className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <div className="flex gap-1 p-1">
                            {EMOJI_REACTIONS.map((emoji) => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
                                onClick={() =>
                                  handleReaction(message._id, emoji)
                                }
                                aria-label={`React with ${emoji}`}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {EMOJI_REACTIONS.map((emoji) => {
                          const count =
                            message.reactions?.filter(
                              (r) => r.emoji === emoji
                            ).length || 0;

                          if (count === 0) return null;

                          return (
                            <Button
                              key={emoji}
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-6 px-2 text-xs",
                                userReaction?.emoji === emoji && "border-primary"
                              )}
                              onClick={() =>
                                handleReaction(message._id, emoji)
                              }
                              aria-label={`Toggle ${emoji} reaction`}
                            >
                              {emoji} {count}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex gap-2 items-center text-sm text-muted-foreground">
            <ProfileAvatar
              profilePicture={otherUser?.profilePicture}
              alt={otherUser?.name}
              className="h-6 w-6"
              fallback={otherUser?.name?.charAt(0) || "U"}
            />
            <span>{otherUser?.name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />

        {showScrollToBottom && (
          <div className="sticky bottom-4 flex justify-center">
            <Button
              size="sm"
              variant="secondary"
              onClick={scrollToBottom}
              className="shadow-md"
              aria-label="Scroll to latest message"
            >
              <ArrowDown className="h-4 w-4 mr-1" />
              New messages
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.forEveryone
                ? "This message will be deleted for everyone in this conversation. This action cannot be undone."
                : "This message will be deleted only for you. Others will still be able to see it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
