import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAdmin, requireAuth } from "./auth.helpers";
import { getAdminUserIds, notifyUsers } from "./notifications";

// Employee restrictions validator (duplicated for use in mutations)
const employeeRestrictionsValidator = v.object({
  dietary: v.optional(v.array(v.string())),
  mobility: v.optional(v.string()),
  seating: v.optional(v.string()),
  hotelPreferences: v.optional(v.array(v.string())),
  other: v.optional(v.string()),
});

// Get all employees (admin only)
export const list = query({
  args: {
    team: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = args.limit ?? 100;

    // Use separate code paths to avoid TypeScript type narrowing issues
    if (args.team) {
      return ctx.db
        .query("employees")
        .withIndex("by_team", (q) => q.eq("team", args.team!))
        .order("desc")
        .take(limit);
    } else if (args.status) {
      return ctx.db
        .query("employees")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    } else {
      return ctx.db
        .query("employees")
        .order("desc")
        .take(limit);
    }
  },
});

// Get a single employee by ID
export const get = query({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const employee = await ctx.db.get(args.id);
    return employee;
  },
});

// Get employee by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const employee = await ctx.db
      .query("employees")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return employee;
  },
});

// Get employees by team
export const getByTeam = query({
  args: { team: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_team", (q) => q.eq("team", args.team))
      .collect();
    return employees;
  },
});

// Create a new employee (admin only)
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    team: v.string(),
    role: v.string(),
    department: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    restrictions: v.optional(employeeRestrictionsValidator),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Check if employee with this email already exists
    const existing = await ctx.db
      .query("employees")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Employee with this email already exists");
    }

    const now = Date.now();
    const id = await ctx.db.insert("employees", {
      name: args.name,
      email: args.email,
      team: args.team,
      role: args.role,
      department: args.department,
      location: args.location,
      status: args.status ?? "active",
      restrictions: args.restrictions,
      profileImage: args.profileImage,
      totalTripsBooked: 0,
      createdAt: now,
      updatedAt: now,
    });

    const adminIds = await getAdminUserIds(ctx);
    await notifyUsers(ctx, adminIds, {
      type: "info",
      title: "New team member",
      message: `${args.name} has been added to the team.`,
    });

    return id;
  },
});

// Update an employee (admin only)
export const update = mutation({
  args: {
    id: v.id("employees"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    team: v.optional(v.string()),
    role: v.optional(v.string()),
    department: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    restrictions: v.optional(employeeRestrictionsValidator),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { id, ...updates } = args;
    const employee = await ctx.db.get(id);
    if (!employee) {
      throw new Error("Employee not found");
    }

    // If email is being changed, check for duplicates
    if (updates.email && updates.email !== employee.email) {
      const existing = await ctx.db
        .query("employees")
        .withIndex("by_email", (q) => q.eq("email", updates.email!))
        .first();
      if (existing) {
        throw new Error("Employee with this email already exists");
      }
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

// Update employee restrictions (employee can update their own)
export const updateRestrictions = mutation({
  args: {
    id: v.id("employees"),
    restrictions: employeeRestrictionsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const employee = await ctx.db.get(args.id);
    
    if (!employee) {
      throw new Error("Employee not found");
    }

    // Employees can only update their own restrictions
    if (user.role === "employee" && user.employeeId !== args.id) {
      throw new Error("Unauthorized: Cannot update another employee's restrictions");
    }

    await ctx.db.patch(args.id, {
      restrictions: args.restrictions,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Delete an employee (admin only)
export const remove = mutation({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const employee = await ctx.db.get(args.id);
    if (!employee) {
      throw new Error("Employee not found");
    }

    // Check if employee has any active trips
    const activeTrips = await ctx.db
      .query("trips")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", args.id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "booked"),
          q.eq(q.field("status"), "in_progress")
        )
      )
      .first();

    if (activeTrips) {
      throw new Error("Cannot delete employee with active trips");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Append a completed trip to an employee's travel history (internal use)
export const appendTravelHistory = mutation({
  args: {
    employeeId: v.id("employees"),
    entry: v.object({
      destination: v.string(),
      departureDate: v.number(),
      returnDate: v.number(),
      hotelChain: v.optional(v.string()),
      airline: v.optional(v.string()),
      preferences: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found");

    const history = employee.travelHistory ?? [];
    await ctx.db.patch(args.employeeId, {
      travelHistory: [...history, args.entry],
      updatedAt: Date.now(),
    });
  },
});

// Update inferred preferences for an employee (internal use)
export const updateInferredPreferences = mutation({
  args: {
    employeeId: v.id("employees"),
    preferences: v.object({
      seatPreference: v.optional(v.string()),
      hotelTier: v.optional(v.string()),
      budgetRange: v.optional(v.string()),
      notes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found");

    await ctx.db.patch(args.employeeId, {
      inferredPreferences: args.preferences,
      updatedAt: Date.now(),
    });
  },
});

// Get employee with memory context (for agent personalization)
export const getWithMemory = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) return null;

    return {
      name: employee.name,
      restrictions: employee.restrictions,
      travelHistory: employee.travelHistory ?? [],
      inferredPreferences: employee.inferredPreferences ?? null,
      frequentFlyerNumbers: employee.frequentFlyerNumbers ?? [],
      loyaltyPrograms: employee.loyaltyPrograms ?? [],
    };
  },
});

// Get employee statistics (admin only)
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const employees = await ctx.db.query("employees").collect();

    const stats = {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((e) => e.status === "active").length,
      inactiveEmployees: employees.filter((e) => e.status === "inactive").length,
      teamBreakdown: {} as Record<string, number>,
    };

    for (const emp of employees) {
      stats.teamBreakdown[emp.team] = (stats.teamBreakdown[emp.team] || 0) + 1;
    }

    return stats;
  },
});
