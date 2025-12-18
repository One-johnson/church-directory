import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create job seeker request
export const createJobSeekerRequest = mutation({
  args: {
    userId: v.id("users"),
    subject: v.string(),
    description: v.string(),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user details
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const seekerId = await ctx.db.insert("jobSeekerRequests", {
      userId: args.userId,
      seekerName: user.name,
      seekerEmail: user.email,
      subject: args.subject,
      description: args.description,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      status: "pending",
      views: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Notify admins with in-app notifications
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        title: "New Job Seeker Request Pending Approval",
        message: `${user.name} has posted a job seeking request: ${args.subject}`,
        type: "pending_approval",
        read: false,
        metadata: { seekerId },
        createdAt: Date.now(),
      });
    }

    // Send email notification to all admins
    try {
      for (const admin of admins) {
        await ctx.scheduler.runAfter(0, "emails:sendJobSeekerSubmissionEmail" as any, {
          adminEmail: admin.email,
          adminName: admin.name,
          seekerName: user.name,
          seekerEmail: user.email,
          subject: args.subject,
          description: args.description,
          contactEmail: args.contactEmail,
          contactPhone: args.contactPhone || '',
        });
      }
    } catch (error) {
      console.error("Failed to send job seeker submission emails:", error);
      // Don't fail request creation if email fails
    }

    return seekerId;
  },
});

// Update job seeker request
export const updateJobSeekerRequest = mutation({
  args: {
    seekerId: v.id("jobSeekerRequests"),
    userId: v.id("users"),
    subject: v.string(),
    description: v.string(),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const seeker = await ctx.db.get(args.seekerId);
    if (!seeker) {
      throw new Error("Job seeker request not found");
    }

    // Verify ownership
    if (seeker.userId !== args.userId) {
      throw new Error("Unauthorized: You can only edit your own job seeker requests");
    }

    const { seekerId, userId, ...updates } = args;

    await ctx.db.patch(seekerId, {
      ...updates,
      updatedAt: Date.now(),
      status: "pending", // Reset to pending on update
    });

    return { message: "Job seeker request updated successfully" };
  },
});

// Get all approved job seeker requests
export const getApprovedJobSeekerRequests = query({
  handler: async (ctx) => {
    const seekers = await ctx.db
      .query("jobSeekerRequests")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .order("desc")
      .collect();

    return seekers;
  },
});

// Get pending job seeker requests (Admin only)
export const getPendingJobSeekerRequests = query({
  args: { requesterId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const seekers = await ctx.db
      .query("jobSeekerRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    return seekers;
  },
});

// Get user's own job seeker requests
export const getMyJobSeekerRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const seekers = await ctx.db
      .query("jobSeekerRequests")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return seekers;
  },
});

// Get job seeker request by ID
export const getJobSeekerRequestById = query({
  args: { seekerId: v.id("jobSeekerRequests") },
  handler: async (ctx, args) => {
    const seeker = await ctx.db.get(args.seekerId);
    return seeker;
  },
});

// Approve job seeker request
export const approveJobSeekerRequest = mutation({
  args: {
    requesterId: v.id("users"),
    seekerId: v.id("jobSeekerRequests"),
  },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const seeker = await ctx.db.get(args.seekerId);
    if (!seeker) {
      throw new Error("Job seeker request not found");
    }

    await ctx.db.patch(args.seekerId, {
      status: "approved",
      approvedBy: args.requesterId,
      approvedAt: Date.now(),
      rejectionReason: undefined,
      updatedAt: Date.now(),
    });

    // Notify seeker
    await ctx.db.insert("notifications", {
      userId: seeker.userId,
      title: "Job Seeker Request Approved",
      message: `Your job seeking request "${seeker.subject}" has been approved and is now visible`,
      type: "profile_approved",
      read: false,
      metadata: { seekerId: args.seekerId },
      createdAt: Date.now(),
    });

    return { message: "Job seeker request approved successfully" };
  },
});

