/**
 * Tool Executor for the Gemini Agent
 * 
 * Routes function calls to appropriate handlers:
 * - Kiwi MCP for flight search
 * - Locus MCP for payments
 * - Convex for database operations
 * - Itinerary generator for creating travel plans
 */

import { kiwiClient, locusClient } from "./mcp-integration";
import { TOOL_CATEGORIES } from "./function-definitions";
import type { ToolCall, ToolResult, FlightSearchParams, FlightSearchResult, GeneratedItinerary } from "./types";

// Database context interface (provided by Convex)
export interface DatabaseContext {
  getEvent: (eventId: string) => Promise<unknown>;
  getEmployee: (employeeId: string) => Promise<unknown>;
  getTrip: (tripId: string) => Promise<unknown>;
  listTrips: (params: { eventId?: string; employeeId?: string; status?: string }) => Promise<unknown[]>;
  updateTrip: (tripId: string, data: unknown) => Promise<void>;
  createItinerary: (data: unknown) => Promise<string>;
}

/**
 * Execute a tool call and return the result
 */
export async function executeTool(
  toolCall: ToolCall,
  dbContext?: DatabaseContext
): Promise<ToolResult> {
  const { id, name, arguments: args } = toolCall;

  try {
    let result: unknown;

    // Route to appropriate handler based on tool category
    if (TOOL_CATEGORIES.KIWI_TOOLS.includes(name as any)) {
      result = await executeKiwiTool(name, args);
    } else if (TOOL_CATEGORIES.PAYMENT_TOOLS.includes(name as any)) {
      result = await executePaymentTool(name, args);
    } else if (TOOL_CATEGORIES.DATA_TOOLS.includes(name as any)) {
      result = await executeDataTool(name, args, dbContext);
    } else if (TOOL_CATEGORIES.ITINERARY_TOOLS.includes(name as any)) {
      result = await executeItineraryTool(name, args, dbContext);
    } else if (TOOL_CATEGORIES.BUDGET_TOOLS.includes(name as any)) {
      result = await executeBudgetTool(name, args, dbContext);
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }

    return {
      id,
      name,
      result,
    };
  } catch (error) {
    return {
      id,
      name,
      result: null,
      error: error instanceof Error ? error.message : "Tool execution failed",
    };
  }
}

/**
 * Execute Kiwi.com flight tools
 */
async function executeKiwiTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "search_flights": {
      const params: FlightSearchParams = {
        origin: args.origin as string,
        destination: args.destination as string,
        departureDate: args.departureDate as string,
        returnDate: args.returnDate as string | undefined,
        passengers: args.passengers as number,
        cabinClass: args.cabinClass as FlightSearchParams["cabinClass"],
        directOnly: args.directOnly as boolean | undefined,
        maxPrice: args.maxPrice as number | undefined,
      };
      return kiwiClient.searchFlights(params);
    }

    case "get_flight_details": {
      return kiwiClient.getFlightDetails(args.flightId as string);
    }

    default:
      throw new Error(`Unknown Kiwi tool: ${name}`);
  }
}

/**
 * Execute Locus payment tools
 */
async function executePaymentTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "process_payment": {
      const amount = args.amount as number;
      const description = args.description as string;
      const tripId = args.tripId as string;

      // For demo: Use a fixed small amount and destination
      const DEMO_AMOUNT = 0.05;
      const DEMO_DESTINATION = "0x57ba59033233c750b434636e86e385294d43eeba";

      const result = await locusClient.sendPayment({
        amount: DEMO_AMOUNT, // Override for safety
        currency: "USD",
        destinationAddress: DEMO_DESTINATION,
        description: `Payment for trip ${tripId}: ${description}`,
      });

      return {
        ...result,
        requestedAmount: amount,
        actualAmount: DEMO_AMOUNT,
        note: "Demo mode: Payment amount capped at $0.05",
      };
    }

    default:
      throw new Error(`Unknown payment tool: ${name}`);
  }
}

/**
 * Execute data retrieval tools (requires database context)
 */
async function executeDataTool(
  name: string,
  args: Record<string, unknown>,
  dbContext?: DatabaseContext
): Promise<unknown> {
  if (!dbContext) {
    throw new Error("Database context required for data tools");
  }

  switch (name) {
    case "get_event_details": {
      return dbContext.getEvent(args.eventId as string);
    }

    case "get_employee_details": {
      return dbContext.getEmployee(args.employeeId as string);
    }

    case "list_pending_trips": {
      return dbContext.listTrips({
        eventId: args.eventId as string | undefined,
        employeeId: args.employeeId as string | undefined,
        status: "pending",
      });
    }

    default:
      throw new Error(`Unknown data tool: ${name}`);
  }
}

/**
 * Execute itinerary generation tools
 */
async function executeItineraryTool(
  name: string,
  args: Record<string, unknown>,
  dbContext?: DatabaseContext
): Promise<unknown> {
  switch (name) {
    case "generate_itinerary": {
      return generateSingleItinerary(
        args.eventId as string,
        args.employeeId as string,
        dbContext
      );
    }

    case "generate_team_itineraries": {
      return generateTeamItineraries(
        args.eventId as string,
        args.teamId as string | undefined,
        dbContext
      );
    }

    default:
      throw new Error(`Unknown itinerary tool: ${name}`);
  }
}

