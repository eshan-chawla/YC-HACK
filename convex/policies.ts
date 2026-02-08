import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./auth.helpers";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = args.limit ?? 100;
    return ctx.db
      .query("policies")
      .order("desc")
      .take(limit);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    maxBudget: v.number(),
    airlines: v.array(v.string()),
    hotels: v.array(v.string()),
    mealAllowance: v.number(),
    groundTransport: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    const now = Date.now();
    return ctx.db.insert("policies", {
      name: args.name,
      description: args.description,
      maxBudget: args.maxBudget,
      airlines: args.airlines,
      hotels: args.hotels,
      mealAllowance: args.mealAllowance,
      groundTransport: args.groundTransport,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("policies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    maxBudget: v.optional(v.number()),
    airlines: v.optional(v.array(v.string())),
    hotels: v.optional(v.array(v.string())),
    mealAllowance: v.optional(v.number()),
    groundTransport: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    const policy = await ctx.db.get(id);
    if (!policy) {
      throw new Error("Policy not found");
    }
    const filtered: Record<string, unknown> = {};
    if (updates.name !== undefined) filtered.name = updates.name;
    if (updates.description !== undefined) filtered.description = updates.description;
    if (updates.maxBudget !== undefined) filtered.maxBudget = updates.maxBudget;
    if (updates.airlines !== undefined) filtered.airlines = updates.airlines;
    if (updates.hotels !== undefined) filtered.hotels = updates.hotels;
    if (updates.mealAllowance !== undefined) filtered.mealAllowance = updates.mealAllowance;
    if (updates.groundTransport !== undefined) filtered.groundTransport = updates.groundTransport;
    filtered.updatedAt = Date.now();
    await ctx.db.patch(id, filtered);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("policies") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const policy = await ctx.db.get(args.id);
    if (!policy) {
      throw new Error("Policy not found");
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});
