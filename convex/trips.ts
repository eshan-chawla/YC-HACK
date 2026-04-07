import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAdmin, requireAuth, canAccessEmployee } from "./auth.helpers";
import { getAdminUserIds, notifyUsers } from "./notifications";

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

// Get trips for current user with event populated (for employee dashboard)
export const listMineWithEvents = query({
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

    const trips = await ctx.db
      .query("trips")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", user.employeeId!))
      .collect();

    const filtered = args.status ? trips.filter((t) => t.status === args.status) : trips;

    const withEvents = await Promise.all(
      filtered.map(async (trip) => {
        const event = await ctx.db.get(trip.eventId);
        const itinerary = trip.itineraryId ? await ctx.db.get(trip.itineraryId) : null;
        return { ...trip, event, itinerary };
      })
    );

    return withEvents;
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
      
      // Generate confirmation number: TW-{timestamp}-{shortHash}
      const timestamp = Date.now().toString(36).slice(-6);
      const shortHash = Math.random().toString(36).slice(2, 6).toUpperCase();
      updates.confirmationNumber = `TW-${timestamp}-${shortHash}`;
      
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

    if (args.status === "booked" || args.status === "failed") {
      const event = await ctx.db.get(trip.eventId);
      const employee = await ctx.db.get(trip.employeeId);
      const eventName = event?.name ?? "Event";
      const employeeName = employee?.name ?? "Employee";
      const adminIds = await getAdminUserIds(ctx);
      const linkedProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_employeeId", (q) => q.eq("employeeId", trip.employeeId))
        .first();

      if (args.status === "booked") {
        await notifyUsers(ctx, adminIds, {
          type: "success",
          title: "Booking confirmed",
          message: `${employeeName}'s booking for ${eventName} has been confirmed.`,
          eventId: trip.eventId,
          tripId: args.id,
        });
        if (linkedProfile && !adminIds.includes(linkedProfile._id)) {
          await notifyUsers(ctx, [linkedProfile._id], {
            type: "success",
            title: "Booking confirmed",
            message: `Your booking for ${eventName} is confirmed.`,
            eventId: trip.eventId,
            tripId: args.id,
          });
        }
      } else {
        const failMsg = args.failureReason
          ? `${employeeName}'s booking failed. ${args.failureReason}`
          : `${employeeName}'s booking failed. Please retry.`;
        await notifyUsers(ctx, adminIds, {
          type: "error",
          title: "Booking failed",
          message: failMsg,
          eventId: trip.eventId,
          tripId: args.id,
        });
        if (linkedProfile && !adminIds.includes(linkedProfile._id)) {
          await notifyUsers(ctx, [linkedProfile._id], {
            type: "error",
            title: "Booking failed",
            message: `Your booking for ${eventName} failed. Please retry or contact support.`,
            eventId: trip.eventId,
            tripId: args.id,
          });
        }
      }

      if (args.status === "booked" && trip.costBreakdown && event) {
        const budgetLimit = event.budgetPerEmployee ?? event.totalBudget;
        if (budgetLimit != null && trip.costBreakdown.total > budgetLimit) {
          const over = trip.costBreakdown.total - budgetLimit;
          await notifyUsers(ctx, adminIds, {
            type: "warning",
            title: "Budget alert",
            message: `${employeeName}'s trip exceeds budget by $${Math.round(over).toLocaleString()}. Requires approval.`,
            eventId: trip.eventId,
            tripId: args.id,
          });
        }
      }
    }

    // When trip completes, append to employee's travel history for agent memory
    if (args.status === "completed") {
      const event = trip.eventId ? await ctx.db.get(trip.eventId) : null;
      const itinerary = trip.itineraryId ? await ctx.db.get(trip.itineraryId) : null;

      if (event) {
        const employee = await ctx.db.get(trip.employeeId);
        const history = employee?.travelHistory ?? [];
        await ctx.db.patch(trip.employeeId, {
          travelHistory: [
            ...history,
            {
              destination: event.destination,
              departureDate: event.departureDate,
              returnDate: event.returnDate,
              hotelChain: itinerary?.data?.hotel?.name,
              airline: itinerary?.data?.outboundFlight?.airline,
              preferences: employee?.restrictions?.seating
                ? `Seat: ${employee.restrictions.seating}`
                : undefined,
            },
          ],
          updatedAt: Date.now(),
        });
      }
    }

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

    const event = await ctx.db.get(trip.eventId);
    const budgetLimit = event?.budgetPerEmployee ?? event?.totalBudget;
    if (event && budgetLimit != null && args.costBreakdown.total > budgetLimit) {
      const employee = await ctx.db.get(trip.employeeId);
      const employeeName = employee?.name ?? "Employee";
      const over = args.costBreakdown.total - budgetLimit;
      const adminIds = await getAdminUserIds(ctx);
      await notifyUsers(ctx, adminIds, {
        type: "warning",
        title: "Budget alert",
        message: `${employeeName}'s trip exceeds budget by $${Math.round(over).toLocaleString()}. Requires approval.`,
        eventId: trip.eventId,
        tripId: args.id,
      });
    }

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

// Get all change requests for a trip
export const listChangeRequestsByTrip = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    
    const requests = await ctx.db
      .query("changeRequests")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .order("desc")
      .collect();
    
    // Filter for employee users (they can only see their own)
    if (user.role === "employee" && user.employeeId) {
      return requests.filter((r) => r.employeeId === user.employeeId);
    }
    
    return requests;
  },
});

