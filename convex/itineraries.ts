import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireAdmin, requireAuth, getCurrentUser } from "./auth.helpers";
import { Id } from "./_generated/dataModel";

// Flight segment validator
const flightSegmentValidator = v.object({
  airline: v.string(),
  flightNumber: v.string(),
  departure: v.object({
    airport: v.string(),
    time: v.number(),
  }),
  arrival: v.object({
    airport: v.string(),
    time: v.number(),
  }),
  seat: v.optional(v.string()),
  cabin: v.string(),
  baggage: v.optional(v.string()),
  cost: v.number(),
});

// Hotel booking validator
const hotelBookingValidator = v.object({
  name: v.string(),
  address: v.string(),
  checkIn: v.number(),
  checkOut: v.number(),
  room: v.string(),
  nights: v.number(),
  costPerNight: v.number(),
  totalCost: v.number(),
});

// Transport booking validator
const transportBookingValidator = v.object({
  type: v.string(),
  from: v.string(),
  to: v.string(),
  time: v.number(),
  cost: v.number(),
});

// Full itinerary data validator
const itineraryDataValidator = v.object({
  outboundFlight: v.optional(flightSegmentValidator),
  hotel: v.optional(hotelBookingValidator),
  groundTransport: v.optional(transportBookingValidator),
  returnFlight: v.optional(flightSegmentValidator),
});

// Get itinerary by ID
export const get = query({
  args: { id: v.id("itineraries") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const itinerary = await ctx.db.get(args.id);

    if (!itinerary) {
      return null;
    }

    // Check access - employee can only view their own
    if (user.role === "employee" && user.employeeId !== itinerary.employeeId) {
      throw new Error("Unauthorized: Cannot view another employee's itinerary");
    }

    return itinerary;
  },
});

// Get itinerary by trip ID
export const getByTrip = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      return null;
    }

    // Check access
    if (user.role === "employee" && user.employeeId !== trip.employeeId) {
      throw new Error("Unauthorized: Cannot view another employee's itinerary");
    }

    if (!trip.itineraryId) {
      return null;
    }

    return ctx.db.get(trip.itineraryId);
  },
});

// Get all itineraries for an event
export const listByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const itineraries = await ctx.db
      .query("itineraries")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();

    return itineraries;
  },
});

// Check if itinerary exists and is valid for given cache key
export const checkCache = query({
  args: {
    tripId: v.id("trips"),
    cacheKey: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const itinerary = await ctx.db
      .query("itineraries")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .first();

    if (!itinerary) {
      return { exists: false, valid: false };
    }

    const isValid = itinerary.cacheKey === args.cacheKey && 
                    itinerary.isValid && 
                    (!itinerary.validUntil || itinerary.validUntil > Date.now());

    return {
      exists: true,
      valid: isValid,
      itinerary: isValid ? itinerary : null,
    };
  },
});

// Create or update itinerary
export const upsert = mutation({
  args: {
    tripId: v.id("trips"),
    eventId: v.id("events"),
    employeeId: v.id("employees"),
    cacheKey: v.string(),
    data: itineraryDataValidator,
    generatedBy: v.string(),
    kiwiSearchId: v.optional(v.string()),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const now = Date.now();

    // Check if itinerary already exists for this trip
    const existing = await ctx.db
      .query("itineraries")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .first();

    if (existing) {
      // Update existing itinerary
      await ctx.db.patch(existing._id, {
        cacheKey: args.cacheKey,
        data: args.data,
        generatedAt: now,
        generatedBy: args.generatedBy,
        kiwiSearchId: args.kiwiSearchId,
        isValid: true,
        validUntil: args.validUntil,
        version: existing.version + 1,
      });

      // Update trip to link itinerary
      await ctx.db.patch(args.tripId, {
        itineraryId: existing._id,
        updatedAt: now,
      });

      return existing._id;
    }

    // Create new itinerary
    const itineraryId = await ctx.db.insert("itineraries", {
      tripId: args.tripId,
      eventId: args.eventId,
      employeeId: args.employeeId,
      cacheKey: args.cacheKey,
      data: args.data,
      generatedAt: now,
      generatedBy: args.generatedBy,
      kiwiSearchId: args.kiwiSearchId,
      isValid: true,
      validUntil: args.validUntil,
      version: 1,
    });

    // Update trip to link itinerary
    await ctx.db.patch(args.tripId, {
      itineraryId: itineraryId,
      updatedAt: now,
    });

    return itineraryId;
  },
});

