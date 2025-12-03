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

// Register a new user
export const register = mutation({
  args: {
    email: v.string(),
    phone: v.optional(v.string()),
    password: v.string(),
    name: v.string(),
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

    // Check if this is the first user (auto-admin)
    const userCount = await ctx.db.query("users").collect();
    const isFirstUser = userCount.length === 0;

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      phone: args.phone,
      passwordHash,
      name: args.name,
      role: isFirstUser ? "admin" : "member", // First user becomes admin
      emailVerified: true, // Auto-verify for now
      createdAt: Date.now(),
    });

    // Notify if first user
    if (isFirstUser) {
      console.log(`🎉 First user registered with admin privileges: ${args.email}`);
    }

    return { userId, message: "Registration successful" };
  },
});

// Login user
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
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
    };
  },
});

// Update user role (Admin only)
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    targetUserId: v.id("users"),
    newRole: v.union(v.literal("admin"), v.literal("pastor"), v.literal("member")),
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
