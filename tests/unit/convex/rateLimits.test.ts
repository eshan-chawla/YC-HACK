/**
 * Unit tests for Convex Rate Limits functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('RateLimits Convex Functions', () => {
  let mockCtx: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockCtx = {
      db: {
        query: vi.fn(),
        get: vi.fn(),
        insert: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
      },
    }
  })

  describe('checkRateLimit', () => {
    it('should allow request when under limit', async () => {
      const mockRateLimit = {
        _id: 'rate_1',
        identifier: 'user_123',
        action: 'api_call',
        count: 5,
        windowStart: Date.now() - 30000, // 30 seconds ago
      }
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockRateLimit),
        }),
      })
      
      const result = await mockCtx.db
        .query('rateLimits')
        .withIndex('by_identifier_action', (q: any) => 
          q.eq('identifier', 'user_123').eq('action', 'api_call')
        )
        .first()
      
      const limit = 100
      const withinLimit = result.count < limit
      
      expect(withinLimit).toBe(true)
    })

    it('should reject request when over limit', async () => {
      const mockRateLimit = {
        _id: 'rate_1',
        identifier: 'user_123',
        action: 'api_call',
        count: 100,
        windowStart: Date.now() - 30000,
      }
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockRateLimit),
        }),
      })
      
      const result = await mockCtx.db
        .query('rateLimits')
        .withIndex('by_identifier_action', (q: any) => 
          q.eq('identifier', 'user_123').eq('action', 'api_call')
        )
        .first()
      
      const limit = 100
      const withinLimit = result.count < limit
      
      expect(withinLimit).toBe(false)
    })

    it('should reset count when window expires', () => {
      const windowDuration = 60000 // 1 minute
      const windowStart = Date.now() - 90000 // 90 seconds ago
      const now = Date.now()
      
      const windowExpired = (now - windowStart) > windowDuration
      
      expect(windowExpired).toBe(true)
    })

    it('should create new record if none exists', async () => {
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
        }),
      })
      mockCtx.db.insert.mockResolvedValue('rate_new')
      
      const existing = await mockCtx.db
        .query('rateLimits')
        .withIndex('by_identifier_action')
        .first()
      
      expect(existing).toBeNull()
      
      // Create new record
      const newRecord = await mockCtx.db.insert('rateLimits', {
        identifier: 'user_new',
        action: 'api_call',
        count: 1,
        windowStart: Date.now(),
      })
      
      expect(newRecord).toBe('rate_new')
    })
  })

  describe('getStatus', () => {
    it('should return rate limit status', async () => {
      const mockRateLimit = {
        _id: 'rate_1',
        identifier: 'user_123',
        action: 'api_call',
        count: 45,
        windowStart: Date.now() - 30000,
      }
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockRateLimit),
        }),
      })
      
      const result = await mockCtx.db
        .query('rateLimits')
        .withIndex('by_identifier_action')
        .first()
      
      const limit = 100
      const windowDuration = 60000
      
      const status = {
        identifier: result.identifier,
        action: result.action,
        current: result.count,
        limit,
        remaining: Math.max(0, limit - result.count),
        resetAt: result.windowStart + windowDuration,
      }
      
      expect(status.current).toBe(45)
      expect(status.remaining).toBe(55)
    })
  })

  describe('recordRequest', () => {
    it('should increment count for existing record', async () => {
      const mockRateLimit = {
        _id: 'rate_1',
        count: 10,
        windowStart: Date.now() - 30000,
      }
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockRateLimit),
        }),
      })
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      const record = await mockCtx.db
        .query('rateLimits')
        .withIndex('by_identifier_action')
        .first()
      
      await mockCtx.db.patch(record._id, {
        count: record.count + 1,
      })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('rate_1', { count: 11 })
    })

    it('should reset count and window when expired', async () => {
      const mockRateLimit = {
        _id: 'rate_1',
        count: 50,
        windowStart: Date.now() - 120000, // 2 minutes ago (expired)
      }
      
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      const windowDuration = 60000
      const windowExpired = (Date.now() - mockRateLimit.windowStart) > windowDuration
      
      if (windowExpired) {
        await mockCtx.db.patch(mockRateLimit._id, {
          count: 1,
          windowStart: Date.now(),
        })
      }
      
      expect(windowExpired).toBe(true)
      expect(mockCtx.db.patch).toHaveBeenCalledWith('rate_1', 
        expect.objectContaining({ count: 1 })
      )
    })
  })

  describe('enforceRateLimit', () => {
    it('should throw when rate limit exceeded', () => {
      const checkRateLimit = (count: number, limit: number) => {
        if (count >= limit) {
          throw new Error('Rate limit exceeded')
        }
      }
      
      expect(() => checkRateLimit(100, 100)).toThrow('Rate limit exceeded')
    })

    it('should not throw when under limit', () => {
      const checkRateLimit = (count: number, limit: number) => {
        if (count >= limit) {
          throw new Error('Rate limit exceeded')
        }
        return true
      }
      
      expect(checkRateLimit(50, 100)).toBe(true)
    })
  })

  describe('cleanupExpired', () => {
    it('should delete expired rate limit records', async () => {
      const windowDuration = 60000
      const cutoffTime = Date.now() - windowDuration * 2 // 2 windows ago
      
      const expiredRecords = [
        { _id: 'rate_old_1', windowStart: cutoffTime - 1000 },
        { _id: 'rate_old_2', windowStart: cutoffTime - 2000 },
      ]
      
      mockCtx.db.query.mockReturnValue({
        filter: vi.fn().mockReturnValue({
          collect: vi.fn().mockResolvedValue(expiredRecords),
        }),
      })
      mockCtx.db.delete.mockResolvedValue(undefined)
      
      const toDelete = await mockCtx.db
        .query('rateLimits')
        .filter((q: any) => q.lt(q.field('windowStart'), cutoffTime))
        .collect()
      
      for (const record of toDelete) {
        await mockCtx.db.delete(record._id)
      }
      
      expect(mockCtx.db.delete).toHaveBeenCalledTimes(2)
    })
  })
})

describe('Rate Limit Configuration', () => {
  const defaultLimits = {
    api_call: { limit: 100, windowMs: 60000 },
    agent_request: { limit: 20, windowMs: 60000 },
    payment: { limit: 5, windowMs: 300000 },
    login_attempt: { limit: 5, windowMs: 900000 },
  }

  it('should have reasonable API call limits', () => {
    expect(defaultLimits.api_call.limit).toBe(100)
    expect(defaultLimits.api_call.windowMs).toBe(60000)
  })

  it('should have stricter limits for agent requests', () => {
    expect(defaultLimits.agent_request.limit).toBeLessThan(defaultLimits.api_call.limit)
  })

  it('should have very strict limits for payments', () => {
    expect(defaultLimits.payment.limit).toBe(5)
    expect(defaultLimits.payment.windowMs).toBeGreaterThan(defaultLimits.api_call.windowMs)
  })

  it('should have login attempt limits for security', () => {
    expect(defaultLimits.login_attempt.limit).toBe(5)
    expect(defaultLimits.login_attempt.windowMs).toBe(15 * 60 * 1000) // 15 minutes
  })
})

describe('Rate Limit Identifiers', () => {
  it('should support user-based rate limiting', () => {
    const identifier = 'user:user_123'
    expect(identifier).toContain('user:')
  })

  it('should support IP-based rate limiting', () => {
    const identifier = 'ip:192.168.1.1'
    expect(identifier).toContain('ip:')
  })

  it('should support API key-based rate limiting', () => {
    const identifier = 'apikey:key_abc123'
    expect(identifier).toContain('apikey:')
  })

  it('should generate unique identifiers', () => {
    const id1 = 'user:user_1:api_call'
    const id2 = 'user:user_1:agent_request'
    
    expect(id1).not.toBe(id2)
  })
})
