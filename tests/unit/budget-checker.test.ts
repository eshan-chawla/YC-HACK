/**
 * Unit tests for budget compliance checker
 */

import { describe, it, expect } from 'vitest'
import {
  checkBudgetCompliance,
  checkEventBudgetCompliance,
  suggestBudgetAdjustments,
  calculateOptimalAllocation,
} from '@/lib/agent/budget-checker'
import type { GeneratedItinerary } from '@/lib/agent/types'

// Mock itinerary for testing
const createMockItinerary = (overrides: Partial<GeneratedItinerary> = {}): GeneratedItinerary => ({
  tripId: 'trip_1',
  eventId: 'event_1',
  employeeId: 'emp_1',
  outboundFlight: {
    id: 'flight_1',
    airline: 'United Airlines',
    flightNumber: 'UA123',
    departure: { airport: 'JFK', time: '2026-03-01T08:00:00' },
    arrival: { airport: 'LHR', time: '2026-03-01T20:00:00' },
    duration: 420,
    stops: 0,
    price: 500,
    currency: 'USD',
    cabinClass: 'economy',
  },
  returnFlight: {
    id: 'flight_2',
    airline: 'United Airlines',
    flightNumber: 'UA456',
    departure: { airport: 'LHR', time: '2026-03-05T10:00:00' },
    arrival: { airport: 'JFK', time: '2026-03-05T14:00:00' },
    duration: 480,
    stops: 0,
    price: 450,
    currency: 'USD',
    cabinClass: 'economy',
  },
  hotel: {
    name: 'Marriott',
    address: '123 London St',
    checkIn: '2026-03-01',
    checkOut: '2026-03-05',
    room: 'Standard',
    pricePerNight: 150,
    totalPrice: 600,
  },
  groundTransport: {
    type: 'Airport Transfer',
    from: 'LHR',
    to: 'Marriott',
    price: 50,
  },
  totalCost: 1600,
  withinBudget: true,
  policyCompliant: true,
  notes: 'Test itinerary',
  ...overrides,
})

