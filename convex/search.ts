import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Search profiles with flexible filters
export const searchProfiles = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    country: v.optional(v.string()),
    verifiedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("everApproved"), true))
      .collect();

    // Apply text search if query provided
    if (args.query && args.query.length >= 2) {
      const lowerQuery = args.query.toLowerCase();
      profiles = profiles.filter((p) => {
        const searchableText = `${p.name} ${p.profession} ${p.skills} ${p.category} ${p.experience}`.toLowerCase();
        return searchableText.includes(lowerQuery);
      });
    }

    // Apply filters
    if (args.category) {
      profiles = profiles.filter((p) => p.category === args.category);
    }

    if (args.location) {
      profiles = profiles.filter((p) =>
        p.location.toLowerCase().includes(args.location!.toLowerCase())
      );
    }

    if (args.country) {
      profiles = profiles.filter((p) => p.country === args.country);
    }

    if (args.verifiedOnly) {
      profiles = profiles.filter(
        (p) =>
          p.emailVerified ||
          p.phoneVerified ||
          p.pastorEndorsed ||
          p.backgroundCheck
      );
    }

    // Get user data for each profile (for online status)
    const profilesWithUsers = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          user: user
            ? {
                isOnline: user.isOnline,
                denomination: user.denomination,
                denominationName: user.denominationName,
                branch: user.branch,
                branchName: user.branchName,
                branchLocation: user.branchLocation,
                pastor: user.pastor,
                pastorEmail: user.pastorEmail,
              }
            : null,
        };
      })
    );

    return profilesWithUsers;
  },
});

// Get search suggestions based on existing profiles
export const getSearchSuggestions = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const lowerQuery = args.query.toLowerCase();

    const profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("everApproved"), true))
      .collect();

    const suggestions = new Set<string>();

    profiles.forEach((p) => {
      // Add profession if it matches
      if (p.profession.toLowerCase().includes(lowerQuery)) {
        suggestions.add(p.profession);
      }

      // Add skills that match (split by comma)
      const skills = p.skills.split(",").map((s) => s.trim());
      skills.forEach((skill) => {
        if (skill.toLowerCase().includes(lowerQuery) && skill.length > 2) {
          suggestions.add(skill);
        }
      });

      // Add category if it matches
      if (p.category.toLowerCase().includes(lowerQuery)) {
        suggestions.add(p.category);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  },
});

// Save search to history
export const saveSearchHistory = mutation({
  args: {
    userId: v.id("users"),
    query: v.string(),
    filters: v.any(),
  },
  handler: async (ctx, args) => {
    // Check if this exact query already exists in recent history
    const existing = await ctx.db
      .query("searchHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("query"), args.query))
      .first();

    if (existing) {
      // Update timestamp
      await ctx.db.patch(existing._id, {
        timestamp: Date.now(),
        filters: args.filters,
      });
    } else {
      // Create new entry
      await ctx.db.insert("searchHistory", {
        userId: args.userId,
        query: args.query,
        filters: args.filters,
        timestamp: Date.now(),
      });
    }

    // Keep only last 10 searches
    const allHistory = await ctx.db
      .query("searchHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    if (allHistory.length > 10) {
      const toDelete = allHistory.slice(10);
      await Promise.all(toDelete.map((h) => ctx.db.delete(h._id)));
    }
  },
});

// Get search history
export const getSearchHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("searchHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit);

    return history;
  },
});

// Clear search history
export const clearSearchHistory = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("searchHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    await Promise.all(history.map((h) => ctx.db.delete(h._id)));
  },
});

// Get all unique locations from approved profiles
export const getAllLocations = query({
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("everApproved"), true))
      .collect();

    const locations = new Set<string>();
    profiles.forEach((p) => {
      if (p.location && p.location.trim().length > 0) {
        locations.add(p.location.trim());
      }
    });

    return Array.from(locations).sort();
  },
});

// Get all unique countries from approved profiles
export const getAllCountries = query({
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("everApproved"), true))
      .collect();

    const countries = new Set<string>();
    profiles.forEach((p) => {
      if (p.country && p.country.trim().length > 0) {
        countries.add(p.country.trim());
      }
    });

    return Array.from(countries).sort();
  },
});
