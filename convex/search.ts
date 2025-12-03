import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const searchProfiles = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("profiles")
      .withSearchIndex("search_profiles", (q) => {
        let search = q.search("skills", args.query);

        if (args.category) {
          search = search.eq("category", args.category);
        }
        if (args.location) {
          search = search.eq("location", args.location);
        }
        if (args.country) {
          search = search.eq("country", args.country);
        }

        return search.eq("status", "approved");
      })
      .take(50);

    const profilesWithUsers = await Promise.all(
      results.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return { ...profile, user };
      })
    );

    return profilesWithUsers;
  },
});

export const saveSearchHistory = mutation({
  args: {
    userId: v.id("users"),
    query: v.string(),
    filters: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("searchHistory", {
      userId: args.userId,
      query: args.query,
      filters: args.filters,
      timestamp: Date.now(),
    });
  },
});

export const getSearchHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const history = await ctx.db
      .query("searchHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return history;
  },
});

export const clearSearchHistory = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("searchHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    await Promise.all(history.map((entry) => ctx.db.delete(entry._id)));
  },
});

export const getSearchSuggestions = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.query || args.query.length < 2) {
      return [];
    }

    const profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    const suggestions = new Set<string>();

    profiles.forEach((profile) => {
      const fields = [
        profile.profession,
        profile.skills,
        profile.category,
        profile.location,
      ];

      fields.forEach((field) => {
        const lowerField = field.toLowerCase();
        const lowerQuery = args.query.toLowerCase();

        if (lowerField.includes(lowerQuery)) {
          suggestions.add(field);
        }
      });
    });

    return Array.from(suggestions).slice(0, 10);
  },
});
