import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export type UserProfile = Doc<"userProfiles">;

/**
 * Get the Clerk user ID from the auth context.
 * Returns null if not authenticated.
 */
async function getClerkUserId(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return identity.subject;
}

/**
 * Get the currently authenticated user's profile
 * Returns null if not authenticated
 */
export async function getCurrentUserOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<UserProfile | null> {
  const userId = await getClerkUserId(ctx);
  if (!userId) {
    return null;
  }

  const userProfile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();

  return userProfile;
}

/**
 * Get the currently authenticated user's profile
 * Throws error if not authenticated
 */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<UserProfile> {
  const userProfile = await getCurrentUserOrNull(ctx);
  if (!userProfile) {
    throw new Error("Not authenticated");
  }
  return userProfile;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<UserProfile> {
  return getCurrentUser(ctx);
}

/**
 * Require admin role - throws if not authenticated or not an admin
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<UserProfile> {
  const user = await getCurrentUser(ctx);
  if (user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
}

/**
 * Require employee role - throws if not authenticated or not an employee
 */
export async function requireEmployee(ctx: QueryCtx | MutationCtx): Promise<UserProfile> {
  const user = await getCurrentUser(ctx);
  if (user.role !== "employee") {
    throw new Error("Unauthorized: Employee access required");
  }
  return user;
}

/**
 * Check if user has access to a specific employee record
 * Admins can access all, employees can only access their own
 */
export async function canAccessEmployee(
  ctx: QueryCtx | MutationCtx,
  employeeId: Id<"employees">
): Promise<boolean> {
  const user = await getCurrentUserOrNull(ctx);
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.employeeId === employeeId;
}

/**
 * Get the employee record for the current user (if they are an employee)
 */
export async function getCurrentEmployeeOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"employees"> | null> {
  const user = await getCurrentUserOrNull(ctx);
  if (!user || !user.employeeId) {
    return null;
  }
  return ctx.db.get(user.employeeId);
}
