import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdFromSession } from "./session";

// Generate upload URL for file storage (requires valid session)
export const generateUploadUrl = mutation({
  args: { sessionId: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSession(ctx, args.sessionId);
    if (userId === null) throw new Error("Unauthorized: must be logged in to upload");
    return await ctx.storage.generateUploadUrl();
  },
});

// Get file URL from storage ID (for display; no auth required for viewing)
export const getUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Query to resolve storage ID to URL (for reactive display in UI)
export const getDisplayUrl = query({
  args: { storageId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.storageId) return null;
    return await ctx.storage.getUrl(args.storageId);
  },
});
