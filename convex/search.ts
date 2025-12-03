import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const searchProfiles = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    country: v.optional(v.string()),
    verifiedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get all ever-approved profiles
    let profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("everApproved"), true))
      .collect();

    // Apply text search filter
    if (args.query && args.query.length >= 2) {
      const lowerQuery = args.query.toLowerCase();
      profiles = profiles.filter((profile) => {
        const searchableText = [
          profile.name,
          profile.profession,
          profile.skills,
          profile.category,
          profile.location,
          profile.country,
        ].join(" ").toLowerCase();
        
        return searchableText.includes(lowerQuery);
      });
    }

    // Apply category filter - exact match required
    if (args.category) {
      profiles = profiles.filter((profile) => 
        profile.category === args.category
      );
    }

    // Apply location filter
    if (args.location) {
      const lowerLocation = args.location.toLowerCase();
      profiles = profiles.filter((profile) => 
        profile.location.toLowerCase().includes(lowerLocation)
      );
    }

    // Apply country filter
    if (args.country) {
      const lowerCountry = args.country.toLowerCase();
      profiles = profiles.filter((profile) => 
        profile.country.toLowerCase().includes(lowerCountry)
      );
    }

    // Apply verified filter
    if (args.verifiedOnly) {
      profiles = profiles.filter((profile) => 
        profile.emailVerified || 
        profile.phoneVerified || 
        profile.pastorEndorsed || 
        profile.backgroundCheck
      );
    }

    // Get user details for each profile
    const profilesWithUsers = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return { ...profile, user };
      })
    );

    return profilesWithUsers.slice(0, 50);
  },
});

export const saveSearchHistory = mutation({
  args: {
    userId: v.id("users"),
    query: v.string(),
    filters: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Don't save empty searches
    if (!args.query || args.query.trim().length === 0) return;

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

    await Promise.all(
      history.map((entry) => ctx.db.delete(entry._id))
    );
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
      .filter((q) => q.eq(q.field("everApproved"), true))
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
