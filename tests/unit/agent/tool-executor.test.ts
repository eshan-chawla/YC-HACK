/**
 * Unit tests for Tool Executor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ToolCall, DatabaseContext } from '@/lib/agent/tool-executor'

// Create mock functions that can be tracked
const mockToolExecSearchFlights = vi.fn().mockResolvedValue({
  searchId: 'test_search',
  flights: [
    {
      id: 'flight_1',
      airline: 'United',
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
  ],
  currency: 'USD',
  searchedAt: new Date().toISOString(),
})

const mockToolExecGetFlightDetails = vi.fn().mockResolvedValue(null)
const mockToolExecSendPayment = vi.fn().mockResolvedValue({
  success: true,
  transactionId: 'tx_123',
})

// Create proper class mocks for singleton instances
class MockKiwiClientForToolExec {
  searchFlights = mockToolExecSearchFlights
  getFlightDetails = mockToolExecGetFlightDetails
  listTools = vi.fn().mockResolvedValue([])
  disconnect = vi.fn().mockResolvedValue(undefined)
}

class MockLocusClientForToolExec {
  sendPayment = mockToolExecSendPayment
}

// Mock MCP clients with proper class instances
vi.mock('@/lib/agent/mcp-integration', () => ({
  KiwiClient: MockKiwiClientForToolExec,
  LocusClient: MockLocusClientForToolExec,
  kiwiClient: new MockKiwiClientForToolExec(),
  locusClient: new MockLocusClientForToolExec(),
}))

describe('Tool Executor', () => {
  let executeTool: any
  let executeTools: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('@/lib/agent/tool-executor')
    executeTool = module.executeTool
    executeTools = module.executeTools
  })

  describe('executeTool', () => {
    describe('Kiwi Tools', () => {
      it('should execute search_flights tool', async () => {
        const toolCall: ToolCall = {
          id: 'call_1',
          name: 'search_flights',
          arguments: {
            origin: 'JFK',
            destination: 'LHR',
            departureDate: '2026-03-01',
            passengers: 1,
          },
        }

        const result = await executeTool(toolCall)

        expect(result.id).toBe('call_1')
        expect(result.name).toBe('search_flights')
        expect(result.result).toBeDefined()
        expect(result.error).toBeUndefined()
      })

      it('should execute get_flight_details tool', async () => {
        const toolCall: ToolCall = {
          id: 'call_2',
          name: 'get_flight_details',
          arguments: {
            flightId: 'flight_123',
          },
        }

        const result = await executeTool(toolCall)

        expect(result.id).toBe('call_2')
        expect(result.name).toBe('get_flight_details')
        expect(result.error).toBeUndefined()
      })
    })

    describe('Payment Tools', () => {
      it('should execute process_payment tool with demo limits', async () => {
        const toolCall: ToolCall = {
          id: 'call_3',
          name: 'process_payment',
          arguments: {
            amount: 1000,
            description: 'Flight booking',
            tripId: 'trip_123',
          },
        }

        const result = await executeTool(toolCall)

        expect(result.id).toBe('call_3')
        expect(result.name).toBe('process_payment')
        expect(result.result).toBeDefined()
        
        const paymentResult = result.result as any
        expect(paymentResult.actualAmount).toBe(0.05) // Demo limit
        expect(paymentResult.requestedAmount).toBe(1000)
        expect(paymentResult.note).toContain('Demo mode')
      })
    })

    describe('Data Tools', () => {
      it('should throw error when dbContext is missing', async () => {
        const toolCall: ToolCall = {
          id: 'call_4',
          name: 'get_event_details',
          arguments: { eventId: 'event_123' },
        }

        const result = await executeTool(toolCall)

        expect(result.error).toBe('Database context required for data tools')
      })

      it('should execute get_event_details with dbContext', async () => {
        const dbContext: DatabaseContext = {
          getEvent: vi.fn().mockResolvedValue({ id: 'event_123', name: 'Test Event' }),
          getEmployee: vi.fn(),
          getTrip: vi.fn(),
          listTrips: vi.fn(),
          updateTrip: vi.fn(),
          createItinerary: vi.fn(),
        }

        const toolCall: ToolCall = {
          id: 'call_5',
          name: 'get_event_details',
          arguments: { eventId: 'event_123' },
        }

        const result = await executeTool(toolCall, dbContext)

        expect(result.error).toBeUndefined()
        expect(result.result).toEqual({ id: 'event_123', name: 'Test Event' })
        expect(dbContext.getEvent).toHaveBeenCalledWith('event_123')
      })

      it('should execute get_employee_details with dbContext', async () => {
        const dbContext: DatabaseContext = {
          getEvent: vi.fn(),
          getEmployee: vi.fn().mockResolvedValue({ id: 'emp_1', name: 'John' }),
          getTrip: vi.fn(),
          listTrips: vi.fn(),
          updateTrip: vi.fn(),
          createItinerary: vi.fn(),
        }

        const toolCall: ToolCall = {
          id: 'call_6',
          name: 'get_employee_details',
          arguments: { employeeId: 'emp_1' },
        }

        const result = await executeTool(toolCall, dbContext)

        expect(result.error).toBeUndefined()
        expect(dbContext.getEmployee).toHaveBeenCalledWith('emp_1')
      })

      it('should execute list_pending_trips with dbContext', async () => {
        const dbContext: DatabaseContext = {
          getEvent: vi.fn(),
          getEmployee: vi.fn(),
          getTrip: vi.fn(),
          listTrips: vi.fn().mockResolvedValue([{ id: 'trip_1' }, { id: 'trip_2' }]),
          updateTrip: vi.fn(),
          createItinerary: vi.fn(),
        }

        const toolCall: ToolCall = {
          id: 'call_7',
          name: 'list_pending_trips',
          arguments: { eventId: 'event_123' },
        }

        const result = await executeTool(toolCall, dbContext)

        expect(result.error).toBeUndefined()
        expect(dbContext.listTrips).toHaveBeenCalledWith({
          eventId: 'event_123',
          employeeId: undefined,
          status: 'pending',
        })
      })
    })

    describe('Itinerary Tools', () => {
      it('should execute generate_itinerary tool', async () => {
        const toolCall: ToolCall = {
          id: 'call_8',
          name: 'generate_itinerary',
          arguments: {
            eventId: 'event_123',
            employeeId: 'emp_1',
          },
        }

        const result = await executeTool(toolCall)

        expect(result.error).toBeUndefined()
        expect(result.result).toBeDefined()
        
        const itinerary = result.result as any
        expect(itinerary.eventId).toBe('event_123')
        expect(itinerary.employeeId).toBe('emp_1')
        expect(itinerary.outboundFlight).toBeDefined()
        expect(itinerary.hotel).toBeDefined()
        expect(itinerary.totalCost).toBeGreaterThan(0)
      })

      it('should execute generate_team_itineraries tool', async () => {
        const toolCall: ToolCall = {
          id: 'call_9',
          name: 'generate_team_itineraries',
          arguments: {
            eventId: 'event_123',
          },
        }

        const result = await executeTool(toolCall)

        expect(result.error).toBeUndefined()
        expect(result.result).toBeDefined()
        
        const teamResult = result.result as any
        expect(teamResult.generated).toBeGreaterThanOrEqual(1)
        expect(teamResult.itineraries).toBeDefined()
        expect(Array.isArray(teamResult.itineraries)).toBe(true)
      })

      it('should generate team itineraries with dbContext', async () => {
        const dbContext: DatabaseContext = {
          getEvent: vi.fn().mockResolvedValue({
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
          ]),
          updateTrip: vi.fn(),
          createItinerary: vi.fn(),
        }

        const toolCall: ToolCall = {
          id: 'call_10',
          name: 'generate_team_itineraries',
          arguments: { eventId: 'event_123' },
        }

        const result = await executeTool(toolCall, dbContext)

        expect(result.error).toBeUndefined()
        const teamResult = result.result as any
        expect(teamResult.generated).toBe(2)
        expect(teamResult.itineraries.length).toBe(2)
      })
    })

    describe('Budget Tools', () => {
      it('should throw error when dbContext is missing', async () => {
        const toolCall: ToolCall = {
          id: 'call_11',
          name: 'check_budget_compliance',
          arguments: { eventId: 'event_123' },
        }

        const result = await executeTool(toolCall)

        expect(result.error).toBe('Database context required for budget tools')
      })

      it('should check budget compliance', async () => {
        const dbContext: DatabaseContext = {
          getEvent: vi.fn().mockResolvedValue({
            id: 'event_123',
            budgetPerEmployee: 2000,
          }),
          getEmployee: vi.fn(),
          getTrip: vi.fn().mockResolvedValue({
            costBreakdown: { total: 1500 },
          }),
          listTrips: vi.fn(),
          updateTrip: vi.fn(),
          createItinerary: vi.fn(),
        }

        const toolCall: ToolCall = {
          id: 'call_12',
          name: 'check_budget_compliance',
          arguments: {
            eventId: 'event_123',
            tripId: 'trip_1',
          },
        }

        const result = await executeTool(toolCall, dbContext)

        expect(result.error).toBeUndefined()
        const budgetResult = result.result as any
        expect(budgetResult.budget).toBe(2000)
        expect(budgetResult.totalCost).toBe(1500)
        expect(budgetResult.withinBudget).toBe(true)
        expect(budgetResult.overage).toBe(0)
        expect(budgetResult.percentUsed).toBe(75)
      })

      it('should detect budget overage', async () => {
        const dbContext: DatabaseContext = {
          getEvent: vi.fn().mockResolvedValue({
            id: 'event_123',
            budgetPerEmployee: 1000,
          }),
          getEmployee: vi.fn(),
          getTrip: vi.fn().mockResolvedValue({
            costBreakdown: { total: 1500 },
          }),
          listTrips: vi.fn(),
          updateTrip: vi.fn(),
          createItinerary: vi.fn(),
        }

        const toolCall: ToolCall = {
          id: 'call_13',
          name: 'check_budget_compliance',
          arguments: {
            eventId: 'event_123',
            tripId: 'trip_1',
          },
        }

        const result = await executeTool(toolCall, dbContext)

        const budgetResult = result.result as any
        expect(budgetResult.withinBudget).toBe(false)
        expect(budgetResult.overage).toBe(500)
        expect(budgetResult.percentUsed).toBe(150)
      })

      it('should throw error when event not found', async () => {
        const dbContext: DatabaseContext = {
          getEvent: vi.fn().mockResolvedValue(null),
          getEmployee: vi.fn(),
          getTrip: vi.fn(),
          listTrips: vi.fn(),
          updateTrip: vi.fn(),
          createItinerary: vi.fn(),
        }

        const toolCall: ToolCall = {
          id: 'call_14',
          name: 'check_budget_compliance',
          arguments: { eventId: 'nonexistent' },
        }

        const result = await executeTool(toolCall, dbContext)

        expect(result.error).toBe('Event not found')
      })
    })

    describe('Unknown Tools', () => {
      it('should return error for unknown tool', async () => {
        const toolCall: ToolCall = {
          id: 'call_15',
          name: 'unknown_tool',
          arguments: {},
        }

        const result = await executeTool(toolCall)

        expect(result.error).toBe('Unknown tool: unknown_tool')
      })
    })
  })

  describe('executeTools', () => {
    it('should execute multiple tools in parallel', async () => {
      const toolCalls: ToolCall[] = [
        {
          id: 'call_a',
          name: 'search_flights',
          arguments: {
            origin: 'JFK',
            destination: 'LHR',
            departureDate: '2026-03-01',
            passengers: 1,
          },
        },
        {
          id: 'call_b',
          name: 'search_flights',
          arguments: {
            origin: 'SFO',
            destination: 'CDG',
            departureDate: '2026-03-01',
            passengers: 1,
          },
        },
      ]

      const results = await executeTools(toolCalls)

      expect(results.length).toBe(2)
      expect(results[0].id).toBe('call_a')
      expect(results[1].id).toBe('call_b')
    })

    it('should handle mixed success and failure', async () => {
      const toolCalls: ToolCall[] = [
        {
          id: 'call_success',
          name: 'search_flights',
          arguments: {
            origin: 'JFK',
            destination: 'LHR',
            departureDate: '2026-03-01',
            passengers: 1,
          },
        },
        {
          id: 'call_fail',
          name: 'get_event_details',
          arguments: { eventId: 'event_123' },
        },
      ]

      const results = await executeTools(toolCalls)

      expect(results.length).toBe(2)
      expect(results[0].error).toBeUndefined()
      expect(results[1].error).toBeDefined()
    })
  })
})
