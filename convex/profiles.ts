import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create profile
export const createProfile = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingProfile) {
      throw new Error("Profile already exists for this user");
    }

    const profileId = await ctx.db.insert("profiles", {
      userId: args.userId,
      name: args.name,
      skills: args.skills,
      profession: args.profession,
      category: args.category,
      experience: args.experience,
      servicesOffered: args.servicesOffered,
      location: args.location,
      profilePicture: args.profilePicture,
      country: args.country,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Notify admins and pastors
    const adminsAndPastors = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(q.eq(q.field("role"), "admin"), q.eq(q.field("role"), "pastor"))
      )
      .collect();

    for (const admin of adminsAndPastors) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        title: "New Profile Pending Approval",
        message: `${args.name} has submitted a professional profile for review`,
        type: "pending_approval",
        read: false,
        metadata: { profileId },
        createdAt: Date.now(),
      });
    }

    return profileId;
  },
});

// Update profile
export const updateProfile = mutation({
  args: {
    profileId: v.id("profiles"),
    name: v.string(),
    skills: v.string(),
    profession: v.string(),
    category: v.string(),
    experience: v.string(),
    servicesOffered: v.string(),
    location: v.string(),
    profilePicture: v.optional(v.string()),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const { profileId, ...updates } = args;

    await ctx.db.patch(profileId, {
      ...updates,
      updatedAt: Date.now(),
      status: "pending", // Reset to pending on update
    });

    return { message: "Profile updated successfully" };
  },
});

// Get user profile
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return profile;
  },
});

// Get all approved profiles
export const getApprovedProfiles = query({
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    return profiles;
  },
});

// Get pending profiles (Pastor/Admin)
export const getPendingProfiles = query({
  args: { requesterId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify requester is pastor or admin
    const requester = await ctx.db.get(args.requesterId);
    if (
      !requester ||
      (requester.role !== "pastor" && requester.role !== "admin")
    ) {
      throw new Error("Unauthorized: Pastor or Admin access required");
    }

    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Get user details for each profile
    const profilesWithUsers = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          userEmail: user?.email,
        };
      })
    );

    return profilesWithUsers;
  },
});

// Approve profile
export const approveProfile = mutation({
  args: {
    requesterId: v.id("users"),
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    // Verify requester is pastor or admin
    const requester = await ctx.db.get(args.requesterId);
    if (
      !requester ||
      (requester.role !== "pastor" && requester.role !== "admin")
    ) {
      throw new Error("Unauthorized: Pastor or Admin access required");
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(args.profileId, {
      status: "approved",
      rejectionReason: undefined,
      updatedAt: Date.now(),
    });

    // Notify user
    await ctx.db.insert("notifications", {
      userId: profile.userId,
      title: "Profile Approved",
      message:
        "Your professional profile has been approved and is now visible in the directory",
      type: "profile_approved",
      read: false,
      metadata: { profileId: args.profileId },
      createdAt: Date.now(),
    });

    return { message: "Profile approved successfully" };
  },
});

// Reject profile
export const rejectProfile = mutation({
  args: {
    requesterId: v.id("users"),
    profileId: v.id("profiles"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify requester is pastor or admin
    const requester = await ctx.db.get(args.requesterId);
    if (
      !requester ||
      (requester.role !== "pastor" && requester.role !== "admin")
    ) {
      throw new Error("Unauthorized: Pastor or Admin access required");
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(args.profileId, {
      status: "rejected",
      rejectionReason: args.reason,
      updatedAt: Date.now(),
    });

    // Notify user
    await ctx.db.insert("notifications", {
      userId: profile.userId,
      title: "Profile Rejected",
      message: args.reason || "Your professional profile was not approved",
      type: "profile_rejected",
      read: false,
      metadata: { profileId: args.profileId },
      createdAt: Date.now(),
    });

    return { message: "Profile rejected" };
  },
});

// Bulk approve profiles
export const bulkApproveProfiles = mutation({
  args: {
    requesterId: v.id("users"),
    profileIds: v.array(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    // Verify requester is pastor or admin
    const requester = await ctx.db.get(args.requesterId);
    if (
      !requester ||
      (requester.role !== "pastor" && requester.role !== "admin")
    ) {
      throw new Error("Unauthorized: Pastor or Admin access required");
    }

    const results = await Promise.all(
      args.profileIds.map(async (profileId) => {
        try {
          const profile = await ctx.db.get(profileId);
          if (!profile)
            return { profileId, success: false, error: "Not found" };

          await ctx.db.patch(profileId, {
            status: "approved",
            rejectionReason: undefined,
            updatedAt: Date.now(),
          });

          // Notify user
          await ctx.db.insert("notifications", {
            userId: profile.userId,
            title: "Profile Approved",
            message:
              "Your professional profile has been approved and is now visible in the directory",
            type: "profile_approved",
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

// Bulk reject profiles
export const bulkRejectProfiles = mutation({
  args: {
    requesterId: v.id("users"),
    profileIds: v.array(v.id("profiles")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify requester is pastor or admin
    const requester = await ctx.db.get(args.requesterId);
    if (
      !requester ||
      (requester.role !== "pastor" && requester.role !== "admin")
    ) {
      throw new Error("Unauthorized: Pastor or Admin access required");
    }

    const results = await Promise.all(
      args.profileIds.map(async (profileId) => {
        try {
          const profile = await ctx.db.get(profileId);
          if (!profile)
            return { profileId, success: false, error: "Not found" };

          await ctx.db.patch(profileId, {
            status: "rejected",
            rejectionReason: args.reason,
            updatedAt: Date.now(),
          });

          // Notify user
          await ctx.db.insert("notifications", {
            userId: profile.userId,
            title: "Profile Rejected",
            message:
              args.reason || "Your professional profile was not approved",
            type: "profile_rejected",
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
