import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Update verification badges
export const updateVerificationBadges = mutation({
  args: {
    requesterId: v.id("users"),
    profileId: v.id("profiles"),
    emailVerified: v.optional(v.boolean()),
    phoneVerified: v.optional(v.boolean()),
    pastorEndorsed: v.optional(v.boolean()),
    backgroundCheck: v.optional(v.boolean()),
    verificationNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify requester is pastor or admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || (requester.role !== "admin")) {
      throw new Error("Unauthorized: Admin access required");
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.emailVerified !== undefined) {
      updates.emailVerified = args.emailVerified;
    }
    if (args.phoneVerified !== undefined) {
      updates.phoneVerified = args.phoneVerified;
    }
    if (args.pastorEndorsed !== undefined) {
      updates.pastorEndorsed = args.pastorEndorsed;
    }
    if (args.backgroundCheck !== undefined) {
      updates.backgroundCheck = args.backgroundCheck;
    }
    if (args.verificationNotes !== undefined) {
      updates.verificationNotes = args.verificationNotes;
    }

    // Check if any verification was added
    const hasNewVerification = 
      (args.emailVerified && !profile.emailVerified) ||
      (args.phoneVerified && !profile.phoneVerified) ||
      (args.pastorEndorsed && !profile.pastorEndorsed) ||
      (args.backgroundCheck && !profile.backgroundCheck);

    if (hasNewVerification) {
      updates.verifiedAt = Date.now();
      updates.verifiedBy = args.requesterId;
    }

    await ctx.db.patch(args.profileId, updates);

    // Notify user
    await ctx.db.insert("notifications", {
      userId: profile.userId,
      title: "Profile Verification Updated",
      message: "Your profile verification badges have been updated",
      type: "system",
      read: false,
      metadata: { profileId: args.profileId },
      createdAt: Date.now(),
    });

    return { message: "Verification badges updated successfully" };
  },
});

// Bulk update verifications
export const bulkUpdateVerifications = mutation({
  args: {
    requesterId: v.id("users"),
    profileIds: v.array(v.id("profiles")),
    emailVerified: v.optional(v.boolean()),
    phoneVerified: v.optional(v.boolean()),
    pastorEndorsed: v.optional(v.boolean()),
    backgroundCheck: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify requester is pastor or admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || (requester.role !== "admin")) {
      throw new Error("Unauthorized: Admin access required");
    }

    const results = await Promise.all(
      args.profileIds.map(async (profileId) => {
        try {
          const profile = await ctx.db.get(profileId);
          if (!profile) return { profileId, success: false, error: "Not found" };

          const updates: any = {
            updatedAt: Date.now(),
            verifiedAt: Date.now(),
            verifiedBy: args.requesterId,
          };

          if (args.emailVerified !== undefined) {
            updates.emailVerified = args.emailVerified;
          }
          if (args.phoneVerified !== undefined) {
            updates.phoneVerified = args.phoneVerified;
          }
          if (args.pastorEndorsed !== undefined) {
            updates.pastorEndorsed = args.pastorEndorsed;
          }
          if (args.backgroundCheck !== undefined) {
            updates.backgroundCheck = args.backgroundCheck;
          }

          await ctx.db.patch(profileId, updates);

          // Notify user
          await ctx.db.insert("notifications", {
            userId: profile.userId,
            title: "Profile Verification Updated",
            message: "Your profile verification badges have been updated",
            type: "system",
            read: false,
            metadata: { profileId },
            createdAt: Date.now(),
          });

          return { profileId, success: true };
        } catch (error) {
          return { profileId, success: false, error: String(error) };
        }
      })
    );

    return results;
  },
});

// Get verification statistics
export const getVerificationStats = query({
  args: { requesterId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify requester is pastor or admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || (requester.role !== "admin")) {
      throw new Error("Unauthorized: Admin access required");
    }

    const allProfiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("everApproved"), true))
      .collect();

    const stats = {
      total: allProfiles.length,
      emailVerified: allProfiles.filter(p => p.emailVerified).length,
      phoneVerified: allProfiles.filter(p => p.phoneVerified).length,
      pastorEndorsed: allProfiles.filter(p => p.pastorEndorsed).length,
      backgroundCheck: allProfiles.filter(p => p.backgroundCheck).length,
      fullyVerified: allProfiles.filter(p => 
        p.emailVerified && p.phoneVerified && p.pastorEndorsed && p.backgroundCheck
      ).length,
    };

    return stats;
  },
});
