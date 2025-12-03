"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

interface MessageInputProps {
  fromUserId: Id<"users">;
  toUserId: Id<"users">;
  onMessageSent?: () => void;
}

export function MessageInput({
  fromUserId,
  toUserId,
  onMessageSent,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = useMutation(api.messages.send);
  const setTyping = useMutation(api.messages.setTyping);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content) {
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
  }, [content, fromUserId, toUserId, setTyping]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setAttachment(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if ((!content.trim() && !attachment) || isSending) return;

    setIsSending(true);

    try {
      let attachmentUrl: string | undefined;
      let attachmentType: string | undefined;

      if (attachment) {
        setIsUploading(true);
        const url = uploadImage(attachment);
        if (typeof url === "string") {
          attachmentUrl = url;
        } else {
          throw new Error("uploadImage did not return a URL string");
        }
        attachmentType = attachment.type;
        setIsUploading(false);
      }

      await sendMessage({
        fromUserId,
        toUserId,
        content: content.trim() || "(Attachment)",
        attachmentUrl,
        attachmentType,
      });

      setContent("");
      handleRemoveAttachment();
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

  return (
    <div className="border-t p-4 space-y-2">
      {attachmentPreview && (
        <div className="relative inline-block">
          <img
            src={attachmentPreview}
            alt="Preview"
            className="h-20 rounded-md"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemoveAttachment}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isSending}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[60px] flex-1 resize-none"
          disabled={isUploading || isSending}
        />

        <Button
          onClick={handleSend}
          disabled={
            (!content.trim() && !attachment) || isUploading || isSending
          }
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        Press Enter to send, Shift + Enter for new line
      </div>
    </div>
  );
}
function uploadImage(attachment: File) {
  throw new Error("Function not implemented.");
}

