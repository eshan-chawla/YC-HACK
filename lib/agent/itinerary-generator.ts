/**
 * Itinerary Generator
 * 
 * AI-powered itinerary generation for corporate travel.
 * Uses Kiwi.com for flight search and generates personalized
 * travel plans based on admin requirements and employee preferences.
 */

import { kiwiClient } from "./mcp-integration";
import type {
  Flight,
  FlightSearchParams,
  GeneratedItinerary,
  ItineraryRequest,
} from "./types";
import { createHash } from "crypto";

// Hotel providers (mock - would integrate with real hotel API)
const MOCK_HOTELS = [
  { name: "Marriott", priceRange: [150, 300], rating: 4.5 },
  { name: "Hilton", priceRange: [140, 280], rating: 4.3 },
  { name: "Hyatt", priceRange: [160, 320], rating: 4.6 },
  { name: "Holiday Inn", priceRange: [100, 180], rating: 4.0 },
  { name: "Best Western", priceRange: [80, 150], rating: 3.8 },
];

/**
 * Calculate cache key for itinerary
 * Used to detect when regeneration is needed
 */
export function calculateCacheKey(params: {
  eventId: string;
  employeeId: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  budgetPerPerson: number;
  requirements?: Record<string, unknown>;
  employeeRestrictions?: Record<string, unknown>;
}): string {
  // Sort keys for deterministic ordering
  const sortedParams = JSON.stringify(params, Object.keys(params).sort());
  
  // Create SHA-256 hash
  const hash = createHash("sha256").update(sortedParams).digest("hex");
  
  return `cache_${hash.slice(0, 16)}`;
}

/**
 * Check if an itinerary is within budget
 */
export function checkBudgetCompliance(
  itinerary: GeneratedItinerary,
  budget: number
): {
  withinBudget: boolean;
  totalCost: number;
  budget: number;
  overage: number;
  percentUsed: number;
  breakdown: {
    flights: number;
    hotel: number;
    groundTransport: number;
    buffer: number;
  };
} {
  const flightCost = (itinerary.outboundFlight?.price ?? 0) + (itinerary.returnFlight?.price ?? 0);
  const hotelCost = itinerary.hotel?.totalPrice ?? 0;
  const transportCost = itinerary.groundTransport?.price ?? 0;
  const totalCost = itinerary.totalCost;
  
  const withinBudget = totalCost <= budget;
  const overage = withinBudget ? 0 : totalCost - budget;
  const percentUsed = budget > 0 ? Math.round((totalCost / budget) * 100) : 0;
  
  return {
    withinBudget,
    totalCost,
    budget,
    overage,
    percentUsed,
    breakdown: {
      flights: flightCost,
      hotel: hotelCost,
      groundTransport: transportCost,
      buffer: budget - totalCost,
    },
  };
}

/**
 * Generate a single itinerary for an employee
 */
