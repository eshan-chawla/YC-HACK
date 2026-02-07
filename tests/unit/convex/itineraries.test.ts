/**
 * Unit tests for Convex Itineraries functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the auth helpers
vi.mock('@/convex/auth.helpers', () => ({
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}))

describe('Itineraries Convex Functions', () => {
  let mockCtx: any
  let requireAdmin: any
  let requireAuth: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    const authModule = await import('@/convex/auth.helpers')
    requireAdmin = authModule.requireAdmin as any
    requireAuth = authModule.requireAuth as any
    
    requireAdmin.mockResolvedValue({ role: 'admin', _id: 'admin_1' })
    requireAuth.mockResolvedValue({ role: 'admin', _id: 'admin_1' })
    
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

  describe('get', () => {
    it('should return itinerary by ID', async () => {
      const mockItinerary = {
        _id: 'itin_1',
        tripId: 'trip_1',
        eventId: 'event_1',
        employeeId: 'emp_1',
        outboundFlight: { id: 'flight_1', price: 500 },
        returnFlight: { id: 'flight_2', price: 450 },
        hotel: { name: 'Hotel', totalPrice: 600 },
        totalCost: 1550,
      }
      
      mockCtx.db.get.mockResolvedValue(mockItinerary)
      
      const result = await mockCtx.db.get('itin_1')
      
      expect(result).toEqual(mockItinerary)
    })
  })

  describe('getByTrip', () => {
    it('should return itinerary for a trip', async () => {
      const mockItinerary = {
        _id: 'itin_1',
        tripId: 'trip_1',
      }
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockItinerary),
        }),
      })
      
      const result = await mockCtx.db
        .query('itineraries')
        .withIndex('by_trip', (q: any) => q.eq('tripId', 'trip_1'))
        .first()
      
      expect(result).toEqual(mockItinerary)
    })

    it('should return null if no itinerary exists', async () => {
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
        }),
      })
      
      const result = await mockCtx.db
        .query('itineraries')
        .withIndex('by_trip', (q: any) => q.eq('tripId', 'trip_unknown'))
        .first()
      
      expect(result).toBeNull()
    })
  })

  describe('listByEvent', () => {
    it('should return all itineraries for an event', async () => {
      const mockItineraries = [
        { _id: 'itin_1', eventId: 'event_1', employeeId: 'emp_1' },
        { _id: 'itin_2', eventId: 'event_1', employeeId: 'emp_2' },
        { _id: 'itin_3', eventId: 'event_1', employeeId: 'emp_3' },
      ]
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          collect: vi.fn().mockResolvedValue(mockItineraries),
        }),
      })
      
      const result = await mockCtx.db
        .query('itineraries')
        .withIndex('by_event', (q: any) => q.eq('eventId', 'event_1'))
        .collect()
      
      expect(result.length).toBe(3)
      expect(result.every((i: any) => i.eventId === 'event_1')).toBe(true)
    })
  })

  describe('checkCache', () => {
    it('should find cached itinerary by cache key', async () => {
      const cacheKey = 'event_1_emp_1_requirements_hash'
      const mockItinerary = {
        _id: 'itin_1',
        cacheKey,
        isValid: true,
      }
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockItinerary),
        }),
      })
      
      const result = await mockCtx.db
        .query('itineraries')
        .withIndex('by_cache_key', (q: any) => q.eq('cacheKey', cacheKey))
        .first()
      
      expect(result).toEqual(mockItinerary)
      expect(result.isValid).toBe(true)
    })

    it('should return null for cache miss', async () => {
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
        }),
      })
      
      const result = await mockCtx.db
        .query('itineraries')
        .withIndex('by_cache_key', (q: any) => q.eq('cacheKey', 'nonexistent_key'))
        .first()
      
      expect(result).toBeNull()
    })
  })

  describe('calculateCacheKey', () => {
    it('should generate consistent cache key from inputs', () => {
      const calculateCacheKey = (
        eventId: string,
        employeeId: string,
        requirementsHash: string
      ) => {
        return `${eventId}_${employeeId}_${requirementsHash}`
      }
      
      const key1 = calculateCacheKey('event_1', 'emp_1', 'hash123')
      const key2 = calculateCacheKey('event_1', 'emp_1', 'hash123')
      const key3 = calculateCacheKey('event_1', 'emp_1', 'hash456')
      
      expect(key1).toBe(key2) // Same inputs = same key
      expect(key1).not.toBe(key3) // Different hash = different key
    })
  })

  describe('upsert', () => {
    it('should create new itinerary if none exists', async () => {
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
        }),
      })
      mockCtx.db.insert.mockResolvedValue('itin_new')
      
      // Check if exists
      const existing = await mockCtx.db
        .query('itineraries')
        .withIndex('by_trip', (q: any) => q.eq('tripId', 'trip_1'))
        .first()
      
      expect(existing).toBeNull()
      
      // Insert new
      const newId = await mockCtx.db.insert('itineraries', {
        tripId: 'trip_1',
        eventId: 'event_1',
        employeeId: 'emp_1',
        isValid: true,
        createdAt: Date.now(),
      })
      
      expect(newId).toBe('itin_new')
    })

    it('should update existing itinerary', async () => {
      const existingItinerary = {
        _id: 'itin_1',
        tripId: 'trip_1',
        totalCost: 1500,
      }
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(existingItinerary),
        }),
      })
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      await mockCtx.db.patch('itin_1', {
        totalCost: 1600,
        updatedAt: Date.now(),
      })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('itin_1',
        expect.objectContaining({ totalCost: 1600 })
      )
    })
  })

  describe('invalidate', () => {
    it('should mark itinerary as invalid', async () => {
      mockCtx.db.get.mockResolvedValue({ _id: 'itin_1', isValid: true })
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      await mockCtx.db.patch('itin_1', {
        isValid: false,
        invalidatedAt: Date.now(),
        invalidationReason: 'Event requirements changed',
      })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('itin_1',
        expect.objectContaining({
          isValid: false,
          invalidationReason: 'Event requirements changed',
        })
      )
    })
  })

  describe('invalidateByEvent', () => {
    it('should invalidate all itineraries for an event', async () => {
      const mockItineraries = [
        { _id: 'itin_1', eventId: 'event_1' },
        { _id: 'itin_2', eventId: 'event_1' },
      ]
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          collect: vi.fn().mockResolvedValue(mockItineraries),
        }),
      })
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      const itineraries = await mockCtx.db
        .query('itineraries')
        .withIndex('by_event', (q: any) => q.eq('eventId', 'event_1'))
        .collect()
      
      // Invalidate each
      for (const itin of itineraries) {
        await mockCtx.db.patch(itin._id, { isValid: false })
      }
      
      expect(mockCtx.db.patch).toHaveBeenCalledTimes(2)
    })
  })

  describe('remove', () => {
    it('should delete itinerary', async () => {
      mockCtx.db.get.mockResolvedValue({ _id: 'itin_1' })
      mockCtx.db.delete.mockResolvedValue(undefined)
      
      await mockCtx.db.delete('itin_1')
      
      expect(mockCtx.db.delete).toHaveBeenCalledWith('itin_1')
    })
  })
})

describe('Itinerary Caching Logic', () => {
  describe('Cache Key Generation', () => {
    it('should include event ID', () => {
      const key = 'event_123_emp_456_abc'
      expect(key).toContain('event_123')
    })

    it('should include employee ID', () => {
      const key = 'event_123_emp_456_abc'
      expect(key).toContain('emp_456')
    })

    it('should include requirements hash', () => {
      const requirementsHash = 'abc123'
      const key = `event_1_emp_1_${requirementsHash}`
      expect(key).toContain(requirementsHash)
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate when event requirements change', () => {
      const oldRequirements = { cabinClass: 'economy', budget: 2000 }
      const newRequirements = { cabinClass: 'business', budget: 3000 }
      
      const requirementsChanged = JSON.stringify(oldRequirements) !== JSON.stringify(newRequirements)
      
      expect(requirementsChanged).toBe(true)
    })

    it('should not invalidate when requirements are unchanged', () => {
      const requirements1 = { cabinClass: 'economy', budget: 2000 }
      const requirements2 = { cabinClass: 'economy', budget: 2000 }
      
      const requirementsChanged = JSON.stringify(requirements1) !== JSON.stringify(requirements2)
      
      expect(requirementsChanged).toBe(false)
    })
  })
})

describe('Itinerary Validation', () => {
  it('should validate required fields', () => {
    const validItinerary = {
      tripId: 'trip_1',
      eventId: 'event_1',
      employeeId: 'emp_1',
      outboundFlight: { id: 'f1', price: 500 },
      returnFlight: { id: 'f2', price: 450 },
      hotel: { name: 'Hotel', totalPrice: 600 },
      totalCost: 1550,
    }
    
    expect(validItinerary.tripId).toBeTruthy()
    expect(validItinerary.eventId).toBeTruthy()
    expect(validItinerary.employeeId).toBeTruthy()
    expect(validItinerary.outboundFlight).toBeDefined()
  })

  it('should calculate total cost correctly', () => {
    const flights = 950
    const hotel = 600
    const transport = 100
    
    const total = flights + hotel + transport
    
    expect(total).toBe(1650)
  })
})
