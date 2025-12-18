import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create job opportunity
export const createJobOpportunity = mutation({
  args: {
    userId: v.id("users"),
    professionalNeeded: v.string(),
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

    const jobId = await ctx.db.insert("jobOpportunities", {
      userId: args.userId,
      posterName: user.name,
      posterEmail: user.email,
      professionalNeeded: args.professionalNeeded,
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
        title: "New Job Opportunity Pending Approval",
        message: `${user.name} has posted a job opportunity for ${args.professionalNeeded}`,
        type: "pending_approval",
        read: false,
        metadata: { jobId },
        createdAt: Date.now(),
      });
    }

    // Send email notification to all admins
    try {
      for (const admin of admins) {
        await ctx.scheduler.runAfter(0, "emails:sendJobOpportunitySubmissionEmail" as any, {
          adminEmail: admin.email,
          adminName: admin.name,
          posterName: user.name,
          posterEmail: user.email,
          professionalNeeded: args.professionalNeeded,
          subject: args.subject,
          description: args.description,
          contactEmail: args.contactEmail,
          contactPhone: args.contactPhone || '',
        });
      }
    } catch (error) {
      console.error("Failed to send job opportunity submission emails:", error);
      // Don't fail job creation if email fails
    }

    return jobId;
  },
});

// Update job opportunity
export const updateJobOpportunity = mutation({
  args: {
    jobId: v.id("jobOpportunities"),
    userId: v.id("users"),
    professionalNeeded: v.string(),
    subject: v.string(),
    description: v.string(),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job opportunity not found");
    }

    // Verify ownership
    if (job.userId !== args.userId) {
      throw new Error("Unauthorized: You can only edit your own job opportunities");
    }

    const { jobId, userId, ...updates } = args;

    await ctx.db.patch(jobId, {
      ...updates,
      updatedAt: Date.now(),
      status: "pending", // Reset to pending on update
    });

    return { message: "Job opportunity updated successfully" };
  },
});

// Get all approved job opportunities
export const getApprovedJobOpportunities = query({
  handler: async (ctx) => {
    const jobs = await ctx.db
      .query("jobOpportunities")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .order("desc")
      .collect();

    return jobs;
  },
});

// Get pending job opportunities (Admin only)
export const getPendingJobOpportunities = query({
  args: { requesterId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const jobs = await ctx.db
      .query("jobOpportunities")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    return jobs;
  },
});

// Get user's own job opportunities
export const getMyJobOpportunities = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("jobOpportunities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return jobs;
  },
});

// Get job opportunity by ID
export const getJobOpportunityById = query({
  args: { jobId: v.id("jobOpportunities") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    return job;
  },
});

// Approve job opportunity
export const approveJobOpportunity = mutation({
  args: {
    requesterId: v.id("users"),
    jobId: v.id("jobOpportunities"),
  },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job opportunity not found");
    }

    await ctx.db.patch(args.jobId, {
      status: "approved",
      approvedBy: args.requesterId,
      approvedAt: Date.now(),
      rejectionReason: undefined,
      updatedAt: Date.now(),
    });

    // Notify poster
    await ctx.db.insert("notifications", {
      userId: job.userId,
      title: "Job Opportunity Approved",
      message: `Your job posting for ${job.professionalNeeded} has been approved and is now visible`,
      type: "profile_approved",
      read: false,
      metadata: { jobId: args.jobId },
      createdAt: Date.now(),
    });

    return { message: "Job opportunity approved successfully" };
  },
});

// Reject job opportunity
export const rejectJobOpportunity = mutation({
  args: {
    requesterId: v.id("users"),
    jobId: v.id("jobOpportunities"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job opportunity not found");
    }

    await ctx.db.patch(args.jobId, {
      status: "rejected",
      rejectionReason: args.reason,
      updatedAt: Date.now(),
    });

    // Notify poster
    await ctx.db.insert("notifications", {
      userId: job.userId,
      title: "Job Opportunity Rejected",
      message: args.reason || "Your job posting was not approved",
      type: "profile_rejected",
      read: false,
      metadata: { jobId: args.jobId },
      createdAt: Date.now(),
    });

    return { message: "Job opportunity rejected" };
  },
});

// Delete job opportunity
export const deleteJobOpportunity = mutation({
  args: {
    jobId: v.id("jobOpportunities"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job opportunity not found");
    }

    // Check if user is the owner or admin
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (job.userId !== args.userId && user.role !== "admin") {
      throw new Error("Unauthorized: You can only delete your own job opportunities");
    }

    await ctx.db.delete(args.jobId);

    return { message: "Job opportunity deleted successfully" };
  },
});

// Bulk approve job opportunities
export const bulkApproveJobOpportunities = mutation({
  args: {
    requesterId: v.id("users"),
    jobIds: v.array(v.id("jobOpportunities")),
  },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const results = await Promise.all(
      args.jobIds.map(async (jobId) => {
        try {
          const job = await ctx.db.get(jobId);
          if (!job) return { jobId, success: false, error: "Not found" };

          await ctx.db.patch(jobId, {
            status: "approved",
            approvedBy: args.requesterId,
            approvedAt: Date.now(),
            rejectionReason: undefined,
            updatedAt: Date.now(),
          });

          // Notify poster
          await ctx.db.insert("notifications", {
            userId: job.userId,
            title: "Job Opportunity Approved",
            message: `Your job posting for ${job.professionalNeeded} has been approved and is now visible`,
            type: "profile_approved",
            read: false,
            metadata: { jobId },
            createdAt: Date.now(),
          });

          return { jobId, success: true };
        } catch (error) {
          return { jobId, success: false, error: String(error) };
        }
      })
    );

    return results;
  },
});

// Bulk reject job opportunities
export const bulkRejectJobOpportunities = mutation({
  args: {
    requesterId: v.id("users"),
    jobIds: v.array(v.id("jobOpportunities")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const results = await Promise.all(
      args.jobIds.map(async (jobId) => {
        try {
          const job = await ctx.db.get(jobId);
          if (!job) return { jobId, success: false, error: "Not found" };

          await ctx.db.patch(jobId, {
            status: "rejected",
            rejectionReason: args.reason,
            updatedAt: Date.now(),
          });

          // Notify poster
          await ctx.db.insert("notifications", {
            userId: job.userId,
            title: "Job Opportunity Rejected",
            message: args.reason || "Your job posting was not approved",
            type: "profile_rejected",
            read: false,
            metadata: { jobId },
            createdAt: Date.now(),
          });

          return { jobId, success: true };
        } catch (error) {
          return { jobId, success: false, error: String(error) };
        }
      })
    );

    return results;
  },
});

// Increment view count
export const incrementJobViews = mutation({
  args: { jobId: v.id("jobOpportunities") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return;

    await ctx.db.patch(args.jobId, {
      views: (job.views || 0) + 1,
    });
  },
});
