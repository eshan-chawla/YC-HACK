/**
 * Unit tests for Itinerary Generator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mock functions that can be tracked
const mockSearchFlights = vi.fn().mockResolvedValue({
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
      price: 500,
      currency: 'USD',
      cabinClass: 'economy',
      seatsAvailable: 10,
    },
    {
      id: 'flight_2',
      airline: 'Delta Airlines',
      flightNumber: 'DL456',
      departure: { airport: 'JFK', time: '2026-03-01T10:00:00' },
      arrival: { airport: 'LHR', time: '2026-03-01T22:00:00' },
      duration: 420,
      stops: 0,
      price: 450,
      currency: 'USD',
      cabinClass: 'economy',
      seatsAvailable: 8,
    },
  ],
  currency: 'USD',
  searchedAt: new Date().toISOString(),
})

const mockSendPayment = vi.fn()

// Mock class instances for proper method tracking
class MockKiwiClient {
  searchFlights = mockSearchFlights
  getFlightDetails = vi.fn().mockResolvedValue(null)
  listTools = vi.fn().mockResolvedValue([])
  disconnect = vi.fn().mockResolvedValue(undefined)
}

class MockLocusClient {
  sendPayment = mockSendPayment
}

// Mock the MCP integration module
vi.mock('@/lib/agent/mcp-integration', () => ({
  KiwiClient: MockKiwiClient,
  LocusClient: MockLocusClient,
  kiwiClient: new MockKiwiClient(),
  locusClient: new MockLocusClient(),
}))

describe('Itinerary Generator', () => {
  let executeTool: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset mock to default implementation
    mockSearchFlights.mockResolvedValue({
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
          price: 500,
          currency: 'USD',
          cabinClass: 'economy',
          seatsAvailable: 10,
        },
        {
          id: 'flight_2',
          airline: 'Delta Airlines',
          flightNumber: 'DL456',
          departure: { airport: 'JFK', time: '2026-03-01T10:00:00' },
          arrival: { airport: 'LHR', time: '2026-03-01T22:00:00' },
          duration: 420,
          stops: 0,
          price: 450,
          currency: 'USD',
          cabinClass: 'economy',
          seatsAvailable: 8,
        },
      ],
      currency: 'USD',
      searchedAt: new Date().toISOString(),
    })
    const module = await import('@/lib/agent/tool-executor')
    executeTool = module.executeTool
  })

  describe('generateSingleItinerary', () => {
    it('should generate itinerary with default values when no dbContext', async () => {
      const toolCall = {
        id: 'call_1',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_123',
          employeeId: 'emp_1',
        },
      }

      const result = await executeTool(toolCall)

      expect(result.error).toBeUndefined()
      const itinerary = result.result
      
      expect(itinerary.eventId).toBe('event_123')
      expect(itinerary.employeeId).toBe('emp_1')
      expect(itinerary.tripId).toContain('event_123')
      expect(itinerary.tripId).toContain('emp_1')
    })

    it('should include outbound flight', async () => {
      const toolCall = {
        id: 'call_2',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_123',
          employeeId: 'emp_1',
        },
      }

      const result = await executeTool(toolCall)
      const itinerary = result.result

      expect(itinerary.outboundFlight).toBeDefined()
      expect(itinerary.outboundFlight.airline).toBeDefined()
      expect(itinerary.outboundFlight.price).toBeGreaterThan(0)
    })

    it('should include return flight', async () => {
      const toolCall = {
        id: 'call_3',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_123',
          employeeId: 'emp_1',
        },
      }

      const result = await executeTool(toolCall)
      const itinerary = result.result

      expect(itinerary.returnFlight).toBeDefined()
      expect(itinerary.returnFlight.price).toBeGreaterThan(0)
    })

    it('should include hotel booking', async () => {
      const toolCall = {
        id: 'call_4',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_123',
          employeeId: 'emp_1',
        },
      }

      const result = await executeTool(toolCall)
      const itinerary = result.result

      expect(itinerary.hotel).toBeDefined()
      expect(itinerary.hotel.name).toBeDefined()
      expect(itinerary.hotel.address).toBeDefined()
      expect(itinerary.hotel.checkIn).toBeDefined()
      expect(itinerary.hotel.checkOut).toBeDefined()
      expect(itinerary.hotel.room).toBeDefined()
      expect(itinerary.hotel.pricePerNight).toBeGreaterThan(0)
      expect(itinerary.hotel.totalPrice).toBeGreaterThan(0)
    })

    it('should include ground transport', async () => {
      const toolCall = {
        id: 'call_5',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_123',
          employeeId: 'emp_1',
        },
      }

      const result = await executeTool(toolCall)
      const itinerary = result.result

      expect(itinerary.groundTransport).toBeDefined()
      expect(itinerary.groundTransport.type).toBeDefined()
      expect(itinerary.groundTransport.from).toBeDefined()
      expect(itinerary.groundTransport.to).toBeDefined()
      expect(itinerary.groundTransport.price).toBeGreaterThan(0)
    })

    it('should calculate total cost correctly', async () => {
      const toolCall = {
        id: 'call_6',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_123',
          employeeId: 'emp_1',
        },
      }

      const result = await executeTool(toolCall)
      const itinerary = result.result

      const expectedTotal = 
        (itinerary.outboundFlight?.price ?? 0) +
        (itinerary.returnFlight?.price ?? 0) +
        itinerary.hotel.totalPrice +
        itinerary.groundTransport.price

      expect(itinerary.totalCost).toBe(expectedTotal)
    })

    it('should check budget compliance', async () => {
      const toolCall = {
        id: 'call_7',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_123',
          employeeId: 'emp_1',
        },
      }

      const result = await executeTool(toolCall)
      const itinerary = result.result

      expect(typeof itinerary.withinBudget).toBe('boolean')
    })

    it('should include notes', async () => {
      const toolCall = {
        id: 'call_8',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_123',
          employeeId: 'emp_1',
        },
      }

      const result = await executeTool(toolCall)
      const itinerary = result.result

      expect(itinerary.notes).toBeDefined()
      expect(typeof itinerary.notes).toBe('string')
      expect(itinerary.notes.length).toBeGreaterThan(0)
    })

    it('should use event data from dbContext', async () => {
      const dbContext = {
        getEvent: vi.fn().mockResolvedValue({
          id: 'event_123',
          destination: 'CDG',
          departureDate: new Date('2026-04-01').getTime(),
          returnDate: new Date('2026-04-05').getTime(),
          budgetPerEmployee: 3000,
          requirements: {
            cabinClass: 'business',
          },
        }),
        getEmployee: vi.fn().mockResolvedValue({
          id: 'emp_1',
          location: 'LAX',
          restrictions: {
            dietary: ['vegetarian'],
            seating: 'aisle',
          },
        }),
        getTrip: vi.fn(),
        listTrips: vi.fn(),
        updateTrip: vi.fn(),
        createItinerary: vi.fn(),
      }

      const toolCall = {
        id: 'call_9',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_123',
          employeeId: 'emp_1',
        },
      }

      const result = await executeTool(toolCall, dbContext)

      expect(dbContext.getEvent).toHaveBeenCalledWith('event_123')
      expect(dbContext.getEmployee).toHaveBeenCalledWith('emp_1')
    })
  })

  describe('generateTeamItineraries', () => {
    it('should generate itinerary for each team member', async () => {
      const dbContext = {
        getEvent: vi.fn().mockResolvedValue({
          id: 'event_123',
          destination: 'LHR',
          departureDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          returnDate: Date.now() + 35 * 24 * 60 * 60 * 1000,
          budgetPerEmployee: 2000,
        }),
        getEmployee: vi.fn().mockResolvedValue({
          location: 'NYC',
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

      const toolCall = {
        id: 'call_10',
        name: 'generate_team_itineraries',
        arguments: {
          eventId: 'event_123',
        },
      }

      const result = await executeTool(toolCall, dbContext)

      expect(result.error).toBeUndefined()
      expect(result.result.generated).toBe(3)
      expect(result.result.itineraries.length).toBe(3)
    })

    it('should return mock data when no dbContext', async () => {
      const toolCall = {
        id: 'call_11',
        name: 'generate_team_itineraries',
        arguments: {
          eventId: 'event_123',
        },
      }

      const result = await executeTool(toolCall)

      expect(result.error).toBeUndefined()
      expect(result.result.generated).toBeGreaterThanOrEqual(1)
      expect(result.result.itineraries.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle errors for individual employees gracefully', async () => {
      const dbContext = {
        getEvent: vi.fn()
          .mockResolvedValueOnce({
            destination: 'LHR',
            budgetPerEmployee: 2000,
          })
          .mockRejectedValueOnce(new Error('Event not found'))
          .mockResolvedValueOnce({
            destination: 'LHR',
            budgetPerEmployee: 2000,
          }),
        getEmployee: vi.fn()
          .mockResolvedValueOnce({ location: 'NYC' })
          .mockResolvedValueOnce({ location: 'LAX' })
          .mockResolvedValueOnce({ location: 'CHI' }),
        getTrip: vi.fn(),
        listTrips: vi.fn().mockResolvedValue([
          { employeeId: 'emp_1' },
          { employeeId: 'emp_2' },
          { employeeId: 'emp_3' },
        ]),
        updateTrip: vi.fn(),
        createItinerary: vi.fn(),
      }

      const toolCall = {
        id: 'call_12',
        name: 'generate_team_itineraries',
        arguments: {
          eventId: 'event_123',
        },
      }

      const result = await executeTool(toolCall, dbContext)

      // Should still have some itineraries even if one failed
      expect(result.result.itineraries.length).toBeGreaterThan(0)
    })
  })
})

describe('Budget Allocation', () => {
  it('should allocate approximately 60% budget to flights', async () => {
    const budget = 2000
    const expectedMaxFlightPrice = budget * 0.6

    // Verify the flight search uses max price based on budget
    const module = await import('@/lib/agent/tool-executor')
    
    const dbContext = {
      getEvent: vi.fn().mockResolvedValue({
        destination: 'LHR',
        budgetPerEmployee: budget,
      }),
      getEmployee: vi.fn().mockResolvedValue({
        location: 'NYC',
      }),
      getTrip: vi.fn(),
      listTrips: vi.fn(),
      updateTrip: vi.fn(),
      createItinerary: vi.fn(),
    }

    await module.executeTool(
      {
        id: 'test',
        name: 'generate_itinerary',
        arguments: { eventId: 'e1', employeeId: 'emp1' },
      },
      dbContext
    )

    // Verify kiwiClient was called with appropriate max price
    expect(mockSearchFlights).toHaveBeenCalledWith(
      expect.objectContaining({
        maxPrice: expectedMaxFlightPrice,
      })
    )
  })
})

describe('Policy Compliance', () => {
  it('should mark itinerary as policy compliant', async () => {
    const module = await import('@/lib/agent/tool-executor')
    
    const result = await module.executeTool({
      id: 'test',
      name: 'generate_itinerary',
      arguments: { eventId: 'e1', employeeId: 'emp1' },
    })

    expect(result.result.policyCompliant).toBe(true)
  })

  it('should detect when over budget', async () => {
    // Mock expensive flights
    mockSearchFlights.mockResolvedValueOnce({
      searchId: 'expensive_search',
      flights: [
        {
          id: 'expensive_flight',
          airline: 'Premium Airlines',
          price: 5000,
          departure: { airport: 'JFK', time: '2026-03-01T08:00:00' },
          arrival: { airport: 'LHR', time: '2026-03-01T20:00:00' },
        },
      ],
      currency: 'USD',
      searchedAt: new Date().toISOString(),
    })

    const module = await import('@/lib/agent/tool-executor')
    
    const dbContext = {
      getEvent: vi.fn().mockResolvedValue({
        destination: 'LHR',
        budgetPerEmployee: 1000, // Low budget
      }),
      getEmployee: vi.fn().mockResolvedValue({
        location: 'NYC',
      }),
      getTrip: vi.fn(),
      listTrips: vi.fn(),
      updateTrip: vi.fn(),
      createItinerary: vi.fn(),
    }

    const result = await module.executeTool(
      {
        id: 'test',
        name: 'generate_itinerary',
        arguments: { eventId: 'e1', employeeId: 'emp1' },
      },
      dbContext
    )

    // Total cost should exceed budget
    expect(result.result.withinBudget).toBe(false)
  })
})
