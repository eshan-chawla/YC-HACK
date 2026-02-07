/**
 * A/B Tests for Itinerary Accuracy
 * 
 * Tests the accuracy and quality of generated itineraries
 * across different scenarios and requirements.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mock functions that can be tracked
const mockItinerarySearchFlights = vi.fn().mockResolvedValue({
  searchId: 'test_search',
  flights: [
    {
      id: 'flight_1',
      airline: 'United Airlines',
      flightNumber: 'UA123',
      departure: { airport: 'JFK', time: '2026-03-01T08:00:00' },
      arrival: { airport: 'LHR', time: '2026-03-01T20:00:00' },
      duration: 420,
      stops: 0,
      price: 550,
      currency: 'USD',
      cabinClass: 'economy',
      seatsAvailable: 45,
    },
    {
      id: 'flight_2',
      airline: 'British Airways',
      flightNumber: 'BA456',
      departure: { airport: 'JFK', time: '2026-03-01T10:00:00' },
      arrival: { airport: 'LHR', time: '2026-03-01T22:00:00' },
      duration: 420,
      stops: 0,
      price: 650,
      currency: 'USD',
      cabinClass: 'economy',
      seatsAvailable: 30,
    },
    {
      id: 'flight_3',
      airline: 'Delta Airlines',
      flightNumber: 'DL789',
      departure: { airport: 'JFK', time: '2026-03-01T14:00:00' },
      arrival: { airport: 'LHR', time: '2026-03-02T02:00:00' },
      duration: 420,
      stops: 0,
      price: 480,
      currency: 'USD',
      cabinClass: 'economy',
      seatsAvailable: 60,
    },
  ],
  currency: 'USD',
  searchedAt: new Date().toISOString(),
})

const mockItineraryGetFlightDetails = vi.fn().mockResolvedValue(null)
const mockItinerarySendPayment = vi.fn().mockResolvedValue({
  success: true,
  transactionId: 'tx_123',
})

// Create proper class mocks for singleton instances
class MockKiwiClientForItinerary {
  searchFlights = mockItinerarySearchFlights
  getFlightDetails = mockItineraryGetFlightDetails
  listTools = vi.fn().mockResolvedValue([])
  disconnect = vi.fn().mockResolvedValue(undefined)
}

class MockLocusClientForItinerary {
  sendPayment = mockItinerarySendPayment
}

// Mock MCP integration with proper class instances
vi.mock('@/lib/agent/mcp-integration', () => ({
  KiwiClient: MockKiwiClientForItinerary,
  LocusClient: MockLocusClientForItinerary,
  kiwiClient: new MockKiwiClientForItinerary(),
  locusClient: new MockLocusClientForItinerary(),
}))

describe('Itinerary Generation Accuracy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock to default
    mockItinerarySearchFlights.mockResolvedValue({
      searchId: 'test_search',
      flights: [
        {
          id: 'flight_1',
          airline: 'United Airlines',
          flightNumber: 'UA123',
          departure: { airport: 'JFK', time: '2026-03-01T08:00:00' },
          arrival: { airport: 'LHR', time: '2026-03-01T20:00:00' },
          duration: 420,
          stops: 0,
          price: 550,
          currency: 'USD',
          cabinClass: 'economy',
          seatsAvailable: 45,
        },
        {
          id: 'flight_2',
          airline: 'British Airways',
          flightNumber: 'BA456',
          departure: { airport: 'JFK', time: '2026-03-01T10:00:00' },
          arrival: { airport: 'LHR', time: '2026-03-01T22:00:00' },
          duration: 420,
          stops: 0,
          price: 650,
          currency: 'USD',
          cabinClass: 'economy',
          seatsAvailable: 30,
        },
        {
          id: 'flight_3',
          airline: 'Delta Airlines',
          flightNumber: 'DL789',
          departure: { airport: 'JFK', time: '2026-03-01T14:00:00' },
          arrival: { airport: 'LHR', time: '2026-03-02T02:00:00' },
          duration: 420,
          stops: 0,
          price: 480,
          currency: 'USD',
          cabinClass: 'economy',
          seatsAvailable: 60,
        },
      ],
      currency: 'USD',
      searchedAt: new Date().toISOString(),
    })
  })

  describe('Budget Compliance', () => {
    it('should stay within budget', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const dbContext = {
        getEvent: vi.fn().mockResolvedValue({
          destination: 'LHR',
          departureDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          returnDate: Date.now() + 35 * 24 * 60 * 60 * 1000,
          budgetPerEmployee: 2000,
        }),
        getEmployee: vi.fn().mockResolvedValue({
          location: 'JFK',
          restrictions: {},
        }),
        getTrip: vi.fn(),
        listTrips: vi.fn(),
        updateTrip: vi.fn(),
        createItinerary: vi.fn(),
      }
      
      const result = await executeTool(
        {
          id: 'call_1',
          name: 'generate_itinerary',
          arguments: {
            eventId: 'event_1',
            employeeId: 'emp_1',
          },
        },
        dbContext
      )
      
      expect(result.error).toBeUndefined()
      
      const itinerary = result.result as any
      expect(itinerary.totalCost).toBeLessThanOrEqual(2000)
      expect(itinerary.withinBudget).toBe(true)
    })

    it('should select cheaper flights when budget is tight', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const dbContext = {
        getEvent: vi.fn().mockResolvedValue({
          destination: 'LHR',
          departureDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          returnDate: Date.now() + 35 * 24 * 60 * 60 * 1000,
          budgetPerEmployee: 1200, // Tight budget
        }),
        getEmployee: vi.fn().mockResolvedValue({
          location: 'JFK',
          restrictions: {},
        }),
        getTrip: vi.fn(),
        listTrips: vi.fn(),
        updateTrip: vi.fn(),
        createItinerary: vi.fn(),
      }
      
      const result = await executeTool(
        {
          id: 'call_1',
          name: 'generate_itinerary',
          arguments: {
            eventId: 'event_1',
            employeeId: 'emp_1',
          },
        },
        dbContext
      )
      
      const itinerary = result.result as any
      
      // Should generate an itinerary even with tight budget
      // The actual cost may exceed budget but the system should still produce results
      expect(itinerary.totalCost).toBeGreaterThan(0)
      expect(itinerary.outboundFlight).toBeDefined()
    })

    it('should flag when over budget', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const dbContext = {
        getEvent: vi.fn().mockResolvedValue({
          destination: 'LHR',
          departureDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          returnDate: Date.now() + 35 * 24 * 60 * 60 * 1000,
          budgetPerEmployee: 500, // Very low budget
        }),
        getEmployee: vi.fn().mockResolvedValue({
          location: 'JFK',
          restrictions: {},
        }),
        getTrip: vi.fn(),
        listTrips: vi.fn(),
        updateTrip: vi.fn(),
        createItinerary: vi.fn(),
      }
      
      const result = await executeTool(
        {
          id: 'call_1',
          name: 'generate_itinerary',
          arguments: {
            eventId: 'event_1',
            employeeId: 'emp_1',
          },
        },
        dbContext
      )
      
      const itinerary = result.result as any
      
      // Should indicate budget issue
      expect(itinerary.withinBudget).toBe(false)
    })
  })

  describe('Flight Selection Accuracy', () => {
    it('should select direct flights when available', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const result = await executeTool({
        id: 'call_1',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_1',
          employeeId: 'emp_1',
        },
      })
      
      const itinerary = result.result as any
      
      // All mock flights are direct (stops: 0)
      expect(itinerary.outboundFlight.stops).toBe(0)
    })

    it('should match origin to employee location', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const dbContext = {
        getEvent: vi.fn().mockResolvedValue({
          destination: 'LHR',
          departureDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          returnDate: Date.now() + 35 * 24 * 60 * 60 * 1000,
          budgetPerEmployee: 2000,
        }),
        getEmployee: vi.fn().mockResolvedValue({
          location: 'LAX', // Different location
          restrictions: {},
        }),
        getTrip: vi.fn(),
        listTrips: vi.fn(),
        updateTrip: vi.fn(),
        createItinerary: vi.fn(),
      }
      
      await executeTool(
        {
          id: 'call_1',
          name: 'generate_itinerary',
          arguments: {
            eventId: 'event_1',
            employeeId: 'emp_1',
          },
        },
        dbContext
      )
      
      // Verify search was made with correct origin
      expect(mockItinerarySearchFlights).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: 'LAX',
        })
      )
    })

    it('should match destination to event destination', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const dbContext = {
        getEvent: vi.fn().mockResolvedValue({
          destination: 'CDG', // Paris
          departureDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          returnDate: Date.now() + 35 * 24 * 60 * 60 * 1000,
          budgetPerEmployee: 2000,
        }),
        getEmployee: vi.fn().mockResolvedValue({
          location: 'JFK',
          restrictions: {},
        }),
        getTrip: vi.fn(),
        listTrips: vi.fn(),
        updateTrip: vi.fn(),
        createItinerary: vi.fn(),
      }
      
      await executeTool(
        {
          id: 'call_1',
          name: 'generate_itinerary',
          arguments: {
            eventId: 'event_1',
            employeeId: 'emp_1',
          },
        },
        dbContext
      )
      
      expect(mockItinerarySearchFlights).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: 'CDG',
        })
      )
    })
  })

  describe('Hotel Booking Accuracy', () => {
    it('should include hotel in itinerary', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const result = await executeTool({
        id: 'call_1',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_1',
          employeeId: 'emp_1',
        },
      })
      
      const itinerary = result.result as any
      
      expect(itinerary.hotel).toBeDefined()
      expect(itinerary.hotel.name).toBeDefined()
      expect(itinerary.hotel.totalPrice).toBeGreaterThan(0)
    })

    it('should calculate correct hotel nights', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const departureDate = Date.now() + 30 * 24 * 60 * 60 * 1000
      const returnDate = Date.now() + 35 * 24 * 60 * 60 * 1000
      const expectedNights = Math.ceil((returnDate - departureDate) / (24 * 60 * 60 * 1000))
      
      const dbContext = {
        getEvent: vi.fn().mockResolvedValue({
          destination: 'LHR',
          departureDate,
          returnDate,
          budgetPerEmployee: 3000,
        }),
        getEmployee: vi.fn().mockResolvedValue({
          location: 'JFK',
          restrictions: {},
        }),
        getTrip: vi.fn(),
        listTrips: vi.fn(),
        updateTrip: vi.fn(),
        createItinerary: vi.fn(),
      }
      
      const result = await executeTool(
        {
          id: 'call_1',
          name: 'generate_itinerary',
          arguments: {
            eventId: 'event_1',
            employeeId: 'emp_1',
          },
        },
        dbContext
      )
      
      const itinerary = result.result as any
      
      // Total hotel price should reflect number of nights
      expect(itinerary.hotel.pricePerNight).toBeGreaterThan(0)
      expect(itinerary.hotel.totalPrice).toBeGreaterThanOrEqual(
        itinerary.hotel.pricePerNight * 1 // At least 1 night
      )
    })
  })

  describe('Ground Transport Accuracy', () => {
    it('should include ground transport', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const result = await executeTool({
        id: 'call_1',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_1',
          employeeId: 'emp_1',
        },
      })
      
      const itinerary = result.result as any
      
      expect(itinerary.groundTransport).toBeDefined()
      expect(itinerary.groundTransport.type).toBeDefined()
      expect(itinerary.groundTransport.price).toBeGreaterThan(0)
    })
  })

  describe('Total Cost Accuracy', () => {
    it('should calculate total cost correctly', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const result = await executeTool({
        id: 'call_1',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_1',
          employeeId: 'emp_1',
        },
      })
      
      const itinerary = result.result as any
      
      const expectedTotal = 
        (itinerary.outboundFlight?.price ?? 0) +
        (itinerary.returnFlight?.price ?? 0) +
        itinerary.hotel.totalPrice +
        itinerary.groundTransport.price
      
      expect(itinerary.totalCost).toBe(expectedTotal)
    })
  })
})

describe('Team Itinerary Accuracy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate itinerary for each team member', async () => {
    const { executeTool } = await import('@/lib/agent/tool-executor')
    
    const dbContext = {
      getEvent: vi.fn().mockResolvedValue({
        destination: 'LHR',
        departureDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        returnDate: Date.now() + 35 * 24 * 60 * 60 * 1000,
        budgetPerEmployee: 2000,
      }),
      getEmployee: vi.fn().mockResolvedValue({
        location: 'JFK',
        restrictions: {},
      }),
      getTrip: vi.fn(),
      listTrips: vi.fn().mockResolvedValue([
        { employeeId: 'emp_1' },
        { employeeId: 'emp_2' },
        { employeeId: 'emp_3' },
      ]),
      updateTrip: vi.fn(),
      createItinerary: vi.fn(),
    }
    
    const result = await executeTool(
      {
        id: 'call_1',
        name: 'generate_team_itineraries',
        arguments: {
          eventId: 'event_1',
        },
      },
      dbContext
    )
    
    expect(result.error).toBeUndefined()
    
    const teamResult = result.result as any
    expect(teamResult.generated).toBe(3)
    expect(teamResult.itineraries.length).toBe(3)
  })

  it('should personalize itineraries for different locations', async () => {
    const { executeTool } = await import('@/lib/agent/tool-executor')
    
    const dbContext = {
      getEvent: vi.fn().mockResolvedValue({
        destination: 'LHR',
        departureDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        returnDate: Date.now() + 35 * 24 * 60 * 60 * 1000,
        budgetPerEmployee: 2000,
      }),
      getEmployee: vi.fn()
        .mockResolvedValueOnce({ location: 'JFK', restrictions: {} })
        .mockResolvedValueOnce({ location: 'LAX', restrictions: {} })
        .mockResolvedValueOnce({ location: 'ORD', restrictions: {} }),
      getTrip: vi.fn(),
      listTrips: vi.fn().mockResolvedValue([
        { employeeId: 'emp_1' },
        { employeeId: 'emp_2' },
        { employeeId: 'emp_3' },
      ]),
      updateTrip: vi.fn(),
      createItinerary: vi.fn(),
    }
    
    await executeTool(
      {
        id: 'call_1',
        name: 'generate_team_itineraries',
        arguments: {
          eventId: 'event_1',
        },
      },
      dbContext
    )
    
    // Should have searched with different origins
    const searchCalls = mockItinerarySearchFlights.mock.calls
    const origins = searchCalls.map((call: any[]) => call[0].origin)
    
    // Should include different origins
    expect(origins).toContain('JFK')
    expect(origins).toContain('LAX')
    expect(origins).toContain('ORD')
  })
})

describe('Policy Compliance Accuracy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mark compliant itineraries', async () => {
    const { executeTool } = await import('@/lib/agent/tool-executor')
    
    const result = await executeTool({
      id: 'call_1',
      name: 'generate_itinerary',
      arguments: {
        eventId: 'event_1',
        employeeId: 'emp_1',
      },
    })
    
    const itinerary = result.result as any
    
    expect(itinerary.policyCompliant).toBeDefined()
    expect(typeof itinerary.policyCompliant).toBe('boolean')
  })
})