/**
 * Execute budget compliance tools
 */
async function executeBudgetTool(
  name: string,
  args: Record<string, unknown>,
  dbContext?: DatabaseContext
): Promise<unknown> {
  if (!dbContext) {
    throw new Error("Database context required for budget tools");
  }

  switch (name) {
    case "check_budget_compliance": {
      const eventId = args.eventId as string;
      const tripId = args.tripId as string | undefined;
      const itineraryId = args.itineraryId as string | undefined;

      // Get event for budget
      const event = await dbContext.getEvent(eventId) as {
        budgetPerEmployee: number;
      } | null;

      if (!event) {
        throw new Error("Event not found");
      }

      // Get trip cost
      let totalCost = 0;
      if (tripId) {
        const trip = await dbContext.getTrip(tripId) as {
          costBreakdown?: { total: number };
        } | null;
        totalCost = trip?.costBreakdown?.total ?? 0;
      }

      const budget = event.budgetPerEmployee;
      const withinBudget = totalCost <= budget;
      const overage = withinBudget ? 0 : totalCost - budget;

      return {
        eventId,
        tripId,
        budget,
        totalCost,
        withinBudget,
        overage,
        percentUsed: budget > 0 ? Math.round((totalCost / budget) * 100) : 0,
      };
    }

    default:
      throw new Error(`Unknown budget tool: ${name}`);
  }
}

/**
 * Generate itinerary for a single employee
 */
async function generateSingleItinerary(
  eventId: string,
  employeeId: string,
  dbContext?: DatabaseContext
): Promise<GeneratedItinerary> {
  // Get event and employee details
  const event = dbContext ? await dbContext.getEvent(eventId) : null;
  const employee = dbContext ? await dbContext.getEmployee(employeeId) : null;

  // Default values for demo
  const eventData = event as {
    destination?: string;
    departureDate?: number;
    returnDate?: number;
    budgetPerEmployee?: number;
    requirements?: Record<string, unknown>;
  } | null;

  const employeeData = employee as {
    restrictions?: Record<string, unknown>;
    location?: string;
  } | null;

  const destination = eventData?.destination ?? "LHR";
  const origin = employeeData?.location ?? "JFK";
  const departureDate = eventData?.departureDate 
    ? new Date(eventData.departureDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const returnDate = eventData?.returnDate
    ? new Date(eventData.returnDate).toISOString().split("T")[0]
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const budget = eventData?.budgetPerEmployee ?? 1500;

  // Search for flights
  const flightResults = await kiwiClient.searchFlights({
    origin,
    destination,
    departureDate,
    returnDate,
    passengers: 1,
    cabinClass: "economy",
    maxPrice: budget * 0.6, // Allocate 60% of budget to flights
  });

  // Select best outbound and return flights
  const outboundFlight = flightResults.flights[0];
  const returnFlight = flightResults.flights.length > 1 
    ? flightResults.flights[1] 
    : flightResults.flights[0];

  // Calculate total cost
  const flightCost = (outboundFlight?.price ?? 0) + (returnFlight?.price ?? 0);
  const hotelCost = 150 * 2; // Mock: $150/night for 2 nights
  const transportCost = 50; // Mock: Ground transport
  const totalCost = flightCost + hotelCost + transportCost;

  return {
    tripId: `trip_${eventId}_${employeeId}`,
    eventId,
    employeeId,
    outboundFlight,
    returnFlight,
    hotel: {
      name: "Business Hotel",
      address: `123 Main St, ${destination}`,
      checkIn: departureDate,
      checkOut: returnDate,
      room: "Standard Double",
      pricePerNight: 150,
      totalPrice: hotelCost,
    },
    groundTransport: {
      type: "Airport Transfer",
      from: `${destination} Airport`,
      to: "Hotel",
      price: transportCost,
    },
    totalCost,
    withinBudget: totalCost <= budget,
    policyCompliant: true,
    notes: `Generated itinerary for ${destination}. Flight from ${origin}.`,
  };
}

/**
 * Generate itineraries for all team members
 */
async function generateTeamItineraries(
  eventId: string,
  teamId?: string,
  dbContext?: DatabaseContext
): Promise<{ generated: number; itineraries: GeneratedItinerary[] }> {
  if (!dbContext) {
    // Return mock data for demo
    return {
      generated: 1,
      itineraries: [await generateSingleItinerary(eventId, "mock_employee", undefined)],
    };
  }

  // Get trips for the event
  const trips = await dbContext.listTrips({ eventId, status: "pending" }) as Array<{
    employeeId: string;
  }>;

  // Generate itinerary for each employee
  const itineraries: GeneratedItinerary[] = [];
  
  for (const trip of trips) {
    try {
      const itinerary = await generateSingleItinerary(
        eventId,
        trip.employeeId,
        dbContext
      );
      itineraries.push(itinerary);
    } catch (error) {
      console.error(`Failed to generate itinerary for employee ${trip.employeeId}:`, error);
    }
  }

  return {
    generated: itineraries.length,
    itineraries,
  };
}

/**
 * Execute multiple tool calls in parallel
 */
export async function executeTools(
  toolCalls: ToolCall[],
  dbContext?: DatabaseContext
): Promise<ToolResult[]> {
  const results = await Promise.all(
    toolCalls.map((call) => executeTool(call, dbContext))
  );
  return results;
}
