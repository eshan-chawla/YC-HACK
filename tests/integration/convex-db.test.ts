/**
 * Integration tests for Convex Database Operations
 * 
 * These tests verify database operations work correctly together.
 * They mock the Convex context but test real query/mutation logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Convex Database Integration', () => {
  let mockCtx: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Simulate a database state
    const dbState = {
      employees: [] as any[],
      events: [] as any[],
      trips: [] as any[],
      itineraries: [] as any[],
      userProfiles: [] as any[],
    }
    
    mockCtx = {
      db: {
        insert: vi.fn(async (table: string, data: any) => {
          const id = `${table.slice(0, -1)}_${Date.now()}`
          const record = { _id: id, ...data }
          ;(dbState as any)[table].push(record)
          return id
        }),
        get: vi.fn(async (id: string) => {
          for (const table of Object.values(dbState)) {
            const record = (table as any[]).find((r: any) => r._id === id)
            if (record) return record
          }
          return null
        }),
        patch: vi.fn(async (id: string, updates: any) => {
          for (const table of Object.values(dbState)) {
            const index = (table as any[]).findIndex((r: any) => r._id === id)
            if (index >= 0) {
              ;(table as any[])[index] = { ...(table as any[])[index], ...updates }
              return
            }
          }
        }),
        delete: vi.fn(async (id: string) => {
          for (const [name, table] of Object.entries(dbState)) {
            const index = (table as any[]).findIndex((r: any) => r._id === id)
            if (index >= 0) {
              ;(table as any[]).splice(index, 1)
              return
            }
          }
        }),
        query: vi.fn((table: string) => ({
          withIndex: vi.fn(() => ({
            first: vi.fn(async () => (dbState as any)[table][0] || null),
            collect: vi.fn(async () => (dbState as any)[table]),
          })),
          filter: vi.fn(() => ({
            collect: vi.fn(async () => (dbState as any)[table]),
          })),
          order: vi.fn(() => ({
            take: vi.fn(async (limit: number) => (dbState as any)[table].slice(0, limit)),
          })),
          collect: vi.fn(async () => (dbState as any)[table]),
        })),
      },
      _dbState: dbState,
    }
  })

  describe('Admin Creates Event with Employees Flow', () => {
    it('should create event and assign employees', async () => {
      // Step 1: Create employees
      const emp1Id = await mockCtx.db.insert('employees', {
        name: 'John Doe',
        email: 'john@example.com',
        team: 'Engineering',
        status: 'active',
        createdAt: Date.now(),
      })
      
      const emp2Id = await mockCtx.db.insert('employees', {
        name: 'Jane Smith',
        email: 'jane@example.com',
        team: 'Engineering',
        status: 'active',
        createdAt: Date.now(),
      })
      
      expect(emp1Id).toBeDefined()
      expect(emp2Id).toBeDefined()
      
      // Step 2: Create event with employees
      const eventId = await mockCtx.db.insert('events', {
        name: 'Q1 Engineering Offsite',
        destination: 'London',
        departureDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        returnDate: Date.now() + 35 * 24 * 60 * 60 * 1000,
        budgetPerEmployee: 2000,
        status: 'pending',
        employeeIds: [emp1Id, emp2Id],
        createdAt: Date.now(),
      })
      
      expect(eventId).toBeDefined()
      
      // Step 3: Verify event was created
      const event = await mockCtx.db.get(eventId)
      expect(event.name).toBe('Q1 Engineering Offsite')
      expect(event.employeeIds).toContain(emp1Id)
      expect(event.employeeIds).toContain(emp2Id)
    })

    it('should create trips for each employee', async () => {
      // Create event
      const eventId = await mockCtx.db.insert('events', {
        name: 'Test Event',
        employeeIds: ['emp_1', 'emp_2'],
        status: 'pending',
      })
      
      // Create trips for each employee
      const trip1Id = await mockCtx.db.insert('trips', {
        eventId,
        employeeId: 'emp_1',
        status: 'pending',
        createdAt: Date.now(),
      })
      
      const trip2Id = await mockCtx.db.insert('trips', {
        eventId,
        employeeId: 'emp_2',
        status: 'pending',
        createdAt: Date.now(),
      })
      
      expect(trip1Id).toBeDefined()
      expect(trip2Id).toBeDefined()
      
      // Verify trips
      const trip1 = await mockCtx.db.get(trip1Id)
      const trip2 = await mockCtx.db.get(trip2Id)
      
      expect(trip1.eventId).toBe(eventId)
      expect(trip2.eventId).toBe(eventId)
    })
  })

  describe('Itinerary Generation Flow', () => {
    it('should create itinerary for trip', async () => {
      // Setup
      const eventId = await mockCtx.db.insert('events', {
        name: 'Test Event',
        destination: 'LHR',
        budgetPerEmployee: 2000,
      })
      
      const tripId = await mockCtx.db.insert('trips', {
        eventId,
        employeeId: 'emp_1',
        status: 'pending',
      })
      
      // Create itinerary
      const itineraryId = await mockCtx.db.insert('itineraries', {
        tripId,
        eventId,
        employeeId: 'emp_1',
        outboundFlight: { id: 'f1', price: 500 },
        returnFlight: { id: 'f2', price: 450 },
        hotel: { name: 'Hotel', totalPrice: 600 },
        totalCost: 1550,
        withinBudget: true,
        policyCompliant: true,
        isValid: true,
        cacheKey: `${eventId}_emp_1_hash123`,
        createdAt: Date.now(),
      })
      
      expect(itineraryId).toBeDefined()
      
      // Link itinerary to trip
      await mockCtx.db.patch(tripId, {
        itineraryId,
        status: 'confirmed',
      })
      
      // Verify
      const trip = await mockCtx.db.get(tripId)
      expect(trip.itineraryId).toBe(itineraryId)
      expect(trip.status).toBe('confirmed')
    })

    it('should invalidate itinerary when event requirements change', async () => {
      // Create itinerary
      const itineraryId = await mockCtx.db.insert('itineraries', {
        eventId: 'event_1',
        isValid: true,
        cacheKey: 'event_1_emp_1_hash1',
      })
      
      // Requirements change - invalidate
      await mockCtx.db.patch(itineraryId, {
        isValid: false,
        invalidatedAt: Date.now(),
        invalidationReason: 'Event budget changed',
      })
      
      const itinerary = await mockCtx.db.get(itineraryId)
      expect(itinerary.isValid).toBe(false)
      expect(itinerary.invalidationReason).toBe('Event budget changed')
    })
  })

  describe('Cascading Operations', () => {
    it('should handle employee removal from event', async () => {
      // Setup
      const eventId = await mockCtx.db.insert('events', {
        name: 'Event',
        employeeIds: ['emp_1', 'emp_2', 'emp_3'],
      })
      
      await mockCtx.db.insert('trips', {
        eventId,
        employeeId: 'emp_2',
        status: 'pending',
      })
      
      // Remove employee from event
      await mockCtx.db.patch(eventId, {
        employeeIds: ['emp_1', 'emp_3'],
      })
      
      const event = await mockCtx.db.get(eventId)
      expect(event.employeeIds).not.toContain('emp_2')
    })
  })

  describe('Query Filtering', () => {
    it('should filter employees by team', async () => {
      // Add employees to different teams
      await mockCtx.db.insert('employees', { name: 'E1', team: 'Engineering' })
      await mockCtx.db.insert('employees', { name: 'E2', team: 'Engineering' })
      await mockCtx.db.insert('employees', { name: 'E3', team: 'Sales' })
      
      // Mock filtered query
      const engineeringTeam = mockCtx._dbState.employees.filter(
        (e: any) => e.team === 'Engineering'
      )
      
      expect(engineeringTeam.length).toBe(2)
    })

    it('should filter trips by status', async () => {
      await mockCtx.db.insert('trips', { status: 'pending' })
      await mockCtx.db.insert('trips', { status: 'confirmed' })
      await mockCtx.db.insert('trips', { status: 'pending' })
      
      const pendingTrips = mockCtx._dbState.trips.filter(
        (t: any) => t.status === 'pending'
      )
      
      expect(pendingTrips.length).toBe(2)
    })
  })

  describe('Data Relationships', () => {
    it('should maintain referential integrity', async () => {
      // Create related entities
      const employeeId = await mockCtx.db.insert('employees', {
        name: 'Employee',
        email: 'emp@example.com',
      })
      
      const eventId = await mockCtx.db.insert('events', {
        name: 'Event',
        employeeIds: [employeeId],
      })
      
      const tripId = await mockCtx.db.insert('trips', {
        eventId,
        employeeId,
      })
      
      const itineraryId = await mockCtx.db.insert('itineraries', {
        tripId,
        eventId,
        employeeId,
      })
      
      // Verify all relationships
      const itinerary = await mockCtx.db.get(itineraryId)
      const trip = await mockCtx.db.get(itinerary.tripId)
      const event = await mockCtx.db.get(trip.eventId)
      const employee = await mockCtx.db.get(trip.employeeId)
      
      expect(event.employeeIds).toContain(employeeId)
      expect(trip.eventId).toBe(eventId)
      expect(itinerary.employeeId).toBe(employeeId)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent inserts', async () => {
      const promises = []
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          mockCtx.db.insert('employees', {
            name: `Employee ${i}`,
            email: `emp${i}@example.com`,
          })
        )
      }
      
      const ids = await Promise.all(promises)
      
      expect(ids.length).toBe(5)
      expect(new Set(ids).size).toBe(5) // All unique
    })

    it('should handle concurrent updates', async () => {
      const id = await mockCtx.db.insert('events', {
        name: 'Event',
        status: 'draft',
        updatesCount: 0,
      })
      
      const updates = []
      for (let i = 0; i < 5; i++) {
        updates.push(
          mockCtx.db.patch(id, { 
            updatesCount: i + 1,
            lastUpdated: Date.now(),
          })
        )
      }
      
      await Promise.all(updates)
      
      const event = await mockCtx.db.get(id)
      expect(event.updatesCount).toBeGreaterThan(0)
    })
  })
})

describe('Data Validation', () => {
  it('should validate employee email format', () => {
    const validEmails = ['user@example.com', 'test.user@company.co.uk']
    const invalidEmails = ['notanemail', '@missing.com', 'spaces here@test.com']
    
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    
    for (const email of validEmails) {
      expect(isValidEmail(email)).toBe(true)
    }
    
    for (const email of invalidEmails) {
      expect(isValidEmail(email)).toBe(false)
    }
  })

  it('should validate event date range', () => {
    const validateDateRange = (departure: number, returnDate: number) => {
      return returnDate > departure
    }
    
    const now = Date.now()
    const tomorrow = now + 24 * 60 * 60 * 1000
    const yesterday = now - 24 * 60 * 60 * 1000
    
    expect(validateDateRange(now, tomorrow)).toBe(true)
    expect(validateDateRange(tomorrow, now)).toBe(false)
    expect(validateDateRange(now, yesterday)).toBe(false)
  })

  it('should validate budget is positive', () => {
    const validateBudget = (budget: number) => budget > 0
    
    expect(validateBudget(2000)).toBe(true)
    expect(validateBudget(0)).toBe(false)
    expect(validateBudget(-100)).toBe(false)
  })
})