describe('Budget Checker', () => {
  describe('checkBudgetCompliance', () => {
    it('should pass for itinerary within budget', () => {
      const itinerary = createMockItinerary({ totalCost: 1500 })
      const policy = { maxTotalBudget: 2000 }
      
      const result = checkBudgetCompliance(itinerary, policy)
      
      expect(result.compliant).toBe(true)
      expect(result.withinBudget).toBe(true)
      expect(result.policyViolations).toHaveLength(0)
    })

    it('should fail for itinerary over budget', () => {
      const itinerary = createMockItinerary({ totalCost: 2500 })
      const policy = { maxTotalBudget: 2000 }
      
      const result = checkBudgetCompliance(itinerary, policy)
      
      expect(result.compliant).toBe(false)
      expect(result.withinBudget).toBe(false)
      expect(result.details.overage).toBe(500)
    })

    it('should check flight cost limits', () => {
      const itinerary = createMockItinerary()
      const policy = { maxTotalBudget: 2000, maxFlightCost: 500 }
      
      const result = checkBudgetCompliance(itinerary, policy)
      
      expect(result.compliant).toBe(false)
      expect(result.policyViolations.some(v => v.includes('Flight cost'))).toBe(true)
    })

    it('should check hotel per night limits', () => {
      const itinerary = createMockItinerary()
      const policy = { maxTotalBudget: 2000, maxHotelPerNight: 100 }
      
      const result = checkBudgetCompliance(itinerary, policy)
      
      expect(result.compliant).toBe(false)
      expect(result.policyViolations.some(v => v.includes('Hotel rate'))).toBe(true)
    })

    it('should check cabin class requirements', () => {
      const itinerary = createMockItinerary()
      const policy = { maxTotalBudget: 2000, allowedCabinClasses: ['business'] }
      
      const result = checkBudgetCompliance(itinerary, policy)
      
      expect(result.compliant).toBe(false)
      expect(result.policyViolations.some(v => v.includes('cabin class'))).toBe(true)
    })

    it('should check direct flights requirement', () => {
      const itinerary = createMockItinerary({
        outboundFlight: {
          ...createMockItinerary().outboundFlight!,
          stops: 1,
        },
      })
      const policy = { maxTotalBudget: 2000, requireDirectFlights: true }
      
      const result = checkBudgetCompliance(itinerary, policy)
      
      expect(result.compliant).toBe(false)
      expect(result.policyViolations.some(v => v.includes('direct flights'))).toBe(true)
    })

    it('should add warnings for non-preferred airlines', () => {
      const itinerary = createMockItinerary()
      const policy = { maxTotalBudget: 2000, preferredAirlines: ['Delta'] }
      
      const result = checkBudgetCompliance(itinerary, policy)
      
      expect(result.warnings.some(w => w.includes('preferred airline'))).toBe(true)
    })
  })

  describe('checkEventBudgetCompliance', () => {
    it('should check multiple itineraries', () => {
      const itineraries = [
        createMockItinerary({ employeeId: 'emp_1', totalCost: 1500 }),
        createMockItinerary({ employeeId: 'emp_2', totalCost: 1800 }),
        createMockItinerary({ employeeId: 'emp_3', totalCost: 1200 }),
      ]
      const policy = { maxTotalBudget: 2000 }
      
      const result = checkEventBudgetCompliance(itineraries, policy)
      
      expect(result.summary.compliant).toBe(3)
      expect(result.summary.violations).toBe(0)
      expect(result.totalCost).toBe(4500)
    })

    it('should track overall budget compliance', () => {
      const itineraries = [
        createMockItinerary({ totalCost: 1500 }),
        createMockItinerary({ totalCost: 1800 }),
      ]
      const policy = { maxTotalBudget: 2000 }
      const totalEventBudget = 3000
      
      const result = checkEventBudgetCompliance(itineraries, policy, totalEventBudget)
      
      expect(result.overallCompliant).toBe(false) // 3300 > 3000
    })
  })

  describe('suggestBudgetAdjustments', () => {
    it('should return no adjustments for compliant itinerary', () => {
      const itinerary = createMockItinerary({ totalCost: 1500 })
      const result = checkBudgetCompliance(itinerary, { maxTotalBudget: 2000 })
      
      const suggestions = suggestBudgetAdjustments(result, itinerary)
      
      expect(suggestions).toContain('Itinerary is within budget - no adjustments needed')
    })

    it('should suggest flight changes for over-budget itinerary', () => {
      const itinerary = createMockItinerary({ totalCost: 2500 })
      const result = checkBudgetCompliance(itinerary, { maxTotalBudget: 2000 })
      
      const suggestions = suggestBudgetAdjustments(result, itinerary)
      
      expect(suggestions.some(s => s.includes('economy class'))).toBe(true)
    })
  })

  describe('calculateOptimalAllocation', () => {
    it('should allocate budget correctly', () => {
      const allocation = calculateOptimalAllocation(2000, 4)
      
      expect(allocation.flights).toBeGreaterThan(0)
      expect(allocation.hotel).toBeGreaterThan(0)
      expect(allocation.hotelPerNight).toBe(Math.round(allocation.hotel / 4))
      expect(allocation.groundTransport).toBeGreaterThan(0)
    })

    it('should prioritize flights when requested', () => {
      const standard = calculateOptimalAllocation(2000, 4)
      const prioritized = calculateOptimalAllocation(2000, 4, { prioritizeFlights: true })
      
      expect(prioritized.flights).toBeGreaterThan(standard.flights)
    })

    it('should prioritize hotel when requested', () => {
      const standard = calculateOptimalAllocation(2000, 4)
      const prioritized = calculateOptimalAllocation(2000, 4, { prioritizeHotel: true })
      
      expect(prioritized.hotel).toBeGreaterThan(standard.hotel)
    })
  })
})
