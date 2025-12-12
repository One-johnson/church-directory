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

/**
 * Create an initial admin user
 * Can be called from Convex dashboard to bootstrap the first admin
 * 
 * Usage from Convex Dashboard:
 * 1. Go to your Convex dashboard
 * 2. Navigate to Functions
 * 3. Find "adminBootstrap:createInitialAdmin"
 * 4. Run with parameters: email, password, name
 */
export const createInitialAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Create admin user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      phone: args.phone,
      passwordHash,
      name: args.name,
      role: "admin",
      emailVerified: true,
      createdAt: Date.now(),
      pastor: "",
      denomination: "",
      denominationName: "",
      branch: "",
      branchName: "",
      branchLocation: "",
      pastorEmail: "",
      accountApproved: false
    });

    console.log(`✅ Admin user created successfully: ${args.email}`);

    return {
      userId,
      message: "Admin user created successfully",
      email: args.email,
      role: "admin",
    };
  },
});

/**
 * Promote an existing user to admin
 * Useful if someone registered as a member and needs admin access
 * 
 * Usage from Convex Dashboard:
 * 1. Get the user's email
 * 2. Run this function with the email
 */
export const promoteUserToAdmin = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error(`No user found with email: ${args.email}`);
    }

    if (user.role === "admin") {
      return {
        message: `User ${args.email} is already an admin`,
        userId: user._id,
        currentRole: "admin",
      };
    }

    // Update to admin role
    await ctx.db.patch(user._id, {
      role: "admin",
    });

    // Notify user
    await ctx.db.insert("notifications", {
      userId: user._id,
      title: "You're Now an Admin!",
      message: "Your account has been promoted to administrator. You now have full access to manage the platform.",
      type: "role_changed",
      read: false,
      metadata: { oldRole: user.role, newRole: "admin" },
      createdAt: Date.now(),
    });

    console.log(`✅ User promoted to admin: ${args.email}`);

    return {
      userId: user._id,
      message: `User ${args.email} promoted to admin successfully`,
      oldRole: user.role,
      newRole: "admin",
    };
  },
});

/**
 * Check if there are any admin users in the system
 * Useful for debugging and verification
 */
export const checkAdminStatus = query({
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const adminUsers = allUsers.filter((u) => u.role === "admin");
    const pastorUsers = allUsers.filter((u) => u.role === "pastor");
    const memberUsers = allUsers.filter((u) => u.role === "member");

    return {
      totalUsers: allUsers.length,
      adminCount: adminUsers.length,
      pastorCount: pastorUsers.length,
      memberCount: memberUsers.length,
      admins: adminUsers.map((u) => ({
        email: u.email,
        name: u.name,
        createdAt: u.createdAt,
      })),
      hasAdmins: adminUsers.length > 0,
      needsBootstrap: allUsers.length === 0 || adminUsers.length === 0,
    };
  },
});

/**
 * Demote admin back to member (use with caution!)
 * Only works if there are multiple admins (prevents locking yourself out)
 */
export const demoteAdmin = mutation({
  args: {
    requesterId: v.id("users"),
    targetEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify requester is admin
    const requester = await ctx.db.get(args.requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Find target user
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.targetEmail))
      .first();

    if (!targetUser) {
      throw new Error(`No user found with email: ${args.targetEmail}`);
    }

    if (targetUser.role !== "admin") {
      throw new Error(`User ${args.targetEmail} is not an admin`);
    }

    // Check if there are other admins
    const allUsers = await ctx.db.query("users").collect();
    const adminCount = allUsers.filter((u) => u.role === "admin").length;

    if (adminCount <= 1) {
      throw new Error("Cannot demote the last admin. Promote another user to admin first.");
    }

    // Prevent self-demotion
    if (requester._id === targetUser._id) {
      throw new Error("Cannot demote yourself. Ask another admin to do it.");
    }

    // Demote to member
    await ctx.db.patch(targetUser._id, {
      role: "member",
    });

    // Notify user
    await ctx.db.insert("notifications", {
      userId: targetUser._id,
      title: "Role Changed",
      message: "Your admin privileges have been removed. You are now a member.",
      type: "role_changed",
      read: false,
      metadata: { oldRole: "admin", newRole: "member" },
      createdAt: Date.now(),
    });

    return {
      message: `User ${args.targetEmail} demoted to member successfully`,
      userId: targetUser._id,
    };
  },
});