// Invalidate itinerary (mark as needing regeneration)
export const invalidate = mutation({
  args: { id: v.id("itineraries") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const itinerary = await ctx.db.get(args.id);
    if (!itinerary) {
      throw new Error("Itinerary not found");
    }

    await ctx.db.patch(args.id, {
      isValid: false,
    });

    return args.id;
  },
});

// Invalidate all itineraries for an event (when requirements change)
export const invalidateByEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const itineraries = await ctx.db
      .query("itineraries")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const itinerary of itineraries) {
      await ctx.db.patch(itinerary._id, {
        isValid: false,
      });
    }

    return itineraries.length;
  },
});

// Delete itinerary
export const remove = mutation({
  args: { id: v.id("itineraries") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const itinerary = await ctx.db.get(args.id);
    if (!itinerary) {
      throw new Error("Itinerary not found");
    }

    // Remove link from trip
    const trip = await ctx.db.get(itinerary.tripId);
    if (trip && trip.itineraryId === args.id) {
      await ctx.db.patch(trip._id, {
        itineraryId: undefined,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Internal mutation for agent to create itineraries
export const createFromAgent = internalMutation({
  args: {
    tripId: v.id("trips"),
    eventId: v.id("events"),
    employeeId: v.id("employees"),
    cacheKey: v.string(),
    data: itineraryDataValidator,
    generatedBy: v.string(),
    kiwiSearchId: v.optional(v.string()),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if itinerary already exists
    const existing = await ctx.db
      .query("itineraries")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        cacheKey: args.cacheKey,
        data: args.data,
        generatedAt: now,
        generatedBy: args.generatedBy,
        kiwiSearchId: args.kiwiSearchId,
        isValid: true,
        validUntil: args.validUntil,
        version: existing.version + 1,
      });

      await ctx.db.patch(args.tripId, {
        itineraryId: existing._id,
        status: "booked",
        updatedAt: now,
      });

      return existing._id;
    }

    const itineraryId = await ctx.db.insert("itineraries", {
      tripId: args.tripId,
      eventId: args.eventId,
      employeeId: args.employeeId,
      cacheKey: args.cacheKey,
      data: args.data,
      generatedAt: now,
      generatedBy: args.generatedBy,
      kiwiSearchId: args.kiwiSearchId,
      isValid: true,
      validUntil: args.validUntil,
      version: 1,
    });

    await ctx.db.patch(args.tripId, {
      itineraryId: itineraryId,
      status: "booked",
      updatedAt: now,
    });

    return itineraryId;
  },
});

// Calculate cache key for itinerary
export const calculateCacheKey = query({
  args: {
    eventId: v.id("events"),
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    const employee = await ctx.db.get(args.employeeId);

    if (!event || !employee) {
      throw new Error("Event or employee not found");
    }

    // Create a deterministic string from the inputs
    const keyData = JSON.stringify({
      eventId: args.eventId,
      destination: event.destination,
      departureDate: event.departureDate,
      returnDate: event.returnDate,
      budgetPerEmployee: event.budgetPerEmployee,
      requirements: event.requirements,
      employeeRestrictions: employee.restrictions,
    });

    // Simple hash function (for production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < keyData.length; i++) {
      const char = keyData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return `cache_${Math.abs(hash).toString(16)}`;
  },
});
