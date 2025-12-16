import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to hash password using SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Generate secure approval token
function generateApprovalToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Register a new user (legacy - for backward compatibility)
export const register = mutation({
  args: {
    email: v.string(),
    phone: v.optional(v.string()),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    throw new Error("Please use the enhanced registration form with denomination and branch selection");
  },
});

// Register with denomination and branch
export const registerWithDenomination = mutation({
  args: {
    email: v.string(),
    phone: v.optional(v.string()),
    password: v.string(),
    name: v.string(),
    denomination: v.string(),
    denominationName: v.string(),
    branch: v.string(),
    branchName: v.string(),
    branchLocation: v.string(),
    pastor: v.string(),
    pastorEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists in users table
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Check if user already exists in pending users
    const existingPending = await ctx.db
      .query("pendingUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingPending) {
      throw new Error("Registration already pending approval for this email");
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Check if this is the first user (auto-admin and auto-approved)
    const userCount = await ctx.db.query("users").collect();
    const isFirstUser = userCount.length === 0;

    if (isFirstUser) {
      // First user: Add directly to users table as admin
      const userId = await ctx.db.insert("users", {
        email: args.email,
        phone: args.phone,
        passwordHash,
        name: args.name,
        role: "admin",
        emailVerified: true,
        createdAt: Date.now(),
        denomination: args.denomination,
        denominationName: args.denominationName,
        branch: args.branch,
        branchName: args.branchName,
        branchLocation: args.branchLocation,
        pastor: args.pastor,
        pastorEmail: args.pastorEmail,
        accountApprovedBy: "system",
        accountApprovedAt: Date.now(),
      });

      console.log(`🎉 First user registered with admin privileges: ${args.email}`);
      return { userId, message: "Registration successful - First admin account created" };
    }

    // Generate approval token for pastor email link
    const approvalToken = generateApprovalToken();

    // Add to pendingUsers table (not users table)
    const pendingUserId = await ctx.db.insert("pendingUsers", {
      email: args.email,
      phone: args.phone,
      passwordHash,
      name: args.name,
      denomination: args.denomination,
      denominationName: args.denominationName,
      branch: args.branch,
      branchName: args.branchName,
      branchLocation: args.branchLocation,
      pastor: args.pastor,
      pastorEmail: args.pastorEmail,
      approvalToken,
      createdAt: Date.now(),
    });

    // Send email to pastor for approval
    try {
      await ctx.scheduler.runAfter(0, "emails:sendRegistrationEmail" as any, {
        pastorEmail: args.pastorEmail,
        pastorName: args.pastor,
        userName: args.name,
        userEmail: args.email,
        userPhone: args.phone,
        denominationName: args.denominationName,
        branchName: args.branchName,
        branchLocation: args.branchLocation,
        approvalToken, // Include token for pastor approval link
      });
    } catch (error) {
      console.error("Failed to send registration email to pastor:", error);
      // Don't fail registration if email fails
    }

    // Send email to all admins for notification
    try {
      const admins = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();

      for (const admin of admins) {
        await ctx.scheduler.runAfter(0, "emails:sendAdminRegistrationNotificationEmail" as any, {
          adminEmail: admin.email,
          adminName: admin.name,
          userName: args.name,
          userEmail: args.email,
          userPhone: args.phone,
          denominationName: args.denominationName,
          branchName: args.branchName,
          branchLocation: args.branchLocation,
          pastorName: args.pastor,
        });
      }
    } catch (error) {
      console.error("Failed to send registration email to admins:", error);
      // Don't fail registration if email fails
    }

    return { 
      pendingUserId, 
      message: "Registration submitted for approval. You'll receive an email once your account is approved." 
    };
  },
});

// Login user
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user in users table (must be approved to login)
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      // Check if user is in pending state
      const pendingUser = await ctx.db
        .query("pendingUsers")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      if (pendingUser) {
        throw new Error("Your account is pending approval. Please wait for confirmation email.");
      }

      throw new Error("Invalid email or password");
    }

    // Verify password
    const inputHash = await hashPassword(args.password);
    const isValid = inputHash === user.passwordHash;
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
});

// Get current user by ID
export const getCurrentUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      _id: user._id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      denomination: user.denomination,
      denominationName: user.denominationName,
      branch: user.branch,
      branchName: user.branchName,
      branchLocation: user.branchLocation,
      pastor: user.pastor,
      pastorEmail: user.pastorEmail,
      accountApprovedBy: user.accountApprovedBy,
      accountApprovedAt: user.accountApprovedAt,
    };
  },
});

// Update user role (Admin only)
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    targetUserId: v.id("users"),
    newRole: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    // Check if requester is admin
    const requester = await ctx.db.get(args.userId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Update target user role
    await ctx.db.patch(args.targetUserId, {
      role: args.newRole,
    });

    return { message: "User role updated successfully" };
  },
});
