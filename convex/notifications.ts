import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth, requireAdmin } from "./auth.helpers";

const notificationTypeValidator = v.union(
  v.literal("success"),
  v.literal("error"),
  v.literal("warning"),
  v.literal("info")
);

export type NotificationPayload = {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  eventId?: Id<"events">;
  tripId?: Id<"trips">;
  conversationId?: Id<"conversations">;
};

/** Get all admin user profile IDs (for broadcasting notifications). */
export async function getAdminUserIds(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"userProfiles">[]> {
  const profiles = await ctx.db
    .query("userProfiles")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .collect();
  return profiles.map((p) => p._id);
}

/** Insert one notification per recipient. Call from other mutations. */
export async function notifyUsers(
  ctx: MutationCtx,
  userIds: Id<"userProfiles">[],
  payload: NotificationPayload
): Promise<void> {
  const now = Date.now();
  for (const userId of userIds) {
    await ctx.db.insert("notifications", {
      userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      read: false,
      timestamp: now,
      eventId: payload.eventId,
      tripId: payload.tripId,
      conversationId: payload.conversationId,
    });
  }
}

/** List notifications for the current user (newest first). */
export const listForUser = query({
  args: {
    limit: v.optional(v.number()),
    before: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const limit = args.limit ?? 50;

    let list = await ctx.db
      .query("notifications")
      .withIndex("by_userId_timestamp", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit * 2);

    if (args.before !== undefined) {
      list = list.filter((n) => n.timestamp < args.before!);
    }

    return list.slice(0, limit);
  },
});

/** Mark a single notification as read. */
export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const notification = await ctx.db.get(args.id);
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found or access denied");
    }
    await ctx.db.patch(args.id, { read: true });
    return args.id;
  },
});

/** Mark all notifications for the current user as read. */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const list = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    for (const n of list) {
      if (!n.read) await ctx.db.patch(n._id, { read: true });
    }
    return list.length;
  },
});

/** Create announcements for all users in a role (admin only). */
export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    targetRole: v.union(
      v.literal("admin"),
      v.literal("employee"),
      v.literal("all")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let profiles;
    if (args.targetRole === "all") {
      profiles = await ctx.db.query("userProfiles").collect();
    } else {
      const role = args.targetRole as "admin" | "employee";
      profiles = await ctx.db
        .query("userProfiles")
        .withIndex("by_role", (q) => q.eq("role", role))
        .collect();
    }

    const userIds = profiles.map((p) => p._id);
    await notifyUsers(ctx, userIds, {
      type: "info",
      title: args.title,
      message: args.message,
    });
    return userIds.length;
  },
});

/** Record that an event invitation was opened (e.g. from email link or in-app). Notifies admins. */
export const recordInvitationOpen = mutation({
  args: {
    eventId: v.id("events"),
    employeeId: v.optional(v.id("employees")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const now = Date.now();
    await ctx.db.insert("eventInvitationOpens", {
      eventId: args.eventId,
      employeeId: args.employeeId,
      userId: user._id,
      openedAt: now,
    });

    const employee = args.employeeId ? await ctx.db.get(args.employeeId) : null;
    const openerName = employee?.name ?? user.displayName ?? "Someone";
    const eventName = event.name;
    const adminIds = await getAdminUserIds(ctx);
    await notifyUsers(ctx, adminIds, {
      type: "info",
      title: "Email opened",
      message: `${openerName} opened the event invitation for ${eventName}`,
      eventId: args.eventId,
    });
    return now;
  },
});
