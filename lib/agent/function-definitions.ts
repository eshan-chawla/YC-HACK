/**
 * Gemini function declarations for the travel assistant agent
 * 
 * These define the tools available to the agent for:
 * - Flight search via Kiwi.com
 * - Itinerary generation
 * - Budget compliance checking
 * - Payment processing via Locus
 */

import type { GeminiFunctionDeclaration } from "./types";

// Flight search function
export const searchFlightsFunction: GeminiFunctionDeclaration = {
  name: "search_flights",
  description: "Search for available flights between two airports using the official Kiwi.com MCP server. Returns real-time flight options with prices, times, availability, and booking links.",
  parameters: {
    type: "object",
    properties: {
      origin: {
        type: "string",
        description: "Origin airport code (e.g., 'JFK', 'LAX', 'SFO')",
      },
      destination: {
        type: "string",
        description: "Destination airport code (e.g., 'LHR', 'CDG', 'NRT')",
      },
      departureDate: {
        type: "string",
        description: "Departure date in YYYY-MM-DD format",
      },
      returnDate: {
        type: "string",
        description: "Return date in YYYY-MM-DD format (optional for one-way)",
      },
      passengers: {
        type: "number",
        description: "Number of passengers",
      },
      cabinClass: {
        type: "string",
        description: "Cabin class preference",
        enum: ["economy", "premium_economy", "business", "first"],
      },
      directOnly: {
        type: "boolean",
        description: "Only show direct flights (no stops)",
      },
      maxPrice: {
        type: "number",
        description: "Maximum price per person in USD",
      },
    },
    required: ["origin", "destination", "departureDate", "passengers"],
  },
};

// Get flight details function
export const getFlightDetailsFunction: GeminiFunctionDeclaration = {
  name: "get_flight_details",
  description: "Get detailed information about a specific flight, including real-time availability and booking options.",
  parameters: {
    type: "object",
    properties: {
      flightId: {
        type: "string",
        description: "The unique flight ID from search results",
      },
    },
    required: ["flightId"],
  },
};

// Generate itinerary function
export const generateItineraryFunction: GeminiFunctionDeclaration = {
  name: "generate_itinerary",
  description: "Generate a complete travel itinerary for an employee based on event requirements and personal preferences. Includes flights, hotel, and ground transport.",
  parameters: {
    type: "object",
    properties: {
      eventId: {
        type: "string",
        description: "The event ID to generate itinerary for",
      },
      employeeId: {
        type: "string",
        description: "The employee ID to generate itinerary for",
      },
    },
    required: ["eventId", "employeeId"],
  },
};

// Generate team itineraries function
export const generateTeamItinerariesFunction: GeminiFunctionDeclaration = {
  name: "generate_team_itineraries",
  description: "Generate personalized itineraries for all employees in a team participating in a specific event. Each employee gets an itinerary tailored to their restrictions and preferences.",
  parameters: {
    type: "object",
    properties: {
      eventId: {
        type: "string",
        description: "The event ID",
      },
      teamId: {
        type: "string",
        description: "The team name to generate itineraries for (optional, generates for all event participants if not specified)",
      },
    },
    required: ["eventId"],
  },
};

// Check budget compliance function
export const checkBudgetComplianceFunction: GeminiFunctionDeclaration = {
  name: "check_budget_compliance",
  description: "Verify if an itinerary or trip cost fits within the admin-defined budget for the event.",
  parameters: {
    type: "object",
    properties: {
      itineraryId: {
        type: "string",
        description: "The itinerary ID to check (optional if tripId provided)",
      },
      tripId: {
        type: "string",
        description: "The trip ID to check (optional if itineraryId provided)",
      },
      eventId: {
        type: "string",
        description: "The event ID for budget reference",
      },
    },
    required: ["eventId"],
  },
};

// Process payment function
export const processPaymentFunction: GeminiFunctionDeclaration = {
  name: "process_payment",
  description: "Process a payment for a booking using Locus payment system. Use this when the user confirms they want to book and pay.",
  parameters: {
    type: "object",
    properties: {
      amount: {
        type: "number",
        description: "Payment amount in USD",
      },
      description: {
        type: "string",
        description: "Description of what the payment is for",
      },
      tripId: {
        type: "string",
        description: "The trip ID this payment is for",
      },
    },
    required: ["amount", "description", "tripId"],
  },
};

// Get event details function
export const getEventDetailsFunction: GeminiFunctionDeclaration = {
  name: "get_event_details",
  description: "Get details about a travel event including destination, dates, budget, and participants.",
  parameters: {
    type: "object",
    properties: {
      eventId: {
        type: "string",
        description: "The event ID to get details for",
      },
    },
    required: ["eventId"],
  },
};

// Get employee details function
export const getEmployeeDetailsFunction: GeminiFunctionDeclaration = {
  name: "get_employee_details",
  description: "Get details about an employee including their preferences, restrictions, and past trips.",
  parameters: {
    type: "object",
    properties: {
      employeeId: {
        type: "string",
        description: "The employee ID to get details for",
      },
    },
    required: ["employeeId"],
  },
};

// List pending trips function
export const listPendingTripsFunction: GeminiFunctionDeclaration = {
  name: "list_pending_trips",
  description: "List all trips that are pending itinerary generation or booking for a specific event or employee.",
  parameters: {
    type: "object",
    properties: {
      eventId: {
        type: "string",
        description: "Filter by event ID (optional)",
      },
      employeeId: {
        type: "string",
        description: "Filter by employee ID (optional)",
      },
    },
    required: [],
  },
};

// All function declarations for Gemini
export const allFunctionDeclarations: GeminiFunctionDeclaration[] = [
  searchFlightsFunction,
  getFlightDetailsFunction,
  generateItineraryFunction,
  generateTeamItinerariesFunction,
  checkBudgetComplianceFunction,
  processPaymentFunction,
  getEventDetailsFunction,
  getEmployeeDetailsFunction,
  listPendingTripsFunction,
];

// Function names grouped by category for tool routing
export const TOOL_CATEGORIES = {
  KIWI_TOOLS: ["search_flights", "get_flight_details"],
  ITINERARY_TOOLS: ["generate_itinerary", "generate_team_itineraries"],
  BUDGET_TOOLS: ["check_budget_compliance"],
  PAYMENT_TOOLS: ["process_payment"],
  DATA_TOOLS: ["get_event_details", "get_employee_details", "list_pending_trips"],
} as const;
