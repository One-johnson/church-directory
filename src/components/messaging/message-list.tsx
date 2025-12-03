"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Smile } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface MessageListProps {
  currentUserId: Id<"users">;
  otherUserId: Id<"users">;
  otherUser: any;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function MessageList({
  currentUserId,
  otherUserId,
  otherUser,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  if (!messages) {
    return (
      <div className="flex-1 flex items-center justify-center">Loading...</div>
    );
  }

  return (
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

              <div
                className={cn(
                  "flex flex-col gap-1",
                  isCurrentUser ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-4 py-2",
                    isCurrentUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.content}

                  {message.attachmentUrl && (
                    <img
                      src={message.attachmentUrl}
                      alt="Attachment"
                      className="mt-2 rounded-md max-w-full"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                  </span>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Smile className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {EMOJI_REACTIONS.map((emoji) => {
                      const count =
                        message.reactions?.filter((r) => r.emoji === emoji)
                          .length || 0;

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
            <AvatarFallback>{otherUser?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <span>{otherUser?.name} is typing...</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
