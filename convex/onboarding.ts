import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Helper to get Clerk user ID from auth context
 */
async function getClerkUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string; email?: string; name?: string } | null> } }): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;
}

/**
 * Helper to get the full identity (includes email, name, etc.)
 */
async function getIdentity(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string; email?: string; name?: string } | null> } }) {
  return ctx.auth.getUserIdentity();
}

/**
 * Complete admin onboarding
 * Updates the user profile with admin-specific information
 */
export const completeAdminOnboarding = mutation({
  args: {
    fullName: v.string(),
    companyName: v.string(),
    department: v.string(),
    phoneNumber: v.optional(v.string()),
    jobTitle: v.string(),
    timezone: v.string(),
    currency: v.string(),
    language: v.string(),
    notificationPreferences: v.object({
      email: v.boolean(),
      sms: v.boolean(),
      push: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find the user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const now = Date.now();

    if (profile) {
      // Update existing profile
      await ctx.db.patch(profile._id, {
        displayName: args.fullName,
        companyName: args.companyName,
        department: args.department,
        phoneNumber: args.phoneNumber,
        jobTitle: args.jobTitle,
        timezone: args.timezone,
        currency: args.currency,
        language: args.language,
        notificationPreferences: args.notificationPreferences,
        onboardingCompleted: true,
        updatedAt: now,
      });
      return profile._id;
    } else {
      // Create new profile (shouldn't happen normally, but handle it)
      const profileId = await ctx.db.insert("userProfiles", {
        userId,
        role: "admin",
        displayName: args.fullName,
        companyName: args.companyName,
        department: args.department,
        phoneNumber: args.phoneNumber,
        jobTitle: args.jobTitle,
        timezone: args.timezone,
        currency: args.currency,
        language: args.language,
        notificationPreferences: args.notificationPreferences,
        onboardingCompleted: true,
        createdAt: now,
        updatedAt: now,
      });
      return profileId;
    }
  },
});

/**
 * Complete employee onboarding
 * Creates an employee record and links it to the user profile
 */
export const completeEmployeeOnboarding = mutation({
  args: {
    fullName: v.string(),
    department: v.string(),
    team: v.optional(v.string()),
    manager: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    seatingPreference: v.string(),
    dietaryRestrictions: v.array(v.string()),
    mobilityNeeds: v.optional(v.string()),
    hotelPreferences: v.array(v.string()),
    frequentFlyerNumbers: v.optional(v.array(v.object({
      airline: v.string(),
      number: v.string(),
    }))),
    additionalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;
    const userEmail = identity.email || "";

    const now = Date.now();

    // Find or create the user profile
    let profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    // Create the employee record
    const employeeId = await ctx.db.insert("employees", {
      name: args.fullName,
      email: userEmail,
      team: args.team || "Unassigned",
      role: "Employee", // Default job role
      department: args.department,
      status: "active",
      phoneNumber: args.phoneNumber,
      manager: args.manager,
      frequentFlyerNumbers: args.frequentFlyerNumbers,
      additionalNotes: args.additionalNotes,
      restrictions: {
        dietary: args.dietaryRestrictions.length > 0 ? args.dietaryRestrictions : undefined,
        mobility: args.mobilityNeeds,
        seating: args.seatingPreference !== "no_preference" ? args.seatingPreference : undefined,
        hotelPreferences: args.hotelPreferences.length > 0 ? args.hotelPreferences : undefined,
      },
      createdAt: now,
      updatedAt: now,
    });

    if (profile) {
      // Update existing profile with employee link
      await ctx.db.patch(profile._id, {
        displayName: args.fullName,
        employeeId,
        onboardingCompleted: true,
        updatedAt: now,
      });
    } else {
      // Create new profile linked to employee
      await ctx.db.insert("userProfiles", {
        userId,
        role: "employee",
        employeeId,
        displayName: args.fullName,
        onboardingCompleted: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return employeeId;
  },
});

/**
 * Ensure user profile exists after authentication
 * Called after login/signup to create a basic profile if needed
 */
export const ensureUserProfile = mutation({
  args: {
    role: v.union(v.literal("admin"), v.literal("employee")),
  },
  handler: async (ctx, args) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      return {
        profileId: existingProfile._id,
        onboardingCompleted: existingProfile.onboardingCompleted,
        role: existingProfile.role,
      };
    }

    // Create new profile
    const now = Date.now();
    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      role: args.role,
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    });

    return {
      profileId,
      onboardingCompleted: false,
      role: args.role,
    };
  },
});

/**
 * Get current user's onboarding status
 */
export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      return null;
    }

    return {
      role: profile.role,
      onboardingCompleted: profile.onboardingCompleted,
      displayName: profile.displayName,
    };
  },
});
