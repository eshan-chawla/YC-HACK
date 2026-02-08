import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getCurrentUser, getCurrentUserOrNull, requireAdmin, requireAuth } from "./auth.helpers";

/**
 * Helper to get the Clerk user ID from auth context.
 */
async function getClerkUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;
}

// Get the current user's profile
export const me = query({
  args: {},
  handler: async (ctx) => {
    return getCurrentUserOrNull(ctx);
  },
});

// Ensure user profile exists (call after authentication)
// Creates a profile if one doesn't exist for the authenticated user
export const ensureProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new profile with default employee role
    const now = Date.now();
    return ctx.db.insert("userProfiles", {
      userId,
      role: "employee", // Default role - admins must be manually promoted
      displayName: args.displayName,
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get user profile by ID (admin only for other users)
export const get = query({
  args: { id: v.id("userProfiles") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrNull(ctx);
    
    // Allow fetching own profile or admin fetching any profile
    if (!currentUser) {
      return null;
    }

    if (currentUser._id !== args.id && currentUser.role !== "admin") {
      throw new Error("Unauthorized: Cannot view other user profiles");
    }

    return ctx.db.get(args.id);
  },
});

// Get user profile with employee details
export const getWithEmployee = query({
  args: { id: v.optional(v.id("userProfiles")) },
  handler: async (ctx, args) => {
    let userProfile;

    if (args.id) {
      const currentUser = await getCurrentUser(ctx);
      if (currentUser._id !== args.id && currentUser.role !== "admin") {
        throw new Error("Unauthorized");
      }
      userProfile = await ctx.db.get(args.id);
    } else {
      userProfile = await getCurrentUserOrNull(ctx);
    }

    if (!userProfile) {
      return null;
    }

    let employee = null;
    if (userProfile.employeeId) {
      employee = await ctx.db.get(userProfile.employeeId);
    }

    return {
      ...userProfile,
      employee,
    };
  },
});

// List all user profiles (admin only)
export const list = query({
  args: {
    role: v.optional(v.union(v.literal("admin"), v.literal("employee"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = args.limit ?? 100;

    // Use separate code paths to avoid TypeScript type narrowing issues
    if (args.role) {
      return ctx.db
        .query("userProfiles")
        .withIndex("by_role", (q) => q.eq("role", args.role!))
        .order("desc")
        .take(limit);
    } else {
      return ctx.db
        .query("userProfiles")
        .order("desc")
        .take(limit);
    }
  },
});

// Create user profile (called after signup)
export const create = mutation({
  args: {
    role: v.union(v.literal("admin"), v.literal("employee")),
    employeeId: v.optional(v.id("employees")),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      throw new Error("User profile already exists");
    }

    // If employee role, validate employee exists
    if (args.role === "employee" && args.employeeId) {
      const employee = await ctx.db.get(args.employeeId);
      if (!employee) {
        throw new Error("Employee record not found");
      }
    }

    const now = Date.now();
    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      role: args.role,
      employeeId: args.employeeId,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    });

    return profileId;
  },
});

// Internal mutation to create profile (used by auth callbacks)
export const createInternal = internalMutation({
  args: {
    userId: v.string(), // Clerk user ID
    role: v.union(v.literal("admin"), v.literal("employee")),
    employeeId: v.optional(v.id("employees")),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    return ctx.db.insert("userProfiles", {
      userId: args.userId,
      role: args.role,
      employeeId: args.employeeId,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update own profile (includes admin/employee onboarding fields)
export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    companyName: v.optional(v.string()),
    department: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    timezone: v.optional(v.string()),
    currency: v.optional(v.string()),
    language: v.optional(v.string()),
    notificationPreferences: v.optional(v.object({
      email: v.boolean(),
      sms: v.boolean(),
      push: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.companyName !== undefined) updates.companyName = args.companyName;
    if (args.department !== undefined) updates.department = args.department;
    if (args.jobTitle !== undefined) updates.jobTitle = args.jobTitle;
    if (args.phoneNumber !== undefined) updates.phoneNumber = args.phoneNumber;
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.currency !== undefined) updates.currency = args.currency;
    if (args.language !== undefined) updates.language = args.language;
    if (args.notificationPreferences !== undefined) updates.notificationPreferences = args.notificationPreferences;

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

// Link employee to user profile (admin only)
export const linkEmployee = mutation({
  args: {
    userProfileId: v.id("userProfiles"),
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const userProfile = await ctx.db.get(args.userProfileId);
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    // Check if employee is already linked to another user
    const existingLink = await ctx.db
      .query("userProfiles")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId))
      .first();

    if (existingLink && existingLink._id !== args.userProfileId) {
      throw new Error("Employee is already linked to another user");
    }

    await ctx.db.patch(args.userProfileId, {
      employeeId: args.employeeId,
      role: "employee", // Ensure role is set correctly
      updatedAt: Date.now(),
    });

    return args.userProfileId;
  },
});

// Update user role (admin only)
export const updateRole = mutation({
  args: {
    userProfileId: v.id("userProfiles"),
    role: v.union(v.literal("admin"), v.literal("employee")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAdmin(ctx);

    // Prevent admin from demoting themselves
    if (currentUser._id === args.userProfileId && args.role !== "admin") {
      throw new Error("Cannot demote yourself from admin");
    }

    const userProfile = await ctx.db.get(args.userProfileId);
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    await ctx.db.patch(args.userProfileId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return args.userProfileId;
  },
});

// Delete user profile (admin only)
export const remove = mutation({
  args: { id: v.id("userProfiles") },
  handler: async (ctx, args) => {
    const currentUser = await requireAdmin(ctx);

    // Prevent admin from deleting themselves
    if (currentUser._id === args.id) {
      throw new Error("Cannot delete your own profile");
    }

    const userProfile = await ctx.db.get(args.id);
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    await ctx.db.delete(args.id);

    return args.id;
  },
});
