/**
 * Unit tests for MCP Integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FlightSearchParams, FlightSearchResult } from '@/lib/agent/types'

// Create mock functions that can be tracked and modified per test
const mockConnect = vi.fn()
const mockClose = vi.fn()
const mockCallTool = vi.fn()
const mockListTools = vi.fn()

// Mock the MCP SDK with factory function pattern for Vitest 4.x
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => {
  // Define mock class using function constructor
  function MockMCPClient(clientInfo: any, options: any) {
    // @ts-ignore
    this.connect = mockConnect.mockResolvedValue(undefined)
    // @ts-ignore
    this.close = mockClose.mockResolvedValue(undefined)
    // @ts-ignore
    this.callTool = mockCallTool.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify([
            {
              id: 'flight_1',
              airline: 'United',
              flight_number: 'UA123',
              departure_airport: 'JFK',
              arrival_airport: 'LHR',
              departure_time: '2026-03-01T08:00:00',
              arrival_time: '2026-03-01T20:00:00',
              price: 500,
              duration: 420,
              stops: 0,
            },
          ]),
        },
      ],
    })
    // @ts-ignore
    this.listTools = mockListTools.mockResolvedValue({
      tools: [
        { name: 'search-flight', description: 'Search for flights' },
        { name: 'feedback-to-devs', description: 'Send feedback' },
      ],
    })
  }

  return {
    Client: MockMCPClient,
  }
})

// Mock the StreamableHTTPClientTransport
vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => {
  function MockStreamableHTTPClientTransport(url: any) {
    // @ts-ignore
    this.url = url
  }

  return {
    StreamableHTTPClientTransport: MockStreamableHTTPClientTransport,
  }
})

describe('KiwiClient', () => {
  let KiwiClient: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset mock implementations to defaults (they're set in the factory)
    // Re-import to get fresh instance
    vi.resetModules()
    const module = await import('@/lib/agent/mcp-integration')
    KiwiClient = module.KiwiClient
  })

  describe('constructor', () => {
    it('should create client with lazy initialization', () => {
      const client = new KiwiClient()
      expect(client).toBeDefined()
    })
  })

  describe('searchFlights', () => {
    it('should search for flights with required params', async () => {
      const client = new KiwiClient()
      
      const params: FlightSearchParams = {
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2026-03-01',
        passengers: 1,
      }
      
      const result = await client.searchFlights(params)
      
      expect(result).toBeDefined()
      expect(result.flights).toBeDefined()
      expect(result.currency).toBe('USD')
      expect(result.searchedAt).toBeDefined()
    })

    it('should search with optional params', async () => {
      const client = new KiwiClient()
      
      const params: FlightSearchParams = {
        origin: 'SFO',
        destination: 'CDG',
        departureDate: '2026-04-15',
        returnDate: '2026-04-20',
        passengers: 2,
        cabinClass: 'business',
        directOnly: true,
        maxPrice: 3000,
      }
      
      const result = await client.searchFlights(params)
      
      expect(result).toBeDefined()
      expect(result.flights).toBeDefined()
    })

    it('should return mock data on connection error', async () => {
      // Mock connection failure using shared mock
      mockConnect.mockRejectedValueOnce(new Error('Connection failed'))
      
      const module = await import('@/lib/agent/mcp-integration')
      const client = new module.KiwiClient()
      
      const params: FlightSearchParams = {
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2026-03-01',
        passengers: 1,
      }
      
      const result = await client.searchFlights(params)
      
      // Should fallback to mock data
      expect(result).toBeDefined()
      expect(result.flights).toBeDefined()
      expect(result.flights.length).toBeGreaterThan(0)
    })

    it('should reuse connection for multiple searches', async () => {
      // Configure mock to return empty array
      mockCallTool.mockResolvedValue({
        content: [{ type: 'text', text: '[]' }],
      })
      
      const module = await import('@/lib/agent/mcp-integration')
      const client = new module.KiwiClient()
      
      const params: FlightSearchParams = {
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2026-03-01',
        passengers: 1,
      }
      
      await client.searchFlights(params)
      await client.searchFlights(params)
      
      // Should only connect once (lazy initialization)
      expect(mockConnect).toHaveBeenCalledTimes(1)
    })
  })

  describe('getFlightDetails', () => {
    it('should return null (Kiwi MCP only supports search)', async () => {
      const client = new KiwiClient()
      
      const result = await client.getFlightDetails('flight_123')
      
      expect(result).toBeNull()
    })
  })

  describe('listTools', () => {
    it('should return available tools', async () => {
      const client = new KiwiClient()
      
      const tools = await client.listTools()
      
      expect(tools).toBeDefined()
      expect(Array.isArray(tools)).toBe(true)
    })

    it('should return empty array on error', async () => {
      // Configure mock to throw error
      mockListTools.mockRejectedValueOnce(new Error('Failed to list tools'))
      
      const module = await import('@/lib/agent/mcp-integration')
      const client = new module.KiwiClient()
      
      const tools = await client.listTools()
      
      expect(tools).toEqual([])
    })
  })

  describe('disconnect', () => {
    it('should close connection cleanly', async () => {
      // Configure mock for this test
      mockCallTool.mockResolvedValue({
        content: [{ type: 'text', text: '[]' }],
      })
      
      const module = await import('@/lib/agent/mcp-integration')
      const client = new module.KiwiClient()
      
      // First connect
      await client.searchFlights({
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2026-03-01',
        passengers: 1,
      })
      
      // Then disconnect
      await client.disconnect()
      
      expect(mockClose).toHaveBeenCalled()
    })

    it('should handle disconnect when not connected', async () => {
      const client = new KiwiClient()
      
      // Should not throw
      await expect(client.disconnect()).resolves.toBeUndefined()
    })
  })
})

describe('LocusClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.LOCUS_API_KEY = 'test_locus_key'
    
    // Mock fetch for Locus
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        transaction_id: 'tx_123456',
      }),
    })
  })

  afterEach(() => {
    delete process.env.LOCUS_API_KEY
    vi.restoreAllMocks()
  })

  it('should send payment successfully', async () => {
    const { LocusClient } = await import('@/lib/agent/mcp-integration')
    const client = new LocusClient()
    
    const result = await client.sendPayment({
      amount: 100,
      currency: 'USD',
      destinationAddress: '0x123abc',
      description: 'Test payment',
    })
    
    expect(result).toBeDefined()
    expect(result.success).toBe(true)
    expect(result.transactionId).toBe('tx_123456')
  })

  it('should handle payment errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: vi.fn().mockResolvedValue('Payment failed'),
    })
    
    const { LocusClient } = await import('@/lib/agent/mcp-integration')
    const client = new LocusClient()
    
    const result = await client.sendPayment({
      amount: 100,
      currency: 'USD',
      destinationAddress: '0x123abc',
      description: 'Test payment',
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('buildSearchQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConnect.mockResolvedValue(undefined)
    mockClose.mockResolvedValue(undefined)
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: '[]' }],
    })
  })

  it('should build basic query with required params', async () => {
    // We can't directly test the private function, but we test through searchFlights
    const { KiwiClient } = await import('@/lib/agent/mcp-integration')
    
    const client = new KiwiClient()
    await client.searchFlights({
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-03-01',
      passengers: 1,
    })
    
    expect(mockCallTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'search-flight',
        arguments: expect.objectContaining({
          origin: 'JFK',
          destination: 'LHR',
          departure_date: '2026-03-01',
        }),
      })
    )
  })
})

describe('parseKiwiResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConnect.mockResolvedValue(undefined)
    mockClose.mockResolvedValue(undefined)
  })

  it('should parse JSON array response', async () => {
    const mockResponse = JSON.stringify([
      { id: 'f1', price: 500, airline: 'United' },
      { id: 'f2', price: 450, airline: 'Delta' },
    ])
    
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: mockResponse }],
    })
    
    const { KiwiClient } = await import('@/lib/agent/mcp-integration')
    const client = new KiwiClient()
    
    const result = await client.searchFlights({
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-03-01',
      passengers: 1,
    })
    
    expect(result.flights.length).toBe(2)
  })

  it('should handle flights wrapper in response', async () => {
    const mockResponse = JSON.stringify({
      flights: [
        { id: 'f1', price: 500 },
      ],
    })
    
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: mockResponse }],
    })
    
    const { KiwiClient } = await import('@/lib/agent/mcp-integration')
    const client = new KiwiClient()
    
    const result = await client.searchFlights({
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-03-01',
      passengers: 1,
    })
    
    expect(result.flights.length).toBe(1)
  })

  it('should fallback to mock data for invalid JSON', async () => {
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: 'Not valid JSON response' }],
    })
    
    const { KiwiClient } = await import('@/lib/agent/mcp-integration')
    const client = new KiwiClient()
    
    const result = await client.searchFlights({
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-03-01',
      passengers: 1,
    })
    
    // Should return mock data
    expect(result.flights.length).toBeGreaterThan(0)
    expect(result.searchId).toContain('mock_search')
  })
})

describe('transformFlightData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConnect.mockResolvedValue(undefined)
    mockClose.mockResolvedValue(undefined)
  })

  it('should transform various field formats', async () => {
    // Test with different field naming conventions
    const mockResponse = JSON.stringify([
      {
        id: 'f1',
        airline: 'United',
        flight_number: 'UA123',
        departure_airport: 'JFK',
        arrival_airport: 'LHR',
        departure_time: '2026-03-01T08:00:00',
        arrival_time: '2026-03-01T20:00:00',
        duration: 420,
        stops: 0,
        price: 500,
        currency: 'USD',
        seats_available: 10,
        booking_url: 'https://example.com/book',
      },
    ])
    
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: mockResponse }],
    })
    
    const { KiwiClient } = await import('@/lib/agent/mcp-integration')
    const client = new KiwiClient()
    
    const result = await client.searchFlights({
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-03-01',
      passengers: 1,
    })
    
    const flight = result.flights[0]
    expect(flight.id).toBe('f1')
    expect(flight.airline).toBe('United')
    expect(flight.flightNumber).toBe('UA123')
    expect(flight.departure.airport).toBe('JFK')
    expect(flight.arrival.airport).toBe('LHR')
    expect(flight.price).toBe(500)
  })
})
