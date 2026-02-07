import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireAdmin, getCurrentUserOrNull } from "./auth.helpers";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Audit action types
export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.signup"
  | "auth.password_change"
  | "employee.create"
  | "employee.update"
  | "employee.delete"
  | "employee.view"
  | "event.create"
  | "event.update"
  | "event.delete"
  | "event.send"
  | "event.cancel"
  | "trip.update"
  | "trip.book"
  | "itinerary.generate"
  | "itinerary.regenerate"
  | "settings.update"
  | "agent.tool_call"
  | "payment.initiated"
  | "payment.completed"
  | "payment.failed";

// Resource types
export type ResourceType =
  | "user"
  | "employee"
  | "event"
  | "trip"
  | "itinerary"
  | "conversation"
  | "settings"
  | "payment";

// Internal mutation for creating audit logs (used by other modules)
export const create = internalMutation({
  args: {
    userId: v.optional(v.id("userProfiles")),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    details: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: args.action,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      details: args.details,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      success: args.success,
      errorMessage: args.errorMessage,
      timestamp: Date.now(),
    });

    return logId;
  },
});

// Helper function to log audit events from mutations
export async function logAuditEvent(
  ctx: MutationCtx,
  action: AuditAction,
  resourceType: ResourceType,
  options: {
    resourceId?: string;
    details?: Record<string, unknown>;
    success?: boolean;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
) {
  const user = await getCurrentUserOrNull(ctx);

  await ctx.db.insert("auditLogs", {
    userId: user?._id,
    action,
    resourceType,
    resourceId: options.resourceId,
    details: options.details ? JSON.stringify(options.details) : undefined,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    success: options.success ?? true,
    errorMessage: options.errorMessage,
    timestamp: Date.now(),
  });
}

// Get audit logs (admin only)
export const list = query({
  args: {
    action: v.optional(v.string()),
    resourceType: v.optional(v.string()),
    userId: v.optional(v.id("userProfiles")),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let logs;

    if (args.action) {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_action", (q) => q.eq("action", args.action!))
        .order("desc")
        .take(args.limit ?? 100);
    } else if (args.resourceType) {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_resourceType", (q) => q.eq("resourceType", args.resourceType!))
        .order("desc")
        .take(args.limit ?? 100);
    } else if (args.userId) {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
        .order("desc")
        .take(args.limit ?? 100);
    } else {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_timestamp")
        .order("desc")
        .take(args.limit ?? 100);
    }

    // Apply time filters
    if (args.startTime || args.endTime) {
      logs = logs.filter((log) => {
        if (args.startTime && log.timestamp < args.startTime) return false;
        if (args.endTime && log.timestamp > args.endTime) return false;
        return true;
      });
    }

    return logs;
  },
});

// Get audit logs for a specific resource
export const getByResource = query({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_resourceType", (q) => q.eq("resourceType", args.resourceType))
      .order("desc")
      .take(args.limit ?? 50);

    return logs.filter((log) => log.resourceId === args.resourceId);
  },
});

// Get recent activity for dashboard
export const getRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit ?? 20);

    // Enrich with user info
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        let userName = "System";
        if (log.userId) {
          const userProfile = await ctx.db.get(log.userId);
          if (userProfile) {
            userName = userProfile.displayName ?? "Unknown User";
          }
        }
        return {
          ...log,
          userName,
        };
      })
    );

    return enrichedLogs;
  },
});

// Get audit statistics
export const getStats = query({
  args: {
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const startTime = args.startTime ?? Date.now() - 24 * 60 * 60 * 1000; // Default: last 24 hours
    const endTime = args.endTime ?? Date.now();

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    const filteredLogs = logs.filter(
      (log) => log.timestamp >= startTime && log.timestamp <= endTime
    );

    const stats = {
      total: filteredLogs.length,
      successful: filteredLogs.filter((l) => l.success).length,
      failed: filteredLogs.filter((l) => !l.success).length,
      byAction: {} as Record<string, number>,
      byResourceType: {} as Record<string, number>,
    };

    for (const log of filteredLogs) {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.byResourceType[log.resourceType] = (stats.byResourceType[log.resourceType] || 0) + 1;
    }

    return stats;
  },
});

// Clean up old audit logs (retention policy)
export const cleanupOldLogs = internalMutation({
  args: { retentionDays: v.number() },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - args.retentionDays * 24 * 60 * 60 * 1000;

    const oldLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoffTime))
      .collect();

    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }

    return oldLogs.length;
  },
});
