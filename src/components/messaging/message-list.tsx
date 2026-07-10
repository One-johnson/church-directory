"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { Button } from "@/components/ui/button";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble";
import { Marker, MarkerContent } from "@/components/ui/marker";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
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
import { Smile, MoreVertical, Trash2, Edit2, Reply } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

interface MessageListProps {
  currentUserId: Id<"users">;
  otherUserId: Id<"users">;
  otherUser: any;
  onEditMessage?: (messageId: Id<"messages">, content: string) => void;
  onReplyMessage?: (
    messageId: Id<"messages">,
    content: string,
    fromUserId: Id<"users">
  ) => void;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function MessageList({
  currentUserId,
  otherUserId,
  otherUser,
  onEditMessage,
  onReplyMessage,
}: MessageListProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    messageId: Id<"messages"> | null;
    forEveryone: boolean;
  }>({
    open: false,
    messageId: null,
    forEveryone: false,
  });

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
      toast.success(
        deleteDialog.forEveryone
          ? "Message deleted for everyone"
          : "Message deleted for you"
      );
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } finally {
      setDeleteDialog({ open: false, messageId: null, forEveryone: false });
    }
  };

  const openDeleteDialog = (
    messageId: Id<"messages">,
    forEveryone: boolean
  ) => {
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
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <>
      <MessageScrollerProvider
        autoScroll
        defaultScrollPosition="end"
        key={`${currentUserId}-${otherUserId}`}
      >
        <MessageScroller className="flex-1 min-h-0">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-3 p-4" aria-label="Messages">
              {messages.length === 0 ? (
                <MessageScrollerItem>
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </div>
                </MessageScrollerItem>
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
                  const previousMessage =
                    index > 0 ? messages[index - 1] : null;
                  const showDateDivider =
                    !previousMessage ||
                    !isSameDay(
                      currentDate,
                      new Date(previousMessage.createdAt)
                    );

                  const reactionCounts = EMOJI_REACTIONS.map((emoji) => ({
                    emoji,
                    count:
                      message.reactions?.filter((r) => r.emoji === emoji)
                        .length || 0,
                  })).filter((r) => r.count > 0);

                  return (
                    <React.Fragment key={message._id}>
                      {showDateDivider && (
                        <MessageScrollerItem messageId={`date-${message._id}`}>
                          <Marker variant="separator">
                            <MarkerContent className="text-xs px-2">
                              {format(currentDate, "EEEE, MMM d")}
                            </MarkerContent>
                          </Marker>
                        </MessageScrollerItem>
                      )}

                      <MessageScrollerItem
                        messageId={message._id}
                        scrollAnchor={isCurrentUser}
                      >
                        <Message align={isCurrentUser ? "end" : "start"}>
                          {!isCurrentUser && (
                            <MessageAvatar>
                              <ProfileAvatar
                                profilePicture={otherUser?.profilePicture}
                                alt={otherUser?.name}
                                className="h-8 w-8"
                                fallback={otherUser?.name?.charAt(0) || "U"}
                              />
                            </MessageAvatar>
                          )}

                          <MessageContent>
                            <div className="relative group/message-actions">
                              <Bubble
                                variant={isCurrentUser ? "default" : "muted"}
                                align={isCurrentUser ? "end" : "start"}
                              >
                                <BubbleContent>
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
                                        {replyToMessage.fromUserId ===
                                        currentUserId
                                          ? "You"
                                          : (otherUser?.name ?? "Unknown")}
                                      </span>
                                      <p className="truncate max-w-[200px]">
                                        {replyToMessage.content.slice(0, 80)}
                                        {replyToMessage.content.length > 80
                                          ? "…"
                                          : ""}
                                      </p>
                                    </div>
                                  )}
                                  {message.content}
                                  {message.editedAt && (
                                    <span className="text-xs opacity-70 ml-2">
                                      (edited)
                                    </span>
                                  )}
                                </BubbleContent>

                                {reactionCounts.length > 0 && (
                                  <BubbleReactions
                                    side="bottom"
                                    align={isCurrentUser ? "end" : "start"}
                                  >
                                    {reactionCounts.map(({ emoji, count }) => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        className={cn(
                                          "inline-flex h-6 items-center gap-1 rounded-full px-1.5 text-xs hover:bg-background/80",
                                          userReaction?.emoji === emoji &&
                                            "ring-1 ring-primary"
                                        )}
                                        onClick={() =>
                                          handleReaction(message._id, emoji)
                                        }
                                        aria-label={`Toggle ${emoji} reaction`}
                                      >
                                        {emoji} {count}
                                      </button>
                                    ))}
                                  </BubbleReactions>
                                )}
                              </Bubble>

                              <div
                                className={cn(
                                  "absolute top-0 opacity-0 group-hover/message-actions:opacity-100 transition-opacity",
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
                                        onReplyMessage?.(
                                          message._id,
                                          message.content,
                                          message.fromUserId
                                        )
                                      }
                                    >
                                      <Reply className="mr-2 h-4 w-4" />
                                      Reply
                                    </DropdownMenuItem>
                                    {isCurrentUser && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            onEditMessage?.(
                                              message._id,
                                              message.content
                                            )
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
                                      onClick={() =>
                                        openDeleteDialog(message._id, false)
                                      }
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete for me
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            <MessageFooter className="gap-2 flex-wrap">
                              <span>
                                {formatDistanceToNow(
                                  new Date(message.createdAt),
                                  { addSuffix: true }
                                )}
                              </span>
                              {isLastOutgoing && (
                                <span>
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
                                    className="h-6 w-6 p-0 opacity-0 group-hover/message:opacity-100 transition-opacity"
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
                            </MessageFooter>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    </React.Fragment>
                  );
                })
              )}

              {isTyping && (
                <MessageScrollerItem messageId="typing">
                  <Message align="start">
                    <MessageAvatar>
                      <ProfileAvatar
                        profilePicture={otherUser?.profilePicture}
                        alt={otherUser?.name}
                        className="h-6 w-6"
                        fallback={otherUser?.name?.charAt(0) || "U"}
                      />
                    </MessageAvatar>
                    <MessageContent>
                      <p className="shimmer text-sm text-muted-foreground px-1">
                        {otherUser?.name} is typing…
                      </p>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
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
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
