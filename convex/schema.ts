import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    phone: v.optional(v.string()),
    passwordHash: v.string(),
    role: v.union(v.literal("admin"), v.literal("pastor"), v.literal("member")),
    name: v.string(),
    emailVerified: v.boolean(),
    createdAt: v.number(),
    lastSeen: v.optional(v.number()),
    isOnline: v.optional(v.boolean()),
  }).index("by_email", ["email"]),

  profiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    skills: v.string(),
    profession: v.string(),
    category: v.string(),
    experience: v.string(),
    servicesOffered: v.string(),
    location: v.string(),
    profilePicture: v.optional(v.string()),
    country: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    everApproved: v.optional(v.boolean()), // Track if ever approved - once true, always visible
    rejectionReason: v.optional(v.string()),
    // Verification badges
    emailVerified: v.optional(v.boolean()),
    phoneVerified: v.optional(v.boolean()),
    pastorEndorsed: v.optional(v.boolean()),
    backgroundCheck: v.optional(v.boolean()),
    verificationNotes: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_ever_approved", ["everApproved"])
    .searchIndex("search_profiles", {
      searchField: "skills",
      filterFields: ["status", "category", "location", "country", "everApproved"],
    }),

  messages: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    content: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
    attachmentUrl: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
    reactions: v.optional(v.array(v.object({
      userId: v.id("users"),
      emoji: v.string(),
    }))),
    deletedFor: v.optional(v.array(v.id("users"))), // Track who deleted the message
    deletedForEveryone: v.optional(v.boolean()), // True if deleted for everyone
    editedAt: v.optional(v.number()), // Track if message was edited
  })
    .index("by_from", ["fromUserId"])
    .index("by_to", ["toUserId"])
    .index("by_participants", ["fromUserId", "toUserId"]),

  typingIndicators: defineTable({
    userId: v.id("users"),
    conversationWith: v.id("users"),
    isTyping: v.boolean(),
    lastUpdated: v.number(),
  })
    .index("by_conversation", ["userId", "conversationWith"])
    .index("by_updated", ["lastUpdated"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("profile_approved"),
      v.literal("profile_rejected"),
      v.literal("new_message"),
      v.literal("pending_approval"),
      v.literal("role_changed"),
      v.literal("system")
    ),
    read: v.boolean(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),

  searchHistory: defineTable({
    userId: v.id("users"),
    query: v.string(),
    filters: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),
});