// Reject job seeker request
export const rejectJobSeekerRequest = mutation({
  args: {
    requesterId: v.id("users"),
    seekerId: v.id("jobSeekerRequests"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const seeker = await ctx.db.get(args.seekerId);
    if (!seeker) {
      throw new Error("Job seeker request not found");
    }

    await ctx.db.patch(args.seekerId, {
      status: "rejected",
      rejectionReason: args.reason,
      updatedAt: Date.now(),
    });

    // Notify seeker
    await ctx.db.insert("notifications", {
      userId: seeker.userId,
      title: "Job Seeker Request Rejected",
      message: args.reason || "Your job seeking request was not approved",
      type: "profile_rejected",
      read: false,
      metadata: { seekerId: args.seekerId },
      createdAt: Date.now(),
    });

    return { message: "Job seeker request rejected" };
  },
});

// Delete job seeker request
export const deleteJobSeekerRequest = mutation({
  args: {
    seekerId: v.id("jobSeekerRequests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const seeker = await ctx.db.get(args.seekerId);
    if (!seeker) {
      throw new Error("Job seeker request not found");
    }

    // Check if user is the owner or admin
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (seeker.userId !== args.userId && user.role !== "admin") {
      throw new Error("Unauthorized: You can only delete your own job seeker requests");
    }

    await ctx.db.delete(args.seekerId);

    return { message: "Job seeker request deleted successfully" };
  },
});

// Bulk approve job seeker requests
export const bulkApproveJobSeekerRequests = mutation({
  args: {
    requesterId: v.id("users"),
    seekerIds: v.array(v.id("jobSeekerRequests")),
  },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const results = await Promise.all(
      args.seekerIds.map(async (seekerId) => {
        try {
          const seeker = await ctx.db.get(seekerId);
          if (!seeker) return { seekerId, success: false, error: "Not found" };

          await ctx.db.patch(seekerId, {
            status: "approved",
            approvedBy: args.requesterId,
            approvedAt: Date.now(),
            rejectionReason: undefined,
            updatedAt: Date.now(),
          });

          // Notify seeker
          await ctx.db.insert("notifications", {
            userId: seeker.userId,
            title: "Job Seeker Request Approved",
            message: `Your job seeking request "${seeker.subject}" has been approved and is now visible`,
            type: "profile_approved",
            read: false,
            metadata: { seekerId },
            createdAt: Date.now(),
          });

          return { seekerId, success: true };
        } catch (error) {
          return { seekerId, success: false, error: String(error) };
        }
      })
    );

    return results;
  },
});

// Bulk reject job seeker requests
export const bulkRejectJobSeekerRequests = mutation({
  args: {
    requesterId: v.id("users"),
    seekerIds: v.array(v.id("jobSeekerRequests")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const results = await Promise.all(
      args.seekerIds.map(async (seekerId) => {
        try {
          const seeker = await ctx.db.get(seekerId);
          if (!seeker) return { seekerId, success: false, error: "Not found" };

          await ctx.db.patch(seekerId, {
            status: "rejected",
            rejectionReason: args.reason,
            updatedAt: Date.now(),
          });

          // Notify seeker
          await ctx.db.insert("notifications", {
            userId: seeker.userId,
            title: "Job Seeker Request Rejected",
            message: args.reason || "Your job seeking request was not approved",
            type: "profile_rejected",
            read: false,
            metadata: { seekerId },
            createdAt: Date.now(),
          });

          return { seekerId, success: true };
        } catch (error) {
          return { seekerId, success: false, error: String(error) };
        }
      })
    );

    return results;
  },
});

// Increment view count
export const incrementJobSeekerViews = mutation({
  args: { seekerId: v.id("jobSeekerRequests") },
  handler: async (ctx, args) => {
    const seeker = await ctx.db.get(args.seekerId);
    if (!seeker) return;

    await ctx.db.patch(args.seekerId, {
      views: (seeker.views || 0) + 1,
    });
  },
});
