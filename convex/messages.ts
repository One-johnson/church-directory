import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    content: v.string(),
    attachmentUrl: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      content: args.content,
      read: false,
      createdAt: Date.now(),
      attachmentUrl: args.attachmentUrl,
      attachmentType: args.attachmentType,
      reactions: [],
      deletedFor: [],
      deletedForEveryone: false,
    });

    await ctx.db.insert("notifications", {
      userId: args.toUserId,
      title: "New Message",
      message: "You have received a new message",
      type: "new_message",
      read: false,
      metadata: { messageId, fromUserId: args.fromUserId },
      createdAt: Date.now(),
    });

    return messageId;
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    
    // Only sender can edit
    if (message.fromUserId !== args.userId) {
      throw new Error("Unauthorized: You can only edit your own messages");
    }

    await ctx.db.patch(args.messageId, {
      content: args.newContent,
      editedAt: Date.now(),
    });
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    forEveryone: v.boolean(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    if (args.forEveryone) {
      // Only sender can delete for everyone
      if (message.fromUserId !== args.userId) {
        throw new Error("Unauthorized: You can only delete your own messages for everyone");
      }
      await ctx.db.patch(args.messageId, { deletedForEveryone: true });
    } else {
      // Delete for self only
      const deletedFor = message.deletedFor || [];
      if (!deletedFor.includes(args.userId)) {
        deletedFor.push(args.userId);
      }
      await ctx.db.patch(args.messageId, { deletedFor });
    }
  },
});

export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const reactions = message.reactions || [];
    const existingReaction = reactions.find((r) => r.userId === args.userId);

    if (existingReaction) {
      existingReaction.emoji = args.emoji;
    } else {
      reactions.push({ userId: args.userId, emoji: args.emoji });
    }

    await ctx.db.patch(args.messageId, { reactions });
  },
});

export const removeReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const reactions = (message.reactions || []).filter((r) => r.userId !== args.userId);
    await ctx.db.patch(args.messageId, { reactions });
  },
});

export const setTyping = mutation({
  args: {
    userId: v.id("users"),
    conversationWith: v.id("users"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationWith", args.conversationWith)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("typingIndicators", {
        userId: args.userId,
        conversationWith: args.conversationWith,
        isTyping: args.isTyping,
        lastUpdated: Date.now(),
      });
    }
  },
});

export const getTypingStatus = query({
  args: {
    userId: v.id("users"),
    conversationWith: v.id("users"),
  },
  handler: async (ctx, args) => {
    const typing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("userId", args.conversationWith).eq("conversationWith", args.userId)
      )
      .first();

    const isRecentlyTyping = typing && 
      typing.isTyping && 
      Date.now() - typing.lastUpdated < 5000;

    return isRecentlyTyping;
  },
});

export const getConversation = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages1 = await ctx.db
      .query("messages")
      .withIndex("by_participants", (q) =>
        q.eq("fromUserId", args.userId1).eq("toUserId", args.userId2)
      )
      .collect();

    const messages2 = await ctx.db
      .query("messages")
      .withIndex("by_participants", (q) =>
        q.eq("fromUserId", args.userId2).eq("toUserId", args.userId1)
      )
      .collect();

    const allMessages = [...messages1, ...messages2]
      .filter((msg) => {
        // Filter out messages deleted for everyone
        if (msg.deletedForEveryone) return false;
        // Filter out messages deleted for this user
        if (msg.deletedFor?.includes(args.userId1)) return false;
        return true;
      })
      .sort((a, b) => a.createdAt - b.createdAt);

    return allMessages;
  },
});

export const getInbox = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const received = await ctx.db
      .query("messages")
      .withIndex("by_to", (q) => q.eq("toUserId", args.userId))
      .collect();

    const sent = await ctx.db
      .query("messages")
      .withIndex("by_from", (q) => q.eq("fromUserId", args.userId))
      .collect();

    const allMessages = [...received, ...sent].filter((msg) => {
      // Filter out messages deleted for everyone
      if (msg.deletedForEveryone) return false;
      // Filter out messages deleted for this user
      if (msg.deletedFor?.includes(args.userId)) return false;
      return true;
    });

    const conversationsMap = new Map<string, typeof allMessages>();

    for (const msg of allMessages) {
      const otherUserId =
        msg.fromUserId === args.userId ? msg.toUserId : msg.fromUserId;

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, []);
      }
      conversationsMap.get(otherUserId)?.push(msg);
    }

    const conversations = await Promise.all(
      Array.from(conversationsMap.entries()).map(async ([otherUserId, msgs]) => {
        const otherUser = await ctx.db.get(otherUserId as any);
        const sortedMsgs = msgs.sort((a, b) => b.createdAt - a.createdAt);
        const lastMessage = sortedMsgs[0];
        const unreadCount = msgs.filter(
          (m) => m.toUserId === args.userId && !m.read
        ).length;

        // Get profile for profile picture
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", otherUserId as any))
          .first();

        return {
          otherUser: {
            ...otherUser,
            profilePicture: profile?.profilePicture,
          },
          lastMessage,
          unreadCount,
          messages: sortedMsgs,
        };
      })
    );

    return conversations.sort(
      (a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt
    );
  },
});

export const markAsRead = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { read: true });
  },
});

export const markConversationAsRead = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_participants", (q) =>
        q.eq("fromUserId", args.fromUserId).eq("toUserId", args.toUserId)
      )
      .collect();

    await Promise.all(
      messages
        .filter((m) => !m.read)
        .map((m) => ctx.db.patch(m._id, { read: true }))
    );
  },
});