export async function generateItinerary(
  request: ItineraryRequest
): Promise<GeneratedItinerary> {
  const {
    eventId,
    employeeId,
    destination,
    departureDate,
    returnDate,
    budgetPerPerson,
    requirements,
    employeeRestrictions,
  } = request;

  // Calculate budget allocation
  const flightBudget = budgetPerPerson * 0.5; // 50% for flights
  const hotelBudget = budgetPerPerson * 0.35; // 35% for hotel
  const transportBudget = budgetPerPerson * 0.1; // 10% for ground transport
  const bufferBudget = budgetPerPerson * 0.05; // 5% buffer

  // Determine origin (default to JFK if not specified)
  const origin = "JFK"; // Would get from employee's location in real implementation

  // Search for outbound flights
  const outboundSearchParams: FlightSearchParams = {
    origin,
    destination,
    departureDate,
    passengers: 1,
    cabinClass: (requirements?.cabinClass as FlightSearchParams["cabinClass"]) ?? "economy",
    directOnly: requirements?.directFlightsOnly as boolean ?? false,
    maxPrice: flightBudget / 2,
  };

  // Search for return flights
  const returnSearchParams: FlightSearchParams = {
    origin: destination,
    destination: origin,
    departureDate: returnDate,
    passengers: 1,
    cabinClass: (requirements?.cabinClass as FlightSearchParams["cabinClass"]) ?? "economy",
    directOnly: requirements?.directFlightsOnly as boolean ?? false,
    maxPrice: flightBudget / 2,
  };

  // Execute flight searches in parallel
  const [outboundResults, returnResults] = await Promise.all([
    kiwiClient.searchFlights(outboundSearchParams),
    kiwiClient.searchFlights(returnSearchParams),
  ]);

  // Select best flights based on price and requirements
  const outboundFlight = selectBestFlight(
    outboundResults.flights,
    requirements?.preferredAirlines as string[] | undefined,
    employeeRestrictions?.seating as string | undefined
  );

  const returnFlight = selectBestFlight(
    returnResults.flights,
    requirements?.preferredAirlines as string[] | undefined,
    employeeRestrictions?.seating as string | undefined
  );

  // Calculate number of nights
  const departureDateTime = new Date(departureDate);
  const returnDateTime = new Date(returnDate);
  const nights = Math.ceil(
    (returnDateTime.getTime() - departureDateTime.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Select hotel
  const hotel = selectHotel(
    destination,
    nights,
    hotelBudget,
    requirements?.preferredHotels as string[] | undefined,
    employeeRestrictions?.hotelPreferences as string[] | undefined
  );

  // Calculate ground transport
  const groundTransport = {
    type: "Airport Transfer",
    from: `${destination} Airport`,
    to: hotel.name,
    price: Math.min(50, transportBudget),
  };

  // Calculate total cost
  const flightCost = (outboundFlight?.price ?? 0) + (returnFlight?.price ?? 0);
  const totalCost = flightCost + hotel.totalPrice + groundTransport.price;

  // Generate notes
  const notes = generateItineraryNotes(
    employeeRestrictions,
    outboundFlight,
    returnFlight,
    hotel
  );

  const itinerary: GeneratedItinerary = {
    tripId: `trip_${eventId}_${employeeId}_${Date.now()}`,
    eventId,
    employeeId,
    outboundFlight,
    returnFlight,
    hotel: {
      name: hotel.name,
      address: hotel.address,
      checkIn: departureDate,
      checkOut: returnDate,
      room: hotel.room,
      pricePerNight: hotel.pricePerNight,
      totalPrice: hotel.totalPrice,
    },
    groundTransport,
    totalCost,
    withinBudget: totalCost <= budgetPerPerson,
    policyCompliant: checkPolicyCompliance(
      outboundFlight,
      returnFlight,
      hotel,
      requirements
    ),
    notes,
  };

  return itinerary;
}

/**
 * Generate itineraries for all team members
 */
export async function generateTeamItineraries(
  eventId: string,
  employees: Array<{
    id: string;
    location?: string;
    restrictions?: Record<string, unknown>;
  }>,
  eventDetails: {
    destination: string;
    departureDate: string;
    returnDate: string;
    budgetPerEmployee: number;
    requirements?: Record<string, unknown>;
  }
): Promise<{
  success: boolean;
  generated: number;
  failed: number;
  itineraries: GeneratedItinerary[];
  errors: Array<{ employeeId: string; error: string }>;
}> {
  const itineraries: GeneratedItinerary[] = [];
  const errors: Array<{ employeeId: string; error: string }> = [];

  // Generate itineraries in parallel with concurrency limit
  const CONCURRENCY_LIMIT = 3;
  const chunks = chunkArray(employees, CONCURRENCY_LIMIT);

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map((employee) =>
        generateItinerary({
          eventId,
          employeeId: employee.id,
          destination: eventDetails.destination,
          departureDate: eventDetails.departureDate,
          returnDate: eventDetails.returnDate,
          budgetPerPerson: eventDetails.budgetPerEmployee,
          requirements: eventDetails.requirements,
          employeeRestrictions: employee.restrictions,
        })
      )
    );

    results.forEach((result, index) => {
      const employee = chunk[index];
      if (result.status === "fulfilled") {
        itineraries.push(result.value);
      } else {
        errors.push({
          employeeId: employee.id,
          error: result.reason?.message || "Failed to generate itinerary",
        });
      }
    });
  }

  return {
    success: errors.length === 0,
    generated: itineraries.length,
    failed: errors.length,
    itineraries,
    errors,
  };
}

/**
 * Select the best flight based on criteria
 */
function selectBestFlight(
  flights: Flight[],
  preferredAirlines?: string[],
  seatPreference?: string
): Flight | undefined {
  if (flights.length === 0) return undefined;

  // Score each flight
  const scoredFlights = flights.map((flight) => {
    let score = 0;

    // Prefer lower prices
    const maxPrice = Math.max(...flights.map((f) => f.price));
    const priceScore = ((maxPrice - flight.price) / maxPrice) * 40;
    score += priceScore;

    // Prefer direct flights
    if (flight.stops === 0) score += 30;
    else if (flight.stops === 1) score += 15;

    // Prefer preferred airlines
    if (preferredAirlines?.includes(flight.airline)) score += 20;

    // Prefer shorter duration
    const maxDuration = Math.max(...flights.map((f) => f.duration));
    const durationScore = ((maxDuration - flight.duration) / maxDuration) * 10;
    score += durationScore;

    return { flight, score };
  });

  // Sort by score and return best
  scoredFlights.sort((a, b) => b.score - a.score);
  return scoredFlights[0].flight;
}

/**
 * Select a hotel based on budget and preferences
 */
