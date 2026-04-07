import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { MutationCtx, QueryCtx } from "./_generated/server";

// Rate limit configuration
export const RATE_LIMITS = {
  // Auth endpoints
  "auth:login": { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  "auth:signup": { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 signups per hour
  "auth:password_reset": { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 resets per hour
  
  // API endpoints
  "api:agent": { windowMs: 60 * 1000, maxRequests: 20 }, // 20 agent calls per minute
  "api:itinerary_generate": { windowMs: 60 * 1000, maxRequests: 5 }, // 5 generations per minute
  "api:search": { windowMs: 60 * 1000, maxRequests: 30 }, // 30 searches per minute
  
  // Default
  "default": { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;

/**
 * Check if a request should be rate limited
 * Returns true if the request is allowed, false if rate limited
 */
export async function checkRateLimit(
  ctx: QueryCtx | MutationCtx,
  key: string,
  identifier: string,
  limitConfig?: { windowMs: number; maxRequests: number }
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const fullKey = `${key}:${identifier}`;
  const config = limitConfig ?? RATE_LIMITS[key as RateLimitKey] ?? RATE_LIMITS.default;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get existing rate limit record
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", fullKey))
    .first();

  if (!existing) {
    // No record exists, request is allowed
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Check if window has expired
  if (existing.windowStart < windowStart) {
    // Window expired, reset count
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Check if under limit
  const remaining = config.maxRequests - existing.count - 1;
  return {
    allowed: existing.count < config.maxRequests,
    remaining: Math.max(0, remaining),
    resetAt: existing.expiresAt,
  };
}

/**
 * Record a request for rate limiting
 * Call this after checkRateLimit returns allowed: true
 */
export const recordRequest = internalMutation({
  args: {
    key: v.string(),
    identifier: v.string(),
    windowMs: v.number(),
  },
  handler: async (ctx, args) => {
    const fullKey = `${args.key}:${args.identifier}`;
    const now = Date.now();
    const windowStart = now - args.windowMs;

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", fullKey))
      .first();

    if (!existing || existing.windowStart < windowStart) {
      // Create new record or reset expired one
      if (existing) {
        await ctx.db.patch(existing._id, {
          count: 1,
          windowStart: now,
          expiresAt: now + args.windowMs,
        });
      } else {
        await ctx.db.insert("rateLimits", {
          key: fullKey,
          count: 1,
          windowStart: now,
          expiresAt: now + args.windowMs,
        });
      }
    } else {
      // Increment existing count
      await ctx.db.patch(existing._id, {
        count: existing.count + 1,
      });
    }
  },
});

/**
 * Combined check and record function for mutations
 * Throws error if rate limited
 */
export async function enforceRateLimit(
  ctx: MutationCtx,
  key: string,
  identifier: string
): Promise<void> {
  const config = RATE_LIMITS[key as RateLimitKey] ?? RATE_LIMITS.default;
  const fullKey = `${key}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", fullKey))
    .first();

  if (existing && existing.windowStart >= windowStart) {
    if (existing.count >= config.maxRequests) {
      const retryAfter = Math.ceil((existing.expiresAt - now) / 1000);
      throw new Error(`Rate limited. Try again in ${retryAfter} seconds.`);
    }

    // Increment count
    await ctx.db.patch(existing._id, {
      count: existing.count + 1,
    });
  } else if (existing) {
    // Reset expired window
    await ctx.db.patch(existing._id, {
      count: 1,
      windowStart: now,
      expiresAt: now + config.windowMs,
    });
  } else {
    // Create new record
    await ctx.db.insert("rateLimits", {
      key: fullKey,
      count: 1,
      windowStart: now,
      expiresAt: now + config.windowMs,
    });
  }
}

// Daily agent usage config
const DAILY_AGENT_LIMIT = 50; // 50 agent calls per user per day
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Check and record agent usage for a user.
 * Enforces both per-minute and daily limits.
 * Returns { allowed, remaining, message } — call BEFORE sending to Gemini.
 */
export const checkAgentUsage = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check per-minute limit (api:agent)
    const minuteKey = `api:agent:${args.userId}`;
    const minuteConfig = RATE_LIMITS["api:agent"];
    const minuteRecord = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", minuteKey))
      .first();

    if (minuteRecord && minuteRecord.windowStart >= now - minuteConfig.windowMs) {
      if (minuteRecord.count >= minuteConfig.maxRequests) {
        const retryAfter = Math.ceil((minuteRecord.expiresAt - now) / 1000);
        return { allowed: false, remaining: 0, message: `Too many requests. Please wait ${retryAfter} seconds.` };
      }
    }

    // Check daily limit
    const dailyKey = `api:agent_daily:${args.userId}`;
    const dailyRecord = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", dailyKey))
      .first();

    if (dailyRecord && dailyRecord.windowStart >= now - DAY_MS) {
      if (dailyRecord.count >= DAILY_AGENT_LIMIT) {
        return { allowed: false, remaining: 0, message: "You've reached today's daily limit. Please try again tomorrow." };
      }
    }

    // Record per-minute usage
    if (minuteRecord && minuteRecord.windowStart >= now - minuteConfig.windowMs) {
      await ctx.db.patch(minuteRecord._id, { count: minuteRecord.count + 1 });
    } else if (minuteRecord) {
      await ctx.db.patch(minuteRecord._id, { count: 1, windowStart: now, expiresAt: now + minuteConfig.windowMs });
    } else {
      await ctx.db.insert("rateLimits", { key: minuteKey, count: 1, windowStart: now, expiresAt: now + minuteConfig.windowMs });
    }

    // Record daily usage
    if (dailyRecord && dailyRecord.windowStart >= now - DAY_MS) {
      await ctx.db.patch(dailyRecord._id, { count: dailyRecord.count + 1 });
    } else if (dailyRecord) {
      await ctx.db.patch(dailyRecord._id, { count: 1, windowStart: now, expiresAt: now + DAY_MS });
    } else {
      await ctx.db.insert("rateLimits", { key: dailyKey, count: 1, windowStart: now, expiresAt: now + DAY_MS });
    }

    const dailyUsed = (dailyRecord && dailyRecord.windowStart >= now - DAY_MS) ? dailyRecord.count + 1 : 1;
    return { allowed: true, remaining: DAILY_AGENT_LIMIT - dailyUsed, message: null };
  },
});

/**
 * Get agent usage statistics for admin dashboard
 */
export const getAgentUsageStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayAgo = now - DAY_MS;

    const dailyRecords = await ctx.db
      .query("rateLimits")
      .withIndex("by_key")
      .filter((q) =>
        q.and(
          q.gte(q.field("windowStart"), dayAgo),
          q.gte(q.field("count"), 1)
        )
      )
      .collect();

    const agentDailyRecords = dailyRecords.filter((r) => r.key.startsWith("api:agent_daily:"));
    const totalCallsToday = agentDailyRecords.reduce((sum, r) => sum + r.count, 0);
    const activeUsers = agentDailyRecords.length;

    return {
      totalCallsToday,
      activeUsers,
      dailyLimitPerUser: DAILY_AGENT_LIMIT,
      perMinuteLimit: RATE_LIMITS["api:agent"].maxRequests,
    };
  },
});

// Clean up expired rate limit records
export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const expired = await ctx.db
      .query("rateLimits")
      .withIndex("by_expiresAt")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const record of expired) {
      await ctx.db.delete(record._id);
    }

    return expired.length;
  },
});

// Get rate limit status for a key (admin/debugging)
export const getStatus = query({
  args: {
    key: v.string(),
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    const fullKey = `${args.key}:${args.identifier}`;
    const config = RATE_LIMITS[args.key as RateLimitKey] ?? RATE_LIMITS.default;

    const record = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", fullKey))
      .first();

    if (!record) {
      return {
        key: args.key,
        identifier: args.identifier,
        count: 0,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        windowMs: config.windowMs,
        resetAt: null,
        isLimited: false,
      };
    }

    const now = Date.now();
    const isExpired = record.expiresAt < now;
    const count = isExpired ? 0 : record.count;

    return {
      key: args.key,
      identifier: args.identifier,
      count,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - count),
      windowMs: config.windowMs,
      resetAt: isExpired ? null : record.expiresAt,
      isLimited: count >= config.maxRequests && !isExpired,
    };
  },
});
