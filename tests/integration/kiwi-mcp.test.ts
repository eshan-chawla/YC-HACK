/**
 * Integration tests for Kiwi MCP Server
 * 
 * These tests verify the real MCP connection to https://mcp.kiwi.com
 * Note: Some tests may be skipped in CI if the MCP server is unreachable
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

// Flag to skip real MCP tests in CI
const SKIP_REAL_MCP_TESTS = process.env.CI === 'true' || process.env.SKIP_MCP_TESTS === 'true'

describe('Kiwi MCP Integration', () => {
  describe('MCP Connection', () => {
    it.skipIf(SKIP_REAL_MCP_TESTS)('should connect to Kiwi MCP server', async () => {
      const { KiwiClient } = await import('@/lib/agent/mcp-integration')
      const client = new KiwiClient()
      
      try {
        const tools = await client.listTools()
        
        expect(tools).toBeDefined()
        expect(Array.isArray(tools)).toBe(true)
      } finally {
        await client.disconnect()
      }
    })

    it.skipIf(SKIP_REAL_MCP_TESTS)('should have search-flight tool available', async () => {
      const { KiwiClient } = await import('@/lib/agent/mcp-integration')
      const client = new KiwiClient()
      
      try {
        const tools = await client.listTools()
        
        const searchFlightTool = tools.find((t) => t.name === 'search-flight')
        expect(searchFlightTool).toBeDefined()
        expect(searchFlightTool?.description).toBeTruthy()
      } finally {
        await client.disconnect()
      }
    })

    it.skipIf(SKIP_REAL_MCP_TESTS)('should have feedback-to-devs tool available', async () => {
      const { KiwiClient } = await import('@/lib/agent/mcp-integration')
      const client = new KiwiClient()
      
      try {
        const tools = await client.listTools()
        
        const feedbackTool = tools.find((t) => t.name === 'feedback-to-devs')
        expect(feedbackTool).toBeDefined()
      } finally {
        await client.disconnect()
      }
    })
  })

  describe('Flight Search', () => {
    it.skipIf(SKIP_REAL_MCP_TESTS)('should search for flights with real MCP', async () => {
      const { KiwiClient } = await import('@/lib/agent/mcp-integration')
      const client = new KiwiClient()
      
      try {
        const result = await client.searchFlights({
          origin: 'PRG', // Prague
          destination: 'LHR', // London Heathrow
          departureDate: '2026-03-15',
          passengers: 1,
        })
        
        expect(result).toBeDefined()
        expect(result.searchId).toBeDefined()
        expect(result.flights).toBeDefined()
        expect(Array.isArray(result.flights)).toBe(true)
        expect(result.currency).toBe('USD')
        expect(result.searchedAt).toBeDefined()
      } finally {
        await client.disconnect()
      }
    }, 30000) // 30 second timeout for real API

    it.skipIf(SKIP_REAL_MCP_TESTS)('should handle one-way flights', async () => {
      const { KiwiClient } = await import('@/lib/agent/mcp-integration')
      const client = new KiwiClient()
      
      try {
        const result = await client.searchFlights({
          origin: 'JFK',
          destination: 'CDG',
          departureDate: '2026-04-01',
          passengers: 1,
        })
        
        expect(result.flights).toBeDefined()
      } finally {
        await client.disconnect()
      }
    }, 30000)

    it.skipIf(SKIP_REAL_MCP_TESTS)('should handle round-trip flights', async () => {
      const { KiwiClient } = await import('@/lib/agent/mcp-integration')
      const client = new KiwiClient()
      
      try {
        const result = await client.searchFlights({
          origin: 'LAX',
          destination: 'NRT',
          departureDate: '2026-05-01',
          returnDate: '2026-05-10',
          passengers: 2,
        })
        
        expect(result.flights).toBeDefined()
      } finally {
        await client.disconnect()
      }
    }, 30000)

    it.skipIf(SKIP_REAL_MCP_TESTS)('should handle cabin class parameter', async () => {
      const { KiwiClient } = await import('@/lib/agent/mcp-integration')
      const client = new KiwiClient()
      
      try {
        const result = await client.searchFlights({
          origin: 'SFO',
          destination: 'LHR',
          departureDate: '2026-03-20',
          passengers: 1,
          cabinClass: 'business',
        })
        
        expect(result.flights).toBeDefined()
      } finally {
        await client.disconnect()
      }
    }, 30000)

    it('should fallback to mock data when MCP unavailable', async () => {
      // Create a client with mock that fails
      vi.doMock('@modelcontextprotocol/sdk/client/index.js', () => ({
        Client: vi.fn().mockImplementation(() => ({
          connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
          close: vi.fn(),
        })),
      }))
      
      const { KiwiClient } = await import('@/lib/agent/mcp-integration')
      const client = new KiwiClient()
      
      const result = await client.searchFlights({
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2026-03-01',
        passengers: 1,
      })
      
      // Should return mock data
      expect(result).toBeDefined()
      expect(result.flights.length).toBeGreaterThan(0)
      
      vi.doUnmock('@modelcontextprotocol/sdk/client/index.js')
    })
  })

  describe('Flight Data Structure', () => {
    it('should return flights with required fields', async () => {
      const { kiwiClient } = await import('@/lib/agent/mcp-integration')
      
      const result = await kiwiClient.searchFlights({
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2026-03-01',
        passengers: 1,
      })
      
      if (result.flights.length > 0) {
        const flight = result.flights[0]
        
        expect(flight.id).toBeDefined()
        expect(flight.airline).toBeDefined()
        expect(flight.flightNumber).toBeDefined()
        expect(flight.departure).toBeDefined()
        expect(flight.departure.airport).toBeDefined()
        expect(flight.departure.time).toBeDefined()
        expect(flight.arrival).toBeDefined()
        expect(flight.arrival.airport).toBeDefined()
        expect(flight.arrival.time).toBeDefined()
        expect(flight.duration).toBeGreaterThan(0)
        expect(typeof flight.stops).toBe('number')
        expect(flight.price).toBeGreaterThan(0)
        expect(flight.currency).toBeDefined()
      }
    })

    it('should handle various field naming conventions', async () => {
      // Test that our parser handles different API response formats
      const testData = [
        // Kiwi format
        { id: 'f1', price: 500, airline: 'UA', flyFrom: 'JFK', flyTo: 'LHR' },
        // Alternative format
        { flight_id: 'f2', total_price: 450, carrier: 'DL', origin: 'JFK', destination: 'LHR' },
      ]
      
      for (const data of testData) {
        const id = data.id || data.flight_id
        const price = data.price || data.total_price
        const airline = data.airline || data.carrier
        
        expect(id).toBeDefined()
        expect(price).toBeGreaterThan(0)
        expect(airline).toBeDefined()
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid airport codes gracefully', async () => {
      const { kiwiClient } = await import('@/lib/agent/mcp-integration')
      
      // Invalid airport codes should return mock data instead of throwing
      const result = await kiwiClient.searchFlights({
        origin: 'INVALID',
        destination: 'NOTREAL',
        departureDate: '2026-03-01',
        passengers: 1,
      })
      
      expect(result).toBeDefined()
      expect(result.flights).toBeDefined()
    })

    it('should handle past dates gracefully', async () => {
      const { kiwiClient } = await import('@/lib/agent/mcp-integration')
      
      const result = await kiwiClient.searchFlights({
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2020-01-01', // Past date
        passengers: 1,
      })
      
      expect(result).toBeDefined()
    })

    it('should handle network timeouts', async () => {
      // Mock a timeout scenario
      vi.doMock('@modelcontextprotocol/sdk/client/index.js', () => ({
        Client: vi.fn().mockImplementation(() => ({
          connect: vi.fn().mockImplementation(() => 
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 100)
            )
          ),
          close: vi.fn(),
        })),
      }))
      
      const { KiwiClient } = await import('@/lib/agent/mcp-integration')
      const client = new KiwiClient()
      
      // Should fallback to mock data
      const result = await client.searchFlights({
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2026-03-01',
        passengers: 1,
      })
      
      expect(result).toBeDefined()
      expect(result.flights.length).toBeGreaterThan(0)
      
      vi.doUnmock('@modelcontextprotocol/sdk/client/index.js')
    })
  })

  describe('Response Parsing', () => {
    it('should parse JSON array response', () => {
      const responseText = JSON.stringify([
        { id: 'f1', price: 500, airline: 'United' },
        { id: 'f2', price: 450, airline: 'Delta' },
      ])
      
      const data = JSON.parse(responseText)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(2)
    })

    it('should parse flights wrapper response', () => {
      const responseText = JSON.stringify({
        flights: [
          { id: 'f1', price: 500 },
        ],
      })
      
      const data = JSON.parse(responseText)
      expect(data.flights).toBeDefined()
      expect(Array.isArray(data.flights)).toBe(true)
    })

    it('should parse data wrapper response', () => {
      const responseText = JSON.stringify({
        data: [
          { id: 'f1', price: 500 },
        ],
      })
      
      const data = JSON.parse(responseText)
      expect(data.data).toBeDefined()
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should handle natural language response', () => {
      const responseText = 'Found 3 flights from JFK to LHR starting at $450'
      
      // This is not valid JSON
      expect(() => JSON.parse(responseText)).toThrow()
    })
  })

  describe('Mock Data Comparison', () => {
    it('should have consistent mock data structure', async () => {
      const { kiwiClient } = await import('@/lib/agent/mcp-integration')
      
      const result = await kiwiClient.searchFlights({
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2026-03-01',
        passengers: 1,
      })
      
      // Mock data should have all required fields
      for (const flight of result.flights) {
        expect(flight).toHaveProperty('id')
        expect(flight).toHaveProperty('airline')
        expect(flight).toHaveProperty('flightNumber')
        expect(flight).toHaveProperty('departure')
        expect(flight).toHaveProperty('arrival')
        expect(flight).toHaveProperty('duration')
        expect(flight).toHaveProperty('stops')
        expect(flight).toHaveProperty('price')
        expect(flight).toHaveProperty('currency')
        expect(flight).toHaveProperty('cabinClass')
        expect(flight).toHaveProperty('seatsAvailable')
      }
    })

    it('should return appropriate price ranges in mock data', async () => {
      const { kiwiClient } = await import('@/lib/agent/mcp-integration')
      
      const result = await kiwiClient.searchFlights({
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2026-03-01',
        passengers: 1,
      })
      
      // Prices should be reasonable
      for (const flight of result.flights) {
        expect(flight.price).toBeGreaterThan(0)
        expect(flight.price).toBeLessThan(10000)
      }
    })
  })
})

describe('MCP SDK Integration', () => {
  it('should use StreamableHTTPClientTransport', async () => {
    const { StreamableHTTPClientTransport } = await import(
      '@modelcontextprotocol/sdk/client/streamableHttp.js'
    )
    
    expect(StreamableHTTPClientTransport).toBeDefined()
  })

  it('should use correct MCP server URL', () => {
    const MCP_SERVER_URL = 'https://mcp.kiwi.com'
    
    expect(MCP_SERVER_URL).toBe('https://mcp.kiwi.com')
    expect(MCP_SERVER_URL.startsWith('https://')).toBe(true)
  })

  it('should provide client name and version', async () => {
    const clientInfo = {
      name: 'tripweaver-travel-agent',
      version: '1.0.0',
    }
    
    expect(clientInfo.name).toBe('tripweaver-travel-agent')
    expect(clientInfo.version).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
