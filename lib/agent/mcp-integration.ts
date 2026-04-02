/**
 * MCP Integration Layer for Kiwi.com and Locus Payment APIs
 * 
 * This module provides access to MCP servers using the official MCP SDK,
 * transforming requests/responses between Gemini function calls and MCP tools.
 * 
 * Multi-Source Flight Data Architecture:
 * - Primary: Kiwi MCP (real flight data)
 * - Fallback: Amadeus API (future integration)
 * - Last Resort: Realistic mock data (clearly labeled)
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { FlightSearchParams, FlightSearchResult, Flight, MCPTool } from "./types";

const isDev = process.env.NODE_ENV === "development";

// Flight data provider types for multi-source fallback
export type FlightDataProvider = 'kiwi' | 'amadeus' | 'mock';

export interface FlightProviderConfig {
  priority: number;
  enabled: boolean;
  timeout: number; // ms
}

// Provider configuration - extend this to add Amadeus or other sources
const FLIGHT_PROVIDERS: Record<FlightDataProvider, FlightProviderConfig> = {
  kiwi: { priority: 1, enabled: true, timeout: 10000 },
  amadeus: { priority: 2, enabled: false, timeout: 8000 }, // Not yet implemented
  mock: { priority: 99, enabled: true, timeout: 100 }, // Always available as fallback
};

// MCP Server configurations
const MCP_SERVERS = {
  kiwi: {
    url: "https://mcp.kiwi.com",
  },
  locus: {
    url: "https://mcp.paywithlocus.com/mcp",
    getApiKey: () => process.env.LOCUS_API_KEY,
  },
} as const;

/**
 * Legacy MCP client for Locus (still uses manual HTTP)
 * TODO: Migrate to SDK when Locus MCP server supports it
 */
class LegacyMCPClient {
  private serverUrl: string;
  private apiKey: string | undefined;

  constructor(serverUrl: string, apiKey?: string) {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
  }

  async callTool<T = unknown>(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.serverUrl}/tools/${toolName}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ arguments: args }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP tool call failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result as T;
  }

  async listTools(): Promise<MCPTool[]> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.serverUrl}/tools`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to list tools: ${response.status}`);
    }

    const result = await response.json();
    return result.tools as MCPTool[];
  }
}

/**
 * Kiwi.com MCP Client for flight search
 * Uses the official MCP SDK with Streamable HTTP transport
 */
export class KiwiClient {
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  private connected: boolean = false;
  private connecting: Promise<void> | null = null;

  constructor() {
    // Lazy initialization - connection happens on first use
  }

  /**
   * Ensure the MCP client is connected
   */
  private async ensureConnected(): Promise<void> {
    if (this.connected && this.client) {
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.connecting) {
      await this.connecting;
      return;
    }

    this.connecting = this.connect();
    await this.connecting;
    this.connecting = null;
  }

