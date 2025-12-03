"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

interface MessageInputProps {
  fromUserId: Id<"users">;
  toUserId: Id<"users">;
  onMessageSent?: () => void;
  editingMessage?: { id: Id<"messages">; content: string } | null;
  onCancelEdit?: () => void;
}

export function MessageInput({ 
  fromUserId, 
  toUserId, 
  onMessageSent,
  editingMessage,
  onCancelEdit,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = useMutation(api.messages.send);
  const editMessage = useMutation(api.messages.editMessage);
  const setTyping = useMutation(api.messages.setTyping);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUrl = useMutation(api.files.getUrl);

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
        setTyping({ userId: fromUserId, conversationWith: toUserId, isTyping: true });
      } else {
        setTyping({ userId: fromUserId, conversationWith: toUserId, isTyping: false });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [content, fromUserId, toUserId, setTyping, editingMessage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported");
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
    if ((!content.trim() && !attachment) || isSending) return;

    setIsSending(true);

    try {
      let attachmentUrl: string | undefined;
      let attachmentType: string | undefined;

      if (attachment) {
        setIsUploading(true);
        
        // Upload to Convex storage
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": attachment.type },
          body: attachment,
        });
        
        const { storageId } = await result.json();
        const fileUrl = await getUrl({ storageId });
        
        if (fileUrl) {
          attachmentUrl = fileUrl;
          attachmentType = attachment.type;
        }
        
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
      setTyping({ userId: fromUserId, conversationWith: toUserId, isTyping: false });
      
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelEdit}
          >
            Cancel
          </Button>
        </div>
      )}

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
        {!editingMessage && (
          <>
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
          </>
        )}

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
          disabled={(!content.trim() && !attachment) || isUploading || isSending}
          size="icon"
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
