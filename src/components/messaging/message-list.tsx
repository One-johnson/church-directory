"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { formatDistanceToNow } from "date-fns";
import { Smile, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

interface MessageListProps {
  currentUserId: Id<"users">;
  otherUserId: Id<"users">;
  otherUser: any;
  onEditMessage?: (messageId: Id<"messages">, content: string) => void;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function MessageList({ currentUserId, otherUserId, otherUser, onEditMessage }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; messageId: Id<"messages"> | null; forEveryone: boolean }>({
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  if (!messages) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.fromUserId === currentUserId;
            const userReaction = message.reactions?.find(
              (r) => r.userId === currentUserId
            );

            return (
              <div
                key={message._id}
                className={cn(
                  "flex gap-2 group",
                  isCurrentUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={otherUser?.profilePicture} />
                    <AvatarFallback>
                      {otherUser?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={cn("flex flex-col gap-1", isCurrentUser ? "items-end" : "items-start")}>
                  <div className="relative group/message">
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg px-4 py-2",
                        isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {message.content}
                      {message.editedAt && (
                        <span className="text-xs opacity-70 ml-2">(edited)</span>
                      )}
                      
                      {message.attachmentUrl && (
                        <img
                          src={message.attachmentUrl}
                          alt="Attachment"
                          className="mt-2 rounded-md max-w-full"
                        />
                      )}
                    </div>

                    {/* Message Actions Dropdown */}
                    <div className={cn(
                      "absolute top-0 opacity-0 group-hover/message:opacity-100 transition-opacity",
                      isCurrentUser ? "-left-8" : "-right-8"
                    )}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                          {isCurrentUser && (
                            <>
                              <DropdownMenuItem
                                onClick={() => onEditMessage?.(message._id, message.content)}
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(message._id, true)}
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

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                      })}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                              onClick={() => handleReaction(message._id, emoji)}
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
                        const count = message.reactions?.filter(
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
                            onClick={() => handleReaction(message._id, emoji)}
                          >
                            {emoji} {count}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex gap-2 items-center text-sm text-muted-foreground">
            <Avatar className="h-6 w-6">
              <AvatarImage src={otherUser?.profilePicture} />
              <AvatarFallback>
                {otherUser?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span>{otherUser?.name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
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
