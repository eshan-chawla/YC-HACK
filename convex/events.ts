import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAdmin, requireAuth } from "./auth.helpers";

// Event requirements validator
const eventRequirementsValidator = v.object({
  preferredAirlines: v.optional(v.array(v.string())),
  preferredHotels: v.optional(v.array(v.string())),
  maxFlightDuration: v.optional(v.number()),
  cabinClass: v.optional(v.union(v.literal("economy"), v.literal("premium_economy"), v.literal("business"), v.literal("first"))),
  requireDirectFlights: v.optional(v.boolean()),
  mealAllowancePerDay: v.optional(v.number()),
  groundTransportLimit: v.optional(v.number()),
  customRestrictions: v.optional(v.string()),
});

// Get all events (admin sees all, employees see their events)
export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    let events;
    if (user.role === "admin") {
      // Admins see all events
      if (args.status) {
        events = await ctx.db
          .query("events")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(args.limit ?? 100);
      } else {
        events = await ctx.db
          .query("events")
          .order("desc")
          .take(args.limit ?? 100);
      }
    } else {
      // Employees see only events they're part of
      if (!user.employeeId) {
        return [];
      }
      
      // Get trips for this employee
      const trips = await ctx.db
        .query("trips")
        .withIndex("by_employeeId", (q) => q.eq("employeeId", user.employeeId!))
        .collect();

      const eventIds = [...new Set(trips.map((t) => t.eventId))];
      
      events = await Promise.all(
        eventIds.map((id) => ctx.db.get(id))
      );
      
      // Filter out null values and apply status filter
      events = events.filter((e): e is NonNullable<typeof e> => {
        if (!e) return false;
        if (args.status && e.status !== args.status) return false;
        return true;
      });
    }

    return events;
  },
});

// Get a single event by ID
export const get = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const event = await ctx.db.get(args.id);
    
    if (!event) {
      return null;
    }

    // Check access
    if (user.role === "employee") {
      if (!user.employeeId || !event.employeeIds.includes(user.employeeId)) {
        throw new Error("Unauthorized: You don't have access to this event");
      }
    }

    return event;
  },
});

// Get event with employee details
export const getWithEmployees = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const event = await ctx.db.get(args.id);
    if (!event) {
      return null;
    }

    const employees = await Promise.all(
      event.employeeIds.map((id) => ctx.db.get(id))
    );

    return {
      ...event,
      employees: employees.filter((e): e is NonNullable<typeof e> => e !== null),
    };
  },
});

// Create a new event (admin only)
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    destination: v.string(),
    secondaryDestination: v.optional(v.string()),
    departureDate: v.number(),
    returnDate: v.number(),
    departureTime: v.optional(v.string()),
    budgetPerEmployee: v.number(),
    totalBudget: v.number(),
    employeeIds: v.array(v.id("employees")),
    requirements: v.optional(eventRequirementsValidator),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);

    // Validate dates
    if (args.departureDate >= args.returnDate) {
      throw new Error("Return date must be after departure date");
    }

    if (args.departureDate < Date.now()) {
      throw new Error("Departure date must be in the future");
    }

    // Validate employees exist and are active
    for (const empId of args.employeeIds) {
      const emp = await ctx.db.get(empId);
      if (!emp) {
        throw new Error(`Employee ${empId} not found`);
      }
      if (emp.status !== "active") {
        throw new Error(`Employee ${emp.name} is not active`);
      }
    }

    const now = Date.now();
    const eventId = await ctx.db.insert("events", {
      name: args.name,
      description: args.description,
      destination: args.destination,
      secondaryDestination: args.secondaryDestination,
      departureDate: args.departureDate,
      returnDate: args.returnDate,
      departureTime: args.departureTime,
      budgetPerEmployee: args.budgetPerEmployee,
      totalBudget: args.totalBudget,
      employeeIds: args.employeeIds,
      requirements: args.requirements,
      status: args.status ?? "draft",
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    // Create trip records for each employee
    for (const empId of args.employeeIds) {
      await ctx.db.insert("trips", {
        eventId,
        employeeId: empId,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });
    }

    return eventId;
  },
});

// Update an event (admin only)
export const update = mutation({
  args: {
    id: v.id("events"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    destination: v.optional(v.string()),
    secondaryDestination: v.optional(v.string()),
    departureDate: v.optional(v.number()),
    returnDate: v.optional(v.number()),
    departureTime: v.optional(v.string()),
    budgetPerEmployee: v.optional(v.number()),
    totalBudget: v.optional(v.number()),
    requirements: v.optional(eventRequirementsValidator),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { id, ...updates } = args;
    const event = await ctx.db.get(id);
    if (!event) {
      throw new Error("Event not found");
    }

    // Validate dates if being changed
    const newDeparture = updates.departureDate ?? event.departureDate;
    const newReturn = updates.returnDate ?? event.returnDate;
    if (newDeparture >= newReturn) {
      throw new Error("Return date must be after departure date");
    }

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Add employees to event (admin only)
export const addEmployees = mutation({
  args: {
    eventId: v.id("events"),
    employeeIds: v.array(v.id("employees")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const now = Date.now();
    const newEmployeeIds = [...event.employeeIds];

    for (const empId of args.employeeIds) {
      // Validate employee
      const emp = await ctx.db.get(empId);
      if (!emp) {
        throw new Error(`Employee ${empId} not found`);
      }
      if (emp.status !== "active") {
        throw new Error(`Employee ${emp.name} is not active`);
      }

      // Check if already in event
      if (!newEmployeeIds.includes(empId)) {
        newEmployeeIds.push(empId);

        // Create trip record
        await ctx.db.insert("trips", {
          eventId: args.eventId,
          employeeId: empId,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.eventId, {
      employeeIds: newEmployeeIds,
      updatedAt: now,
    });

    return args.eventId;
  },
});

// Remove employee from event (admin only)
export const removeEmployee = mutation({
  args: {
    eventId: v.id("events"),
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if event status allows removal
    if (event.status === "completed" || event.status === "active") {
      throw new Error("Cannot remove employee from active or completed event");
    }

    // Remove employee from list
    const newEmployeeIds = event.employeeIds.filter((id) => id !== args.employeeId);

    // Delete trip record
    const trip = await ctx.db
      .query("trips")
      .withIndex("by_eventId_employeeId", (q) =>
        q.eq("eventId", args.eventId).eq("employeeId", args.employeeId)
      )
      .first();

    if (trip) {
      // Delete associated itinerary if exists
      if (trip.itineraryId) {
        await ctx.db.delete(trip.itineraryId);
      }
      await ctx.db.delete(trip._id);
    }

    await ctx.db.patch(args.eventId, {
      employeeIds: newEmployeeIds,
      updatedAt: Date.now(),
    });

    return args.eventId;
  },
});

// Send event (change status to pending and notify employees)
export const send = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const event = await ctx.db.get(args.id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.status !== "draft") {
      throw new Error("Can only send events in draft status");
    }

    if (event.employeeIds.length === 0) {
      throw new Error("Cannot send event without employees");
    }

    await ctx.db.patch(args.id, {
      status: "pending",
      sentAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Cancel event (admin only)
export const cancel = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const event = await ctx.db.get(args.id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.status === "completed") {
      throw new Error("Cannot cancel completed event");
    }

    // Update all trips to cancelled
    const trips = await ctx.db
      .query("trips")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.id))
      .collect();

    for (const trip of trips) {
      await ctx.db.patch(trip._id, {
        status: "cancelled",
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.id, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
