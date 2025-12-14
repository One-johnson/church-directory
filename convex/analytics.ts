import { query } from "./_generated/server";
import { v } from "convex/values";

// Dashboard analytics for all users
export const getDashboardAnalytics = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Get profile info
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Get message counts
    const sentMessages = await ctx.db
      .query("messages")
      .withIndex("by_from", (q) => q.eq("fromUserId", args.userId))
      .collect();

    const receivedMessages = await ctx.db
      .query("messages")
      .withIndex("by_to", (q) => q.eq("toUserId", args.userId))
      .collect();

    const unreadMessages = receivedMessages.filter((m) => !m.read).length;

    // Get notification counts
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("read", false))
      .collect();

    // Get total approved professionals
    const approvedProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    return {
      hasProfile: !!profile,
      profileStatus: profile?.status,
      totalSentMessages: sentMessages.length,
      totalReceivedMessages: receivedMessages.length,
      unreadMessages,
      unreadNotifications: notifications.length,
      totalProfessionals: approvedProfiles.length,
    };
  },
});


export const getVerificationAnalytics = query({
  args: { requesterId: v.id("users") },
  handler: async (ctx, args) => {
    // Ensure only admin or pastor can access
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || (requester.role !== "admin")) {
      throw new Error("Unauthorized: Admin or Pastor access required");
    }

    const profiles = await ctx.db.query("profiles").collect();
    const total = profiles.length;

    // Verification checks (adjust field names if needed)
    const emailVerified = profiles.filter((p) => p.emailVerified === true).length;
    const phoneVerified = profiles.filter((p) => p.phoneVerified === true).length;
    const backgroundCheck = profiles.filter((p) => p.phoneVerified === true).length;
    const pastorEndorsed = profiles.filter((p) => p.status === "approved").length;

    // Fully verified (example condition)
    const fullyVerified = profiles.filter((p) =>
      p.emailVerified &&
      p.phoneVerified &&
      p.status === "approved"
    ).length;

    const pendingVerification = profiles.filter(
      (p) => !p.emailVerified || !p.phoneVerified || p.status === "pending"
    ).length;

    // Percentage of fully verified profiles
    const verificationRate = total > 0
      ? Math.round((fullyVerified / total) * 100)
      : 0;

    // Last 7 days verification trend
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentVerifications = profiles.filter(
      (p) =>
        p.updatedAt >= sevenDaysAgo &&
        p.status === "approved"
    ).length;

    return {
      totalProfiles: total,
      emailVerified,
      phoneVerified,
      pastorEndorsed,
      fullyVerified,
      pendingVerification,
      verificationRate,
      recentVerifications,
      backgroundCheck,
    };
  },
});




// Admin analytics
export const getAdminAnalytics = query({
  args: { requesterId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get all users
    const allUsers = await ctx.db.query("users").collect();
    const totalUsers = allUsers.length;
    const adminCount = allUsers.filter((u) => u.role === "admin").length;
   
    const memberCount = allUsers.filter((u) => u.role === "member").length;

    // Get all profiles
    const allProfiles = await ctx.db.query("profiles").collect();
    const totalProfiles = allProfiles.length;
    const pendingProfiles = allProfiles.filter((p) => p.status === "pending").length;
    const approvedProfiles = allProfiles.filter((p) => p.status === "approved").length;
    const rejectedProfiles = allProfiles.filter((p) => p.status === "rejected").length;

    // Get all messages
    const allMessages = await ctx.db.query("messages").collect();
    const totalMessages = allMessages.length;
    const unreadMessages = allMessages.filter((m) => !m.read).length;

    // Get all notifications
    const allNotifications = await ctx.db.query("notifications").collect();
    const totalNotifications = allNotifications.length;

    // Category distribution
    const categoryMap = new Map<string, number>();
    allProfiles.forEach((profile) => {
      const count = categoryMap.get(profile.category) || 0;
      categoryMap.set(profile.category, count + 1);
    });
    const categoryDistribution = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    }));

    // User growth (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentUsers = allUsers.filter((u) => u.createdAt >= thirtyDaysAgo);
    const userGrowth = recentUsers.length;

    // Profile approval rate
    const approvalRate = totalProfiles > 0 
      ? Math.round((approvedProfiles / totalProfiles) * 100) 
      : 0;

    return {
      totalUsers,
      adminCount,
      memberCount,
      totalProfiles,
      pendingProfiles,
      approvedProfiles,
      rejectedProfiles,
      totalMessages,
      unreadMessages,
      totalNotifications,
      categoryDistribution,
      userGrowth,
      approvalRate,
    };
  },
});

// Profile analytics for pastors/admins
export const getProfileAnalytics = query({
  args: { requesterId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify requester is pastor or admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || (requester.role !== "admin" )) {
      throw new Error("Unauthorized: Pastor or Admin access required");
    }

    const allProfiles = await ctx.db.query("profiles").collect();
    const totalProfiles = allProfiles.length;
    const pendingProfiles = allProfiles.filter((p) => p.status === "pending").length;
    const approvedProfiles = allProfiles.filter((p) => p.status === "approved").length;
    const rejectedProfiles = allProfiles.filter((p) => p.status === "rejected").length;

    // Recent submissions (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSubmissions = allProfiles.filter((p) => p.createdAt >= sevenDaysAgo).length;

    // Average time to approval (for approved profiles)
    const approvedProfilesWithTime = allProfiles.filter(
      (p) => p.status === "approved" && p.updatedAt > p.createdAt
    );
    const avgApprovalTime = approvedProfilesWithTime.length > 0
      ? approvedProfilesWithTime.reduce((sum, p) => sum + (p.updatedAt - p.createdAt), 0) /
        approvedProfilesWithTime.length
      : 0;
    const avgApprovalHours = Math.round(avgApprovalTime / (1000 * 60 * 60));

    // Top locations
    const locationMap = new Map<string, number>();
    allProfiles.forEach((profile) => {
      const location = `${profile.location}, ${profile.country}`;
      const count = locationMap.get(location) || 0;
      locationMap.set(location, count + 1);
    });
    const topLocations = Array.from(locationMap.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top professions
    const professionMap = new Map<string, number>();
    allProfiles.forEach((profile) => {
      const count = professionMap.get(profile.profession) || 0;
      professionMap.set(profile.profession, count + 1);
    });
    const topProfessions = Array.from(professionMap.entries())
      .map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalProfiles,
      pendingProfiles,
      approvedProfiles,
      rejectedProfiles,
      recentSubmissions,
      avgApprovalHours,
      topLocations,
      topProfessions,
    };
  },
});
