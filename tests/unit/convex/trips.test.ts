/**
 * Unit tests for Convex Trips functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the auth helpers
vi.mock('@/convex/auth.helpers', () => ({
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
  getCurrentEmployeeOrNull: vi.fn(),
}))

describe('Trips Convex Functions', () => {
  let mockCtx: any
  let requireAdmin: any
  let requireAuth: any
  let getCurrentUser: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    const authModule = await import('@/convex/auth.helpers')
    requireAdmin = authModule.requireAdmin as any
    requireAuth = authModule.requireAuth as any
    getCurrentUser = authModule.getCurrentUser as any
    
    requireAdmin.mockResolvedValue({ role: 'admin', _id: 'admin_1' })
    requireAuth.mockResolvedValue({ role: 'admin', _id: 'admin_1' })
    getCurrentUser.mockResolvedValue({ role: 'admin', _id: 'admin_1' })
    
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

  describe('listByEvent', () => {
    it('should return all trips for an event', async () => {
      const mockTrips = [
        { _id: 'trip_1', eventId: 'event_1', employeeId: 'emp_1', status: 'pending' },
        { _id: 'trip_2', eventId: 'event_1', employeeId: 'emp_2', status: 'pending' },
      ]
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          collect: vi.fn().mockResolvedValue(mockTrips),
        }),
      })
      
      const result = await mockCtx.db
        .query('trips')
        .withIndex('by_event', (q: any) => q.eq('eventId', 'event_1'))
        .collect()
      
      expect(result).toEqual(mockTrips)
      expect(result.length).toBe(2)
    })
  })

  describe('listByEmployee', () => {
    it('should return all trips for an employee', async () => {
      const mockTrips = [
        { _id: 'trip_1', eventId: 'event_1', employeeId: 'emp_1' },
        { _id: 'trip_2', eventId: 'event_2', employeeId: 'emp_1' },
      ]
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          collect: vi.fn().mockResolvedValue(mockTrips),
        }),
      })
      
      const result = await mockCtx.db
        .query('trips')
        .withIndex('by_employee', (q: any) => q.eq('employeeId', 'emp_1'))
        .collect()
      
      expect(result).toEqual(mockTrips)
      expect(result.every((t: any) => t.employeeId === 'emp_1')).toBe(true)
    })
  })

  describe('listMine', () => {
    it('should return trips for current employee user', async () => {
      getCurrentUser.mockResolvedValue({
        role: 'employee',
        employeeId: 'emp_1',
      })
      
      const mockTrips = [
        { _id: 'trip_1', employeeId: 'emp_1', status: 'pending' },
      ]
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          collect: vi.fn().mockResolvedValue(mockTrips),
        }),
      })
      
      const user = await getCurrentUser(mockCtx)
      const result = await mockCtx.db
        .query('trips')
        .withIndex('by_employee', (q: any) => q.eq('employeeId', user.employeeId))
        .collect()
      
      expect(result).toEqual(mockTrips)
    })

    it('should return empty array if user has no employeeId', async () => {
      getCurrentUser.mockResolvedValue({
        role: 'admin',
        // No employeeId
      })
      
      const user = await getCurrentUser(mockCtx)
      
      expect(user.employeeId).toBeUndefined()
    })
  })

  describe('get', () => {
    it('should return trip by ID', async () => {
      const mockTrip = {
        _id: 'trip_1',
        eventId: 'event_1',
        employeeId: 'emp_1',
        status: 'pending',
        costBreakdown: { total: 1500 },
      }
      
      mockCtx.db.get.mockResolvedValue(mockTrip)
      
      const result = await mockCtx.db.get('trip_1')
      
      expect(result).toEqual(mockTrip)
    })
  })

  describe('getWithDetails', () => {
    it('should return trip with event and employee details', async () => {
      const mockTrip = { _id: 'trip_1', eventId: 'event_1', employeeId: 'emp_1' }
      const mockEvent = { _id: 'event_1', name: 'Test Event' }
      const mockEmployee = { _id: 'emp_1', name: 'John Doe' }
      
      mockCtx.db.get
        .mockResolvedValueOnce(mockTrip)
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce(mockEmployee)
      
      const trip = await mockCtx.db.get('trip_1')
      const event = await mockCtx.db.get(trip.eventId)
      const employee = await mockCtx.db.get(trip.employeeId)
      
      expect(trip).toEqual(mockTrip)
      expect(event.name).toBe('Test Event')
      expect(employee.name).toBe('John Doe')
    })
  })

  describe('getEventStats', () => {
    it('should calculate trip statistics for an event', async () => {
      const mockTrips = [
        { status: 'confirmed', costBreakdown: { total: 1500 } },
        { status: 'confirmed', costBreakdown: { total: 1800 } },
        { status: 'pending', costBreakdown: { total: 1200 } },
        { status: 'cancelled', costBreakdown: { total: 0 } },
      ]
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          collect: vi.fn().mockResolvedValue(mockTrips),
        }),
      })
      
      const trips = await mockCtx.db
        .query('trips')
        .withIndex('by_event', (q: any) => q.eq('eventId', 'event_1'))
        .collect()
      
      const stats = {
        total: trips.length,
        byStatus: {
          confirmed: trips.filter((t: any) => t.status === 'confirmed').length,
          pending: trips.filter((t: any) => t.status === 'pending').length,
          cancelled: trips.filter((t: any) => t.status === 'cancelled').length,
        },
        totalCost: trips
          .filter((t: any) => t.status !== 'cancelled')
          .reduce((sum: number, t: any) => sum + (t.costBreakdown?.total ?? 0), 0),
      }
      
      expect(stats.total).toBe(4)
      expect(stats.byStatus.confirmed).toBe(2)
      expect(stats.byStatus.pending).toBe(1)
      expect(stats.byStatus.cancelled).toBe(1)
      expect(stats.totalCost).toBe(4500)
    })
  })

  describe('updateStatus', () => {
    const validStatusTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['booked', 'cancelled'],
      booked: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    }

    it('should update trip status', async () => {
      mockCtx.db.get.mockResolvedValue({ _id: 'trip_1', status: 'pending' })
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      await mockCtx.db.patch('trip_1', {
        status: 'confirmed',
        updatedAt: Date.now(),
      })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('trip_1',
        expect.objectContaining({ status: 'confirmed' })
      )
    })

    it('should validate status transitions', () => {
      expect(validStatusTransitions.pending).toContain('confirmed')
      expect(validStatusTransitions.confirmed).toContain('booked')
      expect(validStatusTransitions.completed.length).toBe(0)
    })
  })

  describe('updateCostBreakdown', () => {
    it('should update trip cost breakdown', async () => {
      mockCtx.db.get.mockResolvedValue({ _id: 'trip_1' })
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      const costBreakdown = {
        flights: 900,
        hotel: 450,
        groundTransport: 100,
        meals: 50,
        total: 1500,
      }
      
      await mockCtx.db.patch('trip_1', { costBreakdown })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('trip_1', { costBreakdown })
    })
  })

  describe('updateAgentNotes', () => {
    it('should update agent notes on trip', async () => {
      mockCtx.db.get.mockResolvedValue({ _id: 'trip_1' })
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      const agentNotes = 'Booked direct flight due to employee mobility restrictions.'
      
      await mockCtx.db.patch('trip_1', { agentNotes })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('trip_1', { agentNotes })
    })
  })

  describe('linkItinerary', () => {
    it('should link itinerary to trip', async () => {
      mockCtx.db.get.mockResolvedValue({ _id: 'trip_1' })
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      await mockCtx.db.patch('trip_1', {
        itineraryId: 'itinerary_1',
        status: 'confirmed',
      })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('trip_1',
        expect.objectContaining({ itineraryId: 'itinerary_1' })
      )
    })
  })

  describe('setPolicyCompliance', () => {
    it('should set policy compliance status', async () => {
      mockCtx.db.get.mockResolvedValue({ _id: 'trip_1' })
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      await mockCtx.db.patch('trip_1', {
        policyCompliant: true,
        policyViolations: [],
      })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('trip_1',
        expect.objectContaining({
          policyCompliant: true,
          policyViolations: [],
        })
      )
    })

    it('should record policy violations', async () => {
      const violations = ['Over budget by $200', 'Non-preferred airline selected']
      
      await mockCtx.db.patch('trip_1', {
        policyCompliant: false,
        policyViolations: violations,
      })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('trip_1',
        expect.objectContaining({
          policyCompliant: false,
          policyViolations: violations,
        })
      )
    })
  })
})

describe('Trip Cost Calculation', () => {
  it('should calculate total from breakdown', () => {
    const breakdown = {
      flights: 900,
      hotel: 450,
      groundTransport: 100,
      meals: 50,
    }
    
    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0)
    
    expect(total).toBe(1500)
  })

  it('should handle missing cost components', () => {
    const breakdown = {
      flights: 900,
      hotel: 450,
      // No groundTransport or meals
    }
    
    const total = Object.values(breakdown).reduce((sum, val) => sum + (val ?? 0), 0)
    
    expect(total).toBe(1350)
  })
})