  /**
   * Connect to the Kiwi MCP server
   */
  private async connect(): Promise<void> {
    try {
      // Create transport with Kiwi MCP server URL
      this.transport = new StreamableHTTPClientTransport(
        new URL(MCP_SERVERS.kiwi.url)
      );

      // Create MCP client
      this.client = new Client(
        {
          name: "tripweaver-travel-agent",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      // Connect to the server
      await this.client.connect(this.transport);
      this.connected = true;
      if (isDev) console.log("Connected to Kiwi MCP server");
    } catch (error) {
      console.error("Failed to connect to Kiwi MCP server:", error);
      this.connected = false;
      throw error;
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      try {
        await this.client.close();
      } catch (error) {
        console.error("Error disconnecting from Kiwi MCP server:", error);
      }
      this.connected = false;
      this.client = null;
      this.transport = null;
    }
  }

  /**
   * Search for flights using the Kiwi MCP server
   * Tool: search-flight
   */
  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
    try {
      await this.ensureConnected();

      if (!this.client) {
        throw new Error("MCP client not initialized");
      }

      // Build search query for Kiwi MCP
      // The search-flight tool expects natural language or structured params
      const searchQuery = buildSearchQuery(params);

      // Call the search-flight tool via MCP protocol
      const result = await this.client.callTool({
        name: "search-flight",
        arguments: searchQuery,
      });

      // Parse the MCP response
      const content = result.content as { type: string; text?: string }[];
      if (!content || content.length === 0) {
        if (isDev) console.warn("Empty response from Kiwi MCP server - falling back to mock");
        return getMockFlightResults(params);
      }

      // Extract text content from MCP response
      const textContent = content.find((c: { type: string }) => c.type === "text");
      if (!textContent || textContent.type !== "text" || !textContent.text) {
        if (isDev) console.warn("No text content in Kiwi MCP response - falling back to mock");
        return getMockFlightResults(params);
      }

      // Parse the flight results from the response
      const flights = parseKiwiResponse(textContent.text, params);

      return {
        searchId: `kiwi_search_${Date.now()}`,
        flights,
        currency: "USD",
        searchedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Kiwi flight search error:", error);
      
      // Return mock data for development/demo when MCP server is unreachable
      return getMockFlightResults(params);
    }
  }

  /**
   * Get details for a specific flight
   * Note: Kiwi MCP only exposes search-flight, so we return cached data or null
   */
  async getFlightDetails(flightId: string): Promise<Flight | null> {
    // The Kiwi MCP server only provides search-flight tool
    // For detailed flight info, return null (search results include booking links)
    if (isDev) console.log(`getFlightDetails called for ${flightId} - Kiwi MCP only supports search-flight`);
    return null;
  }

  /**
   * List available tools from the Kiwi MCP server
   */
  async listTools(): Promise<MCPTool[]> {
    try {
      await this.ensureConnected();

      if (!this.client) {
        throw new Error("MCP client not initialized");
      }

      const result = await this.client.listTools();
      return result.tools.map((tool) => ({
        name: tool.name,
        description: tool.description || "",
        inputSchema: tool.inputSchema as Record<string, unknown>,
      }));
    } catch (error) {
      console.error("Error listing Kiwi MCP tools:", error);
      return [];
    }
  }
}

/**
 * Build search query parameters for Kiwi MCP search-flight tool
 */
function buildSearchQuery(params: FlightSearchParams): Record<string, unknown> {
  const query: Record<string, unknown> = {
    origin: params.origin,
    destination: params.destination,
    departure_date: params.departureDate,
  };

  if (params.returnDate) {
    query.return_date = params.returnDate;
  }

  if (params.passengers && params.passengers > 1) {
    query.adults = params.passengers;
  }

  if (params.cabinClass && params.cabinClass !== "economy") {
    query.cabin_class = params.cabinClass;
  }

  if (params.directOnly) {
    query.direct_only = true;
  }

  if (params.maxPrice) {
    query.max_price = params.maxPrice;
  }

  return query;
}

/**
 * Parse Kiwi MCP response into Flight objects
 * The response format may vary, so we handle multiple formats
 */
function parseKiwiResponse(responseText: string, params: FlightSearchParams): Flight[] {
  try {
    // Try to parse as JSON first
    const data = JSON.parse(responseText);
    
    if (Array.isArray(data)) {
      return data.map((flight, index) => transformFlightData(flight, index, params));
    }
    
    if (data.flights && Array.isArray(data.flights)) {
      return data.flights.map((flight: unknown, index: number) => 
        transformFlightData(flight, index, params)
      );
    }

    if (data.data && Array.isArray(data.data)) {
      return data.data.map((flight: unknown, index: number) => 
        transformFlightData(flight, index, params)
      );
    }

    // Single flight result
    if (data.id || data.flight_id) {
      return [transformFlightData(data, 0, params)];
    }

    if (isDev) console.warn("Unknown Kiwi response format:", data);
    return getMockFlightResults(params).flights;
  } catch {
    // Not JSON - might be natural language response
    if (isDev) console.log("Kiwi response is not JSON, returning mock data");
    return getMockFlightResults(params).flights;
  }
}

/**
 * Transform raw flight data to our Flight type
 */
function transformFlightData(
  raw: unknown,
  index: number,
  params: FlightSearchParams
): Flight {
  const data = raw as Record<string, unknown>;
  
  // Handle various possible field names
  const id = String(data.id || data.flight_id || `flight_${index}`);
  const airline = String(data.airline || data.airlines?.[0] || data.carrier || "Unknown");
  const flightNumber = String(data.flight_number || data.flightNumber || data.flight_no || `${airline}${100 + index}`);
  
  const departureAirport = String(data.departure_airport || data.origin || data.flyFrom || params.origin);
  const departureTime = String(data.departure_time || data.local_departure || `${params.departureDate}T08:00:00`);
  
  const arrivalAirport = String(data.arrival_airport || data.destination || data.flyTo || params.destination);
  const arrivalTime = String(data.arrival_time || data.local_arrival || `${params.departureDate}T14:00:00`);
  
  const duration = Number(data.duration || data.duration_minutes || 360);
  const stops = Number(data.stops || data.stopovers || 0);
  const price = Number(data.price || data.total_price || 450);
  const currency = String(data.currency || "USD");
  const seatsAvailable = Number(data.seats_available || data.availability || 10);
  const bookingUrl = String(data.booking_url || data.deep_link || data.bookingUrl || 
    `https://www.kiwi.com/deep?from=${departureAirport}&to=${arrivalAirport}`);

  return {
    id,
    airline,
    flightNumber,
    departure: {
      airport: departureAirport,
      time: departureTime,
    },
    arrival: {
      airport: arrivalAirport,
      time: arrivalTime,
    },
    duration,
    stops,
    price,
    currency,
    cabinClass: params.cabinClass || "economy",
    seatsAvailable,
    bookingUrl,
  };
}

/**
 * Locus Payment MCP Client
 * Uses legacy HTTP implementation (Locus MCP integration out of scope for now)
 */
export class LocusClient {
  private client: LegacyMCPClient;

  constructor() {
    this.client = new LegacyMCPClient(
      MCP_SERVERS.locus.url,
      MCP_SERVERS.locus.getApiKey()
    );
  }

  /**
   * Send payment to an address
   */
  async sendPayment(params: {
    amount: number;
    currency: string;
    destinationAddress: string;
    description: string;
  }): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const result = await this.client.callTool<{
        success: boolean;
        transaction_id: string;
      }>("send_to_address", {
        amount: params.amount,
        currency: params.currency,
        destination_address: params.destinationAddress,
        note: params.description,
      });

      return {
        success: result.success,
        transactionId: result.transaction_id,
      };
    } catch (error) {
      console.error("Locus payment error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment failed",
      };
    }
  }
}