// Get all pending change requests (admin only)
export const listPendingChangeRequests = query({
  args: { eventId: v.optional(v.id("events")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    let requests = await ctx.db
      .query("changeRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
    
    if (args.eventId) {
      requests = requests.filter((r) => r.eventId === args.eventId);
    }
    
    // Populate trip, employee, and event info
    const withDetails = await Promise.all(
      requests.map(async (r) => {
        const trip = await ctx.db.get(r.tripId);
        const employee = await ctx.db.get(r.employeeId);
        const event = await ctx.db.get(r.eventId);
        return {
          ...r,
          employeeName: employee?.name ?? "Unknown",
          eventName: event?.name ?? "Unknown Event",
          tripStatus: trip?.status,
        };
      })
    );

    return withDetails;
  },
});

// Submit a change request (employee)
export const submitChangeRequest = mutation({
  args: {
    tripId: v.id("trips"),
    requestType: v.union(
      v.literal("flight_change"),
      v.literal("hotel_change"),
      v.literal("transport_change"),
      v.literal("general")
    ),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    
    if (!user.employeeId) {
      throw new Error("Only employees can submit change requests");
    }
    
    // Verify the trip belongs to this employee
    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }
    if (trip.employeeId !== user.employeeId) {
      throw new Error("Unauthorized: Cannot request changes for another employee's trip");
    }
    
    const now = Date.now();
    const requestId = await ctx.db.insert("changeRequests", {
      tripId: args.tripId,
      employeeId: user.employeeId,
      eventId: trip.eventId,
      status: "pending",
      requestType: args.requestType,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });
    
    // Notify admins
    const adminIds = await getAdminUserIds(ctx);
    const event = await ctx.db.get(trip.eventId);
    await notifyUsers(ctx, adminIds, {
      type: "info",
      title: "Change request submitted",
      message: `Employee requested a change for ${event?.name || 'event'}`,
      eventId: trip.eventId,
      tripId: args.tripId,
    });
    
    return requestId;
  },
});

// Approve or reject a change request (admin)
export const respondToChangeRequest = mutation({
  args: {
    requestId: v.id("changeRequests"),
    action: v.union(v.literal("approved"), v.literal("rejected")),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Change request not found");
    }
    
    if (request.status !== "pending") {
      throw new Error("Change request has already been processed");
    }
    
    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: args.action,
      adminNotes: args.adminNotes,
      updatedAt: now,
      respondedAt: now,
    });
    
    // Notify employee
    const trip = await ctx.db.get(request.tripId);
    const employee = await ctx.db.get(request.employeeId);
    const event = await ctx.db.get(request.eventId);
    
    const linkedProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", request.employeeId))
      .first();
    
    if (linkedProfile) {
      await notifyUsers(ctx, [linkedProfile._id], {
        type: args.action === "approved" ? "success" : "warning",
        title: args.action === "approved" ? "Change request approved" : "Change request declined",
        message: args.adminNotes 
          ? `Your request for ${event?.name || 'trip'} was ${args.action}. ${args.adminNotes}`
          : `Your request for ${event?.name || 'trip'} was ${args.action}.`,
        eventId: request.eventId,
        tripId: request.tripId,
      });
    }
    
    return { success: true, status: args.action };
  },
});
