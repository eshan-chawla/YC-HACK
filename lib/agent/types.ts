/**
 * Agent types for the Gemini-powered travel assistant
 */

// Tool call types
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  id: string;
  name: string;
  result: unknown;
  error?: string;
}

// Flight search types
export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  passengers: number;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
  directOnly?: boolean;
  maxPrice?: number;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    time: string;
    terminal?: string;
  };
  arrival: {
    airport: string;
    time: string;
    terminal?: string;
  };
  duration: number; // minutes
  stops: number;
  price: number;
  currency: string;
  cabinClass: string;
  seatsAvailable?: number;
  bookingUrl?: string;
}

export interface FlightSearchResult {
  searchId: string;
  flights: Flight[];
  currency: string;
  searchedAt: string;
}

// Itinerary types
export interface ItineraryRequest {
  eventId: string;
  employeeId: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  budgetPerPerson: number;
  requirements?: {
    preferredAirlines?: string[];
    cabinClass?: string;
    directFlightsOnly?: boolean;
  };
  employeeRestrictions?: {
    dietary?: string[];
    mobility?: string;
    seating?: string;
  };
}

export interface GeneratedItinerary {
  tripId: string;
  eventId: string;
  employeeId: string;
  outboundFlight?: Flight;
  returnFlight?: Flight;
  hotel?: {
    name: string;
    address: string;
    checkIn: string;
    checkOut: string;
    room: string;
    pricePerNight: number;
    totalPrice: number;
  };
  groundTransport?: {
    type: string;
    from: string;
    to: string;
    price: number;
  };
  totalCost: number;
  withinBudget: boolean;
  policyCompliant: boolean;
  notes: string;
}

// Agent response types
export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: number;
}

export interface AgentResponse {
  content: string;
  toolCalls?: ToolCall[];
  paymentTriggered?: boolean;
  paymentAmount?: number;
  itineraryGenerated?: GeneratedItinerary;
}

// Chat history for context
export interface ChatHistory {
  messages: AgentMessage[];
  conversationId?: string;
}

// MCP tool definition (simplified from full MCP spec)
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      default?: unknown;
    }>;
    required?: string[];
  };
}

// Gemini function declaration format
export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}