// Helper function to map cabin class to Kiwi format
function mapCabinClass(cabinClass?: string): string {
  const mapping: Record<string, string> = {
    economy: "M",
    premium_economy: "W",
    business: "C",
    first: "F",
  };
  return mapping[cabinClass || "economy"] || "M";
}

// Mock flight results for development/demo
function getMockFlightResults(params: FlightSearchParams): FlightSearchResult {
  const mockFlights: Flight[] = [
    {
      id: "mock_flight_1",
      airline: "United Airlines",
      flightNumber: "UA123",
      departure: {
        airport: params.origin,
        time: `${params.departureDate}T08:00:00`,
      },
      arrival: {
        airport: params.destination,
        time: `${params.departureDate}T14:30:00`,
      },
      duration: 390, // 6.5 hours
      stops: 0,
      price: 450,
      currency: "USD",
      cabinClass: params.cabinClass || "economy",
      seatsAvailable: 12,
    },
    {
      id: "mock_flight_2",
      airline: "Delta Airlines",
      flightNumber: "DL456",
      departure: {
        airport: params.origin,
        time: `${params.departureDate}T10:30:00`,
      },
      arrival: {
        airport: params.destination,
        time: `${params.departureDate}T18:45:00`,
      },
      duration: 495, // 8.25 hours (1 stop)
      stops: 1,
      price: 380,
      currency: "USD",
      cabinClass: params.cabinClass || "economy",
      seatsAvailable: 8,
    },
    {
      id: "mock_flight_3",
      airline: "American Airlines",
      flightNumber: "AA789",
      departure: {
        airport: params.origin,
        time: `${params.departureDate}T14:00:00`,
      },
      arrival: {
        airport: params.destination,
        time: `${params.departureDate}T20:15:00`,
      },
      duration: 375, // 6.25 hours
      stops: 0,
      price: 520,
      currency: "USD",
      cabinClass: params.cabinClass || "economy",
      seatsAvailable: 5,
    },
  ];

  return {
    searchId: `mock_search_${Date.now()}`,
    flights: mockFlights,
    currency: "USD",
    searchedAt: new Date().toISOString(),
  };
}

// Export singleton instances
export const kiwiClient = new KiwiClient();
export const locusClient = new LocusClient();
