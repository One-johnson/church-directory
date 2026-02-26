"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

export interface ReplyingTo {
  id: Id<"messages">;
  content: string;
  fromUserId: Id<"users">;
  fromUserName?: string;
}

interface MessageInputProps {
  fromUserId: Id<"users">;
  toUserId: Id<"users">;
  onMessageSent?: () => void;
  editingMessage?: { id: Id<"messages">; content: string } | null;
  onCancelEdit?: () => void;
  replyingTo?: ReplyingTo | null;
  onClearReply?: () => void;
}

export function MessageInput({
  fromUserId,
  toUserId,
  onMessageSent,
  editingMessage,
  onCancelEdit,
  replyingTo,
  onClearReply,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = useMutation(api.messages.send);
  const editMessage = useMutation(api.messages.editMessage);
  const setTyping = useMutation(api.messages.setTyping);

  // Set content when editing
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content && !editingMessage) {
        setTyping({
          userId: fromUserId,
          conversationWith: toUserId,
          isTyping: true,
        });
      } else {
        setTyping({
          userId: fromUserId,
          conversationWith: toUserId,
          isTyping: false,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [content, fromUserId, toUserId, setTyping, editingMessage]);

  const handleSend = async () => {
    if (editingMessage) {
      // Edit existing message
      if (!content.trim()) {
        toast.error("Message cannot be empty");
        return;
      }

      setIsSending(true);
      try {
        await editMessage({
          messageId: editingMessage.id,
          userId: fromUserId,
          newContent: content.trim(),
        });
        setContent("");
        if (onCancelEdit) onCancelEdit();
        toast.success("Message updated");
      } catch (error) {
        console.error("Error editing message:", error);
        toast.error("Failed to edit message");
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Send new message
    if (!content.trim() || isSending) return;

    setIsSending(true);

    try {
      await sendMessage({
        fromUserId,
        toUserId,
        content: content.trim(),
        replyToMessageId: replyingTo?.id,
      });

      setContent("");
      if (replyingTo && onClearReply) onClearReply();
      setTyping({
        userId: fromUserId,
        conversationWith: toUserId,
        isTyping: false,
      });

      if (onMessageSent) {
        onMessageSent();
      }

      toast.success("Message sent");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCancelEdit = () => {
    setContent("");
    if (onCancelEdit) onCancelEdit();
  };

  return (
    <div className="border-t p-4 space-y-2">
      {editingMessage && (
        <div className="flex items-center justify-between bg-muted p-2 rounded text-sm">
          <span className="text-muted-foreground">Editing message</span>
          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
            Cancel
          </Button>
        </div>
      )}

      {replyingTo && !editingMessage && (
        <div className="flex items-center justify-between bg-muted/80 p-2 rounded text-sm gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground">Replying to </span>
            <span className="font-medium">
              {replyingTo.fromUserId === fromUserId ? "yourself" : replyingTo.fromUserName ?? "message"}
            </span>
            <p className="truncate text-xs text-muted-foreground mt-0.5">
              {replyingTo.content.slice(0, 60)}
              {replyingTo.content.length > 60 ? "…" : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onClearReply}
            aria-label="Cancel reply"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[60px] flex-1 resize-none"
          disabled={isSending}
        />

        <Button
          onClick={handleSend}
          disabled={!content.trim() || isSending}
          size="icon"
          aria-label={editingMessage ? "Save edited message" : "Send message"}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        Press Enter to send, Shift + Enter for new line
      </div>
    </div>
  );
}
