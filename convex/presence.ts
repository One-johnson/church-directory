import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const updatePresence = mutation({
  args: {
    userId: v.id("users"),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isOnline: args.isOnline,
      lastSeen: Date.now(),
    });
  },
});

export const getUserPresence = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) return { isOnline: false, lastSeen: null };

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const isOnline =
      user.isOnline && user.lastSeen && user.lastSeen > fiveMinutesAgo;

    return {
      isOnline: isOnline || false,
      lastSeen: user.lastSeen || null,
    };
  },
});

export const cleanupStalePresence = mutation({
  args: {},
  handler: async (ctx) => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    const users = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("isOnline"), true),
          q.lt(q.field("lastSeen"), tenMinutesAgo)
        )
      )
      .collect();

    await Promise.all(
      users.map((user) => ctx.db.patch(user._id, { isOnline: false }))
    );

    return users.length;
  },
});