function selectHotel(
  destination: string,
  nights: number,
  budget: number,
  preferredHotels?: string[],
  hotelPreferences?: string[]
): {
  name: string;
  address: string;
  room: string;
  pricePerNight: number;
  totalPrice: number;
} {
  const maxPerNight = budget / nights;

  // Filter hotels by price
  let eligibleHotels = MOCK_HOTELS.filter(
    (h) => h.priceRange[0] <= maxPerNight
  );

  // Prefer specified hotels
  if (preferredHotels && preferredHotels.length > 0) {
    const preferred = eligibleHotels.filter((h) =>
      preferredHotels.includes(h.name)
    );
    if (preferred.length > 0) {
      eligibleHotels = preferred;
    }
  }

  // Select based on rating
  eligibleHotels.sort((a, b) => b.rating - a.rating);
  const selectedHotel = eligibleHotels[0] || MOCK_HOTELS[0];

  // Determine price within range
  const pricePerNight = Math.min(
    selectedHotel.priceRange[1],
    Math.max(selectedHotel.priceRange[0], maxPerNight * 0.8)
  );

  // Determine room type based on preferences
  let room = "Standard Room";
  if (hotelPreferences?.includes("non-smoking")) {
    room = "Non-Smoking Standard Room";
  }
  if (hotelPreferences?.includes("ground floor")) {
    room = "Ground Floor " + room;
  }

  return {
    name: selectedHotel.name,
    address: `123 Business District, ${destination}`,
    room,
    pricePerNight: Math.round(pricePerNight),
    totalPrice: Math.round(pricePerNight * nights),
  };
}

/**
 * Check if itinerary complies with company policy
 */
function checkPolicyCompliance(
  outboundFlight: Flight | undefined,
  returnFlight: Flight | undefined,
  hotel: { pricePerNight: number },
  requirements?: Record<string, unknown>
): boolean {
  // Check cabin class
  const requiredCabin = requirements?.cabinClass as string | undefined;
  if (requiredCabin) {
    if (outboundFlight?.cabinClass !== requiredCabin) return false;
    if (returnFlight?.cabinClass !== requiredCabin) return false;
  }

  // Check direct flights requirement
  if (requirements?.directFlightsOnly) {
    if (outboundFlight && outboundFlight.stops > 0) return false;
    if (returnFlight && returnFlight.stops > 0) return false;
  }

  // Check preferred airlines (soft requirement - no log in production)
  const preferredAirlines = requirements?.preferredAirlines as string[] | undefined;
  if (preferredAirlines?.length && outboundFlight && !preferredAirlines.includes(outboundFlight.airline)) {
    // Soft requirement - no-op in production; devs can add logging if needed
  }

  return true;
}

/**
 * Generate notes about the itinerary
 */
function generateItineraryNotes(
  restrictions: Record<string, unknown> | undefined,
  outboundFlight: Flight | undefined,
  returnFlight: Flight | undefined,
  hotel: { name: string; room: string }
): string {
  const notes: string[] = [];

  // Flight notes
  if (outboundFlight) {
    notes.push(
      `Outbound: ${outboundFlight.airline} ${outboundFlight.flightNumber} (${outboundFlight.stops === 0 ? "direct" : `${outboundFlight.stops} stop(s)`})`
    );
  }

  if (returnFlight) {
    notes.push(
      `Return: ${returnFlight.airline} ${returnFlight.flightNumber} (${returnFlight.stops === 0 ? "direct" : `${returnFlight.stops} stop(s)`})`
    );
  }

  // Hotel notes
  notes.push(`Hotel: ${hotel.name} - ${hotel.room}`);

  // Restriction notes
  if (restrictions) {
    if (restrictions.dietary) {
      notes.push(`Dietary requirements: ${(restrictions.dietary as string[]).join(", ")}`);
    }
    if (restrictions.mobility) {
      notes.push(`Mobility assistance: ${restrictions.mobility}`);
    }
    if (restrictions.seating) {
      notes.push(`Seating preference: ${restrictions.seating}`);
    }
  }

  return notes.join("\n");
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Validate itinerary request
 */
export function validateItineraryRequest(
  request: Partial<ItineraryRequest>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.eventId) errors.push("Event ID is required");
  if (!request.employeeId) errors.push("Employee ID is required");
  if (!request.destination) errors.push("Destination is required");
  if (!request.departureDate) errors.push("Departure date is required");
  if (!request.returnDate) errors.push("Return date is required");
  if (!request.budgetPerPerson || request.budgetPerPerson <= 0) {
    errors.push("Valid budget per person is required");
  }

  // Validate dates
  if (request.departureDate && request.returnDate) {
    const departure = new Date(request.departureDate);
    const returnDate = new Date(request.returnDate);
    
    if (returnDate <= departure) {
      errors.push("Return date must be after departure date");
    }
    
    if (departure < new Date()) {
      errors.push("Departure date must be in the future");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
