/**
 * Integration tests for Agent Workflow
 * 
 * Tests the complete flow from user message to agent response with tool calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Google Generative AI using factory function pattern for Vitest 4.x
vi.mock('@google/generative-ai', () => {
  const mockWorkflowSendMessage = vi.fn().mockResolvedValue({
    response: {
      text: vi.fn().mockReturnValue('I found flights for you.'),
      functionCalls: vi.fn().mockReturnValue(null),
    },
  })

  const mockWorkflowStartChat = vi.fn().mockReturnValue({
    sendMessage: mockWorkflowSendMessage,
  })

  const mockWorkflowGetModel = vi.fn().mockReturnValue({
    startChat: mockWorkflowStartChat,
  })

  // Define mock class using function constructor
  function MockGoogleGenerativeAIForWorkflow(apiKey: string) {
    // @ts-ignore
    this.apiKey = apiKey
    // @ts-ignore
    this.getGenerativeModel = mockWorkflowGetModel
  }

  return {
    GoogleGenerativeAI: MockGoogleGenerativeAIForWorkflow,
    FunctionCallingMode: { AUTO: 'AUTO' },
  }
})

// Mock MCP integration using factory function
vi.mock('@/lib/agent/mcp-integration', () => {
  const mockSearchFlights = vi.fn().mockResolvedValue({
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

  const mockGetFlightDetails = vi.fn().mockResolvedValue(null)
  const mockSendPayment = vi.fn().mockResolvedValue({
    success: true,
    transactionId: 'tx_123',
  })

  // Class-based mocks
  function MockKiwiClient() {
    // @ts-ignore
    this.searchFlights = mockSearchFlights
    // @ts-ignore
    this.getFlightDetails = mockGetFlightDetails
    // @ts-ignore
    this.listTools = vi.fn().mockResolvedValue([])
    // @ts-ignore
    this.disconnect = vi.fn().mockResolvedValue(undefined)
  }

  function MockLocusClient() {
    // @ts-ignore
    this.sendPayment = mockSendPayment
  }

  return {
    KiwiClient: MockKiwiClient,
    LocusClient: MockLocusClient,
    kiwiClient: new (MockKiwiClient as any)(),
    locusClient: new (MockLocusClient as any)(),
  }
})

describe('Agent Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_AI_API_KEY = 'test_key'
  })

  describe('Simple Conversation', () => {
    it('should handle basic greeting', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await chatWithGeminiAgent('Hello!')
      
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
      expect(typeof response.content).toBe('string')
    })

    it('should maintain conversation context', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const history = [
        { role: 'user' as const, content: 'I need to book travel for my team' },
        { role: 'assistant' as const, content: 'I can help with that. How many people?' },
      ]
      
      const response = await chatWithGeminiAgent('5 people', history)
      
      expect(response).toBeDefined()
    })
  })

  describe('Flight Search Workflow', () => {
    it('should execute flight search tool', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const result = await executeTool({
        id: 'call_1',
        name: 'search_flights',
        arguments: {
          origin: 'JFK',
          destination: 'LHR',
          departureDate: '2026-03-01',
          passengers: 1,
        },
      })
      
      expect(result.error).toBeUndefined()
      expect(result.result).toBeDefined()
      
      const searchResult = result.result as any
      expect(searchResult.flights).toBeDefined()
      expect(searchResult.flights.length).toBeGreaterThan(0)
    })

    it('should return flight details in search results', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const result = await executeTool({
        id: 'call_1',
        name: 'search_flights',
        arguments: {
          origin: 'SFO',
          destination: 'CDG',
          departureDate: '2026-04-15',
          passengers: 2,
          cabinClass: 'business',
        },
      })
      
      const searchResult = result.result as any
      const flight = searchResult.flights[0]
      
      expect(flight).toHaveProperty('id')
      expect(flight).toHaveProperty('airline')
      expect(flight).toHaveProperty('price')
      expect(flight).toHaveProperty('departure')
      expect(flight).toHaveProperty('arrival')
    })
  })

  describe('Itinerary Generation Workflow', () => {
    it('should generate single employee itinerary', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const result = await executeTool({
        id: 'call_1',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_123',
          employeeId: 'emp_1',
        },
      })
      
      expect(result.error).toBeUndefined()
      
      const itinerary = result.result as any
      expect(itinerary.eventId).toBe('event_123')
      expect(itinerary.employeeId).toBe('emp_1')
      expect(itinerary.outboundFlight).toBeDefined()
      expect(itinerary.hotel).toBeDefined()
      expect(itinerary.totalCost).toBeGreaterThan(0)
    })

    it('should generate team itineraries', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const result = await executeTool({
        id: 'call_1',
        name: 'generate_team_itineraries',
        arguments: {
          eventId: 'event_123',
        },
      })
      
      expect(result.error).toBeUndefined()
      
      const teamResult = result.result as any
      expect(teamResult.generated).toBeGreaterThanOrEqual(1)
      expect(teamResult.itineraries).toBeDefined()
      expect(Array.isArray(teamResult.itineraries)).toBe(true)
    })

    it('should include all itinerary components', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const result = await executeTool({
        id: 'call_1',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_123',
          employeeId: 'emp_1',
        },
      })
      
      const itinerary = result.result as any
      
      // Check all components
      expect(itinerary.outboundFlight).toBeDefined()
      expect(itinerary.returnFlight).toBeDefined()
      expect(itinerary.hotel).toBeDefined()
      expect(itinerary.hotel.name).toBeDefined()
      expect(itinerary.hotel.checkIn).toBeDefined()
      expect(itinerary.hotel.checkOut).toBeDefined()
      expect(itinerary.groundTransport).toBeDefined()
      expect(itinerary.totalCost).toBeDefined()
      expect(itinerary.withinBudget).toBeDefined()
    })
  })

  describe('Budget Compliance Workflow', () => {
    it('should check budget compliance', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const dbContext = {
        getEvent: vi.fn().mockResolvedValue({
          id: 'event_1',
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
      
      const result = await executeTool(
        {
          id: 'call_1',
          name: 'check_budget_compliance',
          arguments: {
            eventId: 'event_1',
            tripId: 'trip_1',
          },
        },
        dbContext
      )
      
      expect(result.error).toBeUndefined()
      
      const budgetResult = result.result as any
      expect(budgetResult.budget).toBe(2000)
      expect(budgetResult.totalCost).toBe(1500)
      expect(budgetResult.withinBudget).toBe(true)
      expect(budgetResult.percentUsed).toBe(75)
    })

    it('should detect budget overage', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const dbContext = {
        getEvent: vi.fn().mockResolvedValue({
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
      
      const result = await executeTool(
        {
          id: 'call_1',
          name: 'check_budget_compliance',
          arguments: {
            eventId: 'event_1',
            tripId: 'trip_1',
          },
        },
        dbContext
      )
      
      const budgetResult = result.result as any
      expect(budgetResult.withinBudget).toBe(false)
      expect(budgetResult.overage).toBe(500)
    })
  })

  describe('Payment Workflow', () => {
    it('should process payment in demo mode', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const result = await executeTool({
        id: 'call_1',
        name: 'process_payment',
        arguments: {
          amount: 1500,
          description: 'Flight booking',
          tripId: 'trip_123',
        },
      })
      
      expect(result.error).toBeUndefined()
      
      const paymentResult = result.result as any
      expect(paymentResult.success).toBe(true)
      expect(paymentResult.actualAmount).toBe(0.05) // Demo cap
      expect(paymentResult.requestedAmount).toBe(1500)
      expect(paymentResult.note).toContain('Demo mode')
    })
  })

  describe('Data Retrieval Workflow', () => {
    it('should get event details', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const mockEvent = {
        id: 'event_1',
        name: 'Q1 Offsite',
        destination: 'London',
        budgetPerEmployee: 2000,
      }
      
      const dbContext = {
        getEvent: vi.fn().mockResolvedValue(mockEvent),
        getEmployee: vi.fn(),
        getTrip: vi.fn(),
        listTrips: vi.fn(),
        updateTrip: vi.fn(),
        createItinerary: vi.fn(),
      }
      
      const result = await executeTool(
        {
          id: 'call_1',
          name: 'get_event_details',
          arguments: { eventId: 'event_1' },
        },
        dbContext
      )
      
      expect(result.error).toBeUndefined()
      expect(result.result).toEqual(mockEvent)
    })

    it('should list pending trips', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const mockTrips = [
        { id: 'trip_1', status: 'pending' },
        { id: 'trip_2', status: 'pending' },
      ]
      
      const dbContext = {
        getEvent: vi.fn(),
        getEmployee: vi.fn(),
        getTrip: vi.fn(),
        listTrips: vi.fn().mockResolvedValue(mockTrips),
        updateTrip: vi.fn(),
        createItinerary: vi.fn(),
      }
      
      const result = await executeTool(
        {
          id: 'call_1',
          name: 'list_pending_trips',
          arguments: { eventId: 'event_1' },
        },
        dbContext
      )
      
      expect(result.error).toBeUndefined()
      expect(result.result).toEqual(mockTrips)
    })
  })

  describe('Parallel Tool Execution', () => {
    it('should execute multiple tools in parallel', async () => {
      const { executeTools } = await import('@/lib/agent/tool-executor')
      
      const toolCalls = [
        {
          id: 'call_1',
          name: 'search_flights',
          arguments: {
            origin: 'JFK',
            destination: 'LHR',
            departureDate: '2026-03-01',
            passengers: 1,
          },
        },
        {
          id: 'call_2',
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
      expect(results[0].id).toBe('call_1')
      expect(results[1].id).toBe('call_2')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing database context gracefully', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const result = await executeTool({
        id: 'call_1',
        name: 'get_event_details',
        arguments: { eventId: 'event_1' },
      })
      
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Database context required')
    })

    it('should handle unknown tools', async () => {
      const { executeTool } = await import('@/lib/agent/tool-executor')
      
      const result = await executeTool({
        id: 'call_1',
        name: 'unknown_tool',
        arguments: {},
      })
      
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Unknown tool')
    })
  })
})

describe('End-to-End Agent Scenarios', () => {
  beforeEach(() => {
    process.env.GOOGLE_AI_API_KEY = 'test_key'
  })

  it('should handle complete itinerary request flow', async () => {
    const { executeTools } = await import('@/lib/agent/tool-executor')
    
    // Simulate agent calling multiple tools
    const toolCalls = [
      {
        id: 'call_1',
        name: 'search_flights',
        arguments: {
          origin: 'JFK',
          destination: 'LHR',
          departureDate: '2026-03-01',
          passengers: 1,
        },
      },
      {
        id: 'call_2',
        name: 'generate_itinerary',
        arguments: {
          eventId: 'event_1',
          employeeId: 'emp_1',
        },
      },
    ]
    
    const results = await executeTools(toolCalls)
    
    // Verify all tools executed successfully
    expect(results[0].error).toBeUndefined()
    expect(results[1].error).toBeUndefined()
    
    // Verify search returned flights
    const searchResult = results[0].result as any
    expect(searchResult.flights.length).toBeGreaterThan(0)
    
    // Verify itinerary was generated
    const itinerary = results[1].result as any
    expect(itinerary.totalCost).toBeGreaterThan(0)
  })
})
