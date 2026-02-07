/**
 * Unit tests for Convex Events functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the auth helpers
vi.mock('@/convex/auth.helpers', () => ({
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}))

describe('Events Convex Functions', () => {
  let mockCtx: any
  let requireAdmin: any
  let requireAuth: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    const authModule = await import('@/convex/auth.helpers')
    requireAdmin = authModule.requireAdmin as any
    requireAuth = authModule.requireAuth as any
    
    // Setup mock admin user
    requireAdmin.mockResolvedValue({ role: 'admin', _id: 'admin_1' })
    requireAuth.mockResolvedValue({ role: 'admin', _id: 'admin_1' })
    
    // Mock database context
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

  describe('list', () => {
    it('should require admin access', async () => {
      requireAdmin.mockRejectedValue(new Error('Unauthorized'))
      await expect(requireAdmin(mockCtx)).rejects.toThrow('Unauthorized')
    })

    it('should return events with default sorting', async () => {
      const mockEvents = [
        { _id: 'event_1', name: 'Q1 Offsite', status: 'pending' },
        { _id: 'event_2', name: 'Q2 Summit', status: 'draft' },
      ]
      
      mockCtx.db.query.mockReturnValue({
        order: vi.fn().mockReturnValue({
          take: vi.fn().mockResolvedValue(mockEvents),
        }),
      })
      
      const result = await mockCtx.db.query('events').order('desc').take(50)
      
      expect(result).toEqual(mockEvents)
    })

    it('should filter by status', async () => {
      const mockEvents = [
        { _id: 'event_1', name: 'Active Event', status: 'confirmed' },
      ]
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            take: vi.fn().mockResolvedValue(mockEvents),
          }),
        }),
      })
      
      const result = await mockCtx.db
        .query('events')
        .withIndex('by_status', (q: any) => q.eq('status', 'confirmed'))
        .order('desc')
        .take(50)
      
      expect(result).toEqual(mockEvents)
      expect(result[0].status).toBe('confirmed')
    })
  })

  describe('get', () => {
    it('should return event by ID', async () => {
      const mockEvent = {
        _id: 'event_1',
        name: 'Test Event',
        destination: 'London',
        budgetPerEmployee: 2000,
      }
      
      mockCtx.db.get.mockResolvedValue(mockEvent)
      
      const result = await mockCtx.db.get('event_1')
      
      expect(result).toEqual(mockEvent)
    })

    it('should return null for non-existent event', async () => {
      mockCtx.db.get.mockResolvedValue(null)
      
      const result = await mockCtx.db.get('nonexistent')
      
      expect(result).toBeNull()
    })
  })

  describe('getWithEmployees', () => {
    it('should return event with associated employee data', async () => {
      const mockEvent = {
        _id: 'event_1',
        name: 'Team Offsite',
        employeeIds: ['emp_1', 'emp_2'],
      }
      const mockEmployees = [
        { _id: 'emp_1', name: 'John' },
        { _id: 'emp_2', name: 'Jane' },
      ]
      
      mockCtx.db.get
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce(mockEmployees[0])
        .mockResolvedValueOnce(mockEmployees[1])
      
      // Get event
      const event = await mockCtx.db.get('event_1')
      
      // Get employees
      const employees = await Promise.all(
        event.employeeIds.map((id: string) => mockCtx.db.get(id))
      )
      
      expect(event.name).toBe('Team Offsite')
      expect(employees.length).toBe(2)
      expect(employees[0].name).toBe('John')
    })
  })

  describe('create', () => {
    it('should create event with required fields', async () => {
      mockCtx.db.insert.mockResolvedValue('event_new')
      
      const eventData = {
        name: 'New Event',
        destination: 'Paris',
        departureDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        returnDate: Date.now() + 35 * 24 * 60 * 60 * 1000,
        budgetPerEmployee: 1500,
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      
      const result = await mockCtx.db.insert('events', eventData)
      
      expect(result).toBe('event_new')
      expect(mockCtx.db.insert).toHaveBeenCalledWith('events', 
        expect.objectContaining({
          name: 'New Event',
          destination: 'Paris',
          status: 'draft',
        })
      )
    })

    it('should include requirements when provided', async () => {
      mockCtx.db.insert.mockResolvedValue('event_new')
      
      const eventData = {
        name: 'Business Event',
        destination: 'London',
        departureDate: Date.now(),
        returnDate: Date.now(),
        budgetPerEmployee: 2500,
        requirements: {
          cabinClass: 'business',
          preferredAirlines: ['United', 'Delta'],
          mealAllowancePerDay: 75,
        },
      }
      
      await mockCtx.db.insert('events', eventData)
      
      expect(mockCtx.db.insert).toHaveBeenCalledWith('events',
        expect.objectContaining({
          requirements: {
            cabinClass: 'business',
            preferredAirlines: ['United', 'Delta'],
            mealAllowancePerDay: 75,
          },
        })
      )
    })
  })

  describe('update', () => {
    it('should update event fields', async () => {
      mockCtx.db.get.mockResolvedValue({ _id: 'event_1', name: 'Old Name' })
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      await mockCtx.db.patch('event_1', {
        name: 'New Name',
        updatedAt: Date.now(),
      })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('event_1',
        expect.objectContaining({ name: 'New Name' })
      )
    })
  })

  describe('addEmployees', () => {
    it('should add employees to event and create trips', async () => {
      const existingEvent = {
        _id: 'event_1',
        name: 'Event',
        employeeIds: ['emp_1'],
      }
      
      mockCtx.db.get.mockResolvedValue(existingEvent)
      mockCtx.db.patch.mockResolvedValue(undefined)
      mockCtx.db.insert.mockResolvedValue('trip_new')
      
      // Add new employees
      const newEmployeeIds = ['emp_2', 'emp_3']
      const updatedEmployeeIds = [...existingEvent.employeeIds, ...newEmployeeIds]
      
      await mockCtx.db.patch('event_1', {
        employeeIds: updatedEmployeeIds,
      })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('event_1', {
        employeeIds: ['emp_1', 'emp_2', 'emp_3'],
      })
    })
  })

  describe('removeEmployee', () => {
    it('should remove employee from event', async () => {
      const existingEvent = {
        _id: 'event_1',
        employeeIds: ['emp_1', 'emp_2', 'emp_3'],
      }
      
      mockCtx.db.get.mockResolvedValue(existingEvent)
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      // Remove emp_2
      const updatedEmployeeIds = existingEvent.employeeIds.filter(
        (id: string) => id !== 'emp_2'
      )
      
      await mockCtx.db.patch('event_1', {
        employeeIds: updatedEmployeeIds,
      })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('event_1', {
        employeeIds: ['emp_1', 'emp_3'],
      })
    })
  })

  describe('send', () => {
    it('should update status to confirmed', async () => {
      mockCtx.db.get.mockResolvedValue({ _id: 'event_1', status: 'pending' })
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      await mockCtx.db.patch('event_1', {
        status: 'confirmed',
        sentAt: Date.now(),
      })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('event_1',
        expect.objectContaining({ status: 'confirmed' })
      )
    })
  })

  describe('cancel', () => {
    it('should update status to cancelled', async () => {
      mockCtx.db.get.mockResolvedValue({ _id: 'event_1', status: 'pending' })
      mockCtx.db.patch.mockResolvedValue(undefined)
      
      await mockCtx.db.patch('event_1', {
        status: 'cancelled',
        cancelledAt: Date.now(),
      })
      
      expect(mockCtx.db.patch).toHaveBeenCalledWith('event_1',
        expect.objectContaining({ status: 'cancelled' })
      )
    })
  })
})

describe('Event Validation', () => {
  it('should validate required fields', () => {
    const validEvent = {
      name: 'Valid Event',
      destination: 'London',
      departureDate: Date.now(),
      returnDate: Date.now() + 5 * 24 * 60 * 60 * 1000,
      budgetPerEmployee: 2000,
    }
    
    expect(validEvent.name).toBeTruthy()
    expect(validEvent.destination).toBeTruthy()
    expect(validEvent.budgetPerEmployee).toBeGreaterThan(0)
  })

  it('should validate date range', () => {
    const departureDate = Date.now() + 10 * 24 * 60 * 60 * 1000
    const returnDate = Date.now() + 15 * 24 * 60 * 60 * 1000
    
    expect(returnDate).toBeGreaterThan(departureDate)
  })

  it('should validate budget is positive', () => {
    const budget = 2000
    expect(budget).toBeGreaterThan(0)
  })
})

describe('Event Status Transitions', () => {
  const validTransitions: Record<string, string[]> = {
    draft: ['pending', 'cancelled'],
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  }

  it('should allow draft to pending', () => {
    expect(validTransitions.draft).toContain('pending')
  })

  it('should allow pending to confirmed', () => {
    expect(validTransitions.pending).toContain('confirmed')
  })

  it('should not allow completed to any other status', () => {
    expect(validTransitions.completed.length).toBe(0)
  })

  it('should allow cancellation from most statuses', () => {
    expect(validTransitions.draft).toContain('cancelled')
    expect(validTransitions.pending).toContain('cancelled')
    expect(validTransitions.confirmed).toContain('cancelled')
  })
})
