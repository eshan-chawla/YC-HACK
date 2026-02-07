import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAdmin, requireAuth, canAccessEmployee } from "./auth.helpers";

// Cost breakdown validator
const costBreakdownValidator = v.object({
  flights: v.number(),
  hotel: v.number(),
  groundTransport: v.number(),
  meals: v.number(),
  total: v.number(),
});

// Get all trips for an event (admin sees all, employees see their own)
export const listByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const trips = await ctx.db
      .query("trips")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();

    // If employee, filter to only their trips
    if (user.role === "employee") {
      return trips.filter((t) => t.employeeId === user.employeeId);
    }

    return trips;
  },
});

// Get all trips for an employee
export const listByEmployee = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Check access
    if (user.role === "employee" && user.employeeId !== args.employeeId) {
      throw new Error("Unauthorized: Cannot view another employee's trips");
    }

    const trips = await ctx.db
      .query("trips")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId))
      .collect();

    return trips;
  },
});

// Get trips for current user (employee)
export const listMine = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("booked"),
      v.literal("in_progress"),
      v.literal("failed"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (!user.employeeId) {
      return [];
    }

    let q = ctx.db
      .query("trips")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", user.employeeId!));

    const trips = await q.collect();

    if (args.status) {
      return trips.filter((t) => t.status === args.status);
    }

    return trips;
  },
});

// Get a single trip by ID
export const get = query({
  args: { id: v.id("trips") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const trip = await ctx.db.get(args.id);

    if (!trip) {
      return null;
    }

    // Check access
    if (user.role === "employee" && user.employeeId !== trip.employeeId) {
      throw new Error("Unauthorized: Cannot view another employee's trip");
    }

    return trip;
  },
});

// Get trip with full details (event, employee, itinerary)
export const getWithDetails = query({
  args: { id: v.id("trips") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const trip = await ctx.db.get(args.id);

    if (!trip) {
      return null;
    }

    // Check access
    if (user.role === "employee" && user.employeeId !== trip.employeeId) {
      throw new Error("Unauthorized: Cannot view another employee's trip");
    }

    const [event, employee, itinerary] = await Promise.all([
      ctx.db.get(trip.eventId),
      ctx.db.get(trip.employeeId),
      trip.itineraryId ? ctx.db.get(trip.itineraryId) : null,
    ]);

    return {
      ...trip,
      event,
      employee,
      itinerary,
    };
  },
});

// Update trip status (admin only)
export const updateStatus = mutation({
  args: {
    id: v.id("trips"),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("booked"),
      v.literal("in_progress"),
      v.literal("failed"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const trip = await ctx.db.get(args.id);
    if (!trip) {
      throw new Error("Trip not found");
    }

    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "booked" && !trip.bookedAt) {
      updates.bookedAt = Date.now();
      
      // Update employee's trip count
      const employee = await ctx.db.get(trip.employeeId);
      if (employee) {
        await ctx.db.patch(trip.employeeId, {
          totalTripsBooked: (employee.totalTripsBooked ?? 0) + 1,
          lastEventBooking: Date.now(),
        });
      }
    }

    if (args.status === "failed" && args.failureReason) {
      updates.failureReason = args.failureReason;
    }

    await ctx.db.patch(args.id, updates);

    return args.id;
  },
});

// Update trip cost breakdown (admin or agent)
export const updateCostBreakdown = mutation({
  args: {
    id: v.id("trips"),
    costBreakdown: costBreakdownValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const trip = await ctx.db.get(args.id);
    if (!trip) {
      throw new Error("Trip not found");
    }

    await ctx.db.patch(args.id, {
      costBreakdown: args.costBreakdown,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Update agent notes (admin or agent)
export const updateAgentNotes = mutation({
  args: {
    id: v.id("trips"),
    agentNotes: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const trip = await ctx.db.get(args.id);
    if (!trip) {
      throw new Error("Trip not found");
    }

    await ctx.db.patch(args.id, {
      agentNotes: args.agentNotes,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Link itinerary to trip
export const linkItinerary = mutation({
  args: {
    tripId: v.id("trips"),
    itineraryId: v.id("itineraries"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }

    const itinerary = await ctx.db.get(args.itineraryId);
    if (!itinerary) {
      throw new Error("Itinerary not found");
    }

    await ctx.db.patch(args.tripId, {
      itineraryId: args.itineraryId,
      updatedAt: Date.now(),
    });

    return args.tripId;
  },
});

// Set policy compliance
export const setPolicyCompliance = mutation({
  args: {
    id: v.id("trips"),
    policyCompliance: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const trip = await ctx.db.get(args.id);
    if (!trip) {
      throw new Error("Trip not found");
    }

    await ctx.db.patch(args.id, {
      policyCompliance: args.policyCompliance,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Get trip statistics for an event
export const getEventStats = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const trips = await ctx.db
      .query("trips")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();

    const stats = {
      total: trips.length,
      pending: trips.filter((t) => t.status === "pending").length,
      generating: trips.filter((t) => t.status === "generating").length,
      booked: trips.filter((t) => t.status === "booked").length,
      inProgress: trips.filter((t) => t.status === "in_progress").length,
      completed: trips.filter((t) => t.status === "completed").length,
      failed: trips.filter((t) => t.status === "failed").length,
      cancelled: trips.filter((t) => t.status === "cancelled").length,
      totalCost: trips.reduce((sum, t) => sum + (t.costBreakdown?.total ?? 0), 0),
      policyCompliant: trips.filter((t) => t.policyCompliance === true).length,
    };

    return stats;
  },
});
