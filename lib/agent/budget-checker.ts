/**
 * Budget Compliance Checker
 * 
 * Validates itineraries and trips against admin-defined budgets
 * and company travel policies.
 */

import type { GeneratedItinerary, Flight } from "./types";

export interface BudgetCheckResult {
  compliant: boolean;
  withinBudget: boolean;
  policyViolations: string[];
  warnings: string[];
  details: {
    totalCost: number;
    budget: number;
    overage: number;
    percentUsed: number;
    breakdown: {
      flights: number;
      hotel: number;
      groundTransport: number;
      meals: number;
      other: number;
    };
  };
}

export interface PolicyRequirements {
  maxFlightCost?: number;
  maxHotelPerNight?: number;
  maxMealPerDay?: number;
  maxGroundTransport?: number;
  preferredAirlines?: string[];
  preferredHotels?: string[];
  allowedCabinClasses?: string[];
  requireDirectFlights?: boolean;
  maxTotalBudget: number;
  mealAllowancePerDay?: number;
}

/**
 * Check if an itinerary complies with budget and policy
 */
export function checkBudgetCompliance(
  itinerary: GeneratedItinerary,
  policy: PolicyRequirements
): BudgetCheckResult {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Calculate costs
  const flightCost = (itinerary.outboundFlight?.price ?? 0) + (itinerary.returnFlight?.price ?? 0);
  const hotelCost = itinerary.hotel?.totalPrice ?? 0;
  const transportCost = itinerary.groundTransport?.price ?? 0;
  const mealCost = 0; // Would calculate from meal allowance
  const totalCost = itinerary.totalCost;

  // Check total budget
  const withinBudget = totalCost <= policy.maxTotalBudget;
  if (!withinBudget) {
    violations.push(
      `Total cost ($${totalCost.toFixed(2)}) exceeds budget ($${policy.maxTotalBudget.toFixed(2)})`
    );
  }

  // Check flight cost
  if (policy.maxFlightCost && flightCost > policy.maxFlightCost) {
    violations.push(
      `Flight cost ($${flightCost.toFixed(2)}) exceeds limit ($${policy.maxFlightCost.toFixed(2)})`
    );
  }

  // Check hotel cost per night
  if (policy.maxHotelPerNight && itinerary.hotel) {
    const perNight = itinerary.hotel.pricePerNight;
    if (perNight > policy.maxHotelPerNight) {
      violations.push(
        `Hotel rate ($${perNight.toFixed(2)}/night) exceeds limit ($${policy.maxHotelPerNight.toFixed(2)}/night)`
      );
    }
  }

  // Check cabin class
  if (policy.allowedCabinClasses && policy.allowedCabinClasses.length > 0) {
    if (itinerary.outboundFlight && !policy.allowedCabinClasses.includes(itinerary.outboundFlight.cabinClass)) {
      violations.push(
        `Outbound flight cabin class (${itinerary.outboundFlight.cabinClass}) not in allowed list`
      );
    }
    if (itinerary.returnFlight && !policy.allowedCabinClasses.includes(itinerary.returnFlight.cabinClass)) {
      violations.push(
        `Return flight cabin class (${itinerary.returnFlight.cabinClass}) not in allowed list`
      );
    }
  }

  // Check direct flights requirement
  if (policy.requireDirectFlights) {
    if (itinerary.outboundFlight && itinerary.outboundFlight.stops > 0) {
      violations.push("Policy requires direct flights - outbound has stops");
    }
    if (itinerary.returnFlight && itinerary.returnFlight.stops > 0) {
      violations.push("Policy requires direct flights - return has stops");
    }
  }

  // Check preferred airlines (warning, not violation)
  if (policy.preferredAirlines && policy.preferredAirlines.length > 0) {
    if (itinerary.outboundFlight && !policy.preferredAirlines.includes(itinerary.outboundFlight.airline)) {
      warnings.push(`Outbound flight not on preferred airline (${itinerary.outboundFlight.airline})`);
    }
    if (itinerary.returnFlight && !policy.preferredAirlines.includes(itinerary.returnFlight.airline)) {
      warnings.push(`Return flight not on preferred airline (${itinerary.returnFlight.airline})`);
    }
  }

  // Check preferred hotels (warning, not violation)
  if (policy.preferredHotels && policy.preferredHotels.length > 0 && itinerary.hotel) {
    if (!policy.preferredHotels.includes(itinerary.hotel.name)) {
      warnings.push(`Hotel not in preferred list (${itinerary.hotel.name})`);
    }
  }

  // Check ground transport
  if (policy.maxGroundTransport && transportCost > policy.maxGroundTransport) {
    violations.push(
      `Ground transport ($${transportCost.toFixed(2)}) exceeds limit ($${policy.maxGroundTransport.toFixed(2)})`
    );
  }

  const overage = withinBudget ? 0 : totalCost - policy.maxTotalBudget;
  const percentUsed = policy.maxTotalBudget > 0 
    ? Math.round((totalCost / policy.maxTotalBudget) * 100) 
    : 0;

  return {
    compliant: violations.length === 0,
    withinBudget,
    policyViolations: violations,
    warnings,
    details: {
      totalCost,
      budget: policy.maxTotalBudget,
      overage,
      percentUsed,
      breakdown: {
        flights: flightCost,
        hotel: hotelCost,
        groundTransport: transportCost,
        meals: mealCost,
        other: 0,
      },
    },
  };
}

/**
 * Check multiple itineraries for an event
 */
export function checkEventBudgetCompliance(
  itineraries: GeneratedItinerary[],
  policy: PolicyRequirements,
  totalEventBudget?: number
): {
  overallCompliant: boolean;
  totalCost: number;
  budgetUsed: number;
  results: Array<{
    employeeId: string;
    result: BudgetCheckResult;
  }>;
  summary: {
    compliant: number;
    violations: number;
    warnings: number;
    averageCost: number;
    highestCost: number;
    lowestCost: number;
  };
} {
  const results = itineraries.map((itinerary) => ({
    employeeId: itinerary.employeeId,
    result: checkBudgetCompliance(itinerary, policy),
  }));

  const totalCost = itineraries.reduce((sum, i) => sum + i.totalCost, 0);
  const costs = itineraries.map((i) => i.totalCost);

  const compliantCount = results.filter((r) => r.result.compliant).length;
  const violationCount = results.filter((r) => !r.result.compliant).length;
  const warningCount = results.filter((r) => r.result.warnings.length > 0).length;

  // Check total event budget if specified
  let overallCompliant = violationCount === 0;
  if (totalEventBudget && totalCost > totalEventBudget) {
    overallCompliant = false;
  }

  return {
    overallCompliant,
    totalCost,
    budgetUsed: totalEventBudget ? Math.round((totalCost / totalEventBudget) * 100) : 0,
    results,
    summary: {
      compliant: compliantCount,
      violations: violationCount,
      warnings: warningCount,
      averageCost: costs.length > 0 ? Math.round(totalCost / costs.length) : 0,
      highestCost: costs.length > 0 ? Math.max(...costs) : 0,
      lowestCost: costs.length > 0 ? Math.min(...costs) : 0,
    },
  };
}

/**
 * Suggest budget adjustments to make itinerary compliant
 */
export function suggestBudgetAdjustments(
  result: BudgetCheckResult,
  itinerary: GeneratedItinerary
): string[] {
  const suggestions: string[] = [];

  if (result.withinBudget) {
    return ["Itinerary is within budget - no adjustments needed"];
  }

  const overage = result.details.overage;

  // Suggest flight changes
  if (result.details.breakdown.flights > 0) {
    const flightSavings = result.details.breakdown.flights * 0.2; // Assume 20% savings possible
    if (flightSavings >= overage) {
      suggestions.push(
        `Consider economy class or different airlines - potential savings: $${flightSavings.toFixed(2)}`
      );
    }
  }

  // Suggest hotel changes
  if (result.details.breakdown.hotel > 0) {
    const hotelSavings = result.details.breakdown.hotel * 0.3; // Assume 30% savings possible
    if (hotelSavings >= overage) {
      suggestions.push(
        `Consider a different hotel or room type - potential savings: $${hotelSavings.toFixed(2)}`
      );
    }
  }

  // Suggest different dates
  suggestions.push(
    "Consider flexible travel dates - mid-week flights are often cheaper"
  );

  // Suggest rebooking with more restrictions
  if (itinerary.outboundFlight?.stops === 0) {
    suggestions.push("Consider flights with stops - typically 15-30% cheaper");
  }

  return suggestions;
}

/**
 * Calculate optimal budget allocation
 */
export function calculateOptimalAllocation(
  totalBudget: number,
  nights: number,
  options?: {
    prioritizeFlights?: boolean;
    prioritizeHotel?: boolean;
    includeBuffer?: boolean;
  }
): {
  flights: number;
  hotel: number;
  hotelPerNight: number;
  groundTransport: number;
  meals: number;
  buffer: number;
} {
  const { prioritizeFlights, prioritizeHotel, includeBuffer = true } = options ?? {};

  let flightPercent = 0.45;
  let hotelPercent = 0.35;
  let transportPercent = 0.10;
  let mealPercent = 0.05;
  let bufferPercent = includeBuffer ? 0.05 : 0;

  // Adjust based on priorities
  if (prioritizeFlights) {
    flightPercent = 0.55;
    hotelPercent = 0.28;
  } else if (prioritizeHotel) {
    flightPercent = 0.38;
    hotelPercent = 0.45;
  }

  // Normalize to ensure 100%
  const total = flightPercent + hotelPercent + transportPercent + mealPercent + bufferPercent;
  flightPercent /= total;
  hotelPercent /= total;
  transportPercent /= total;
  mealPercent /= total;
  bufferPercent /= total;

  const flights = Math.round(totalBudget * flightPercent);
  const hotel = Math.round(totalBudget * hotelPercent);
  const groundTransport = Math.round(totalBudget * transportPercent);
  const meals = Math.round(totalBudget * mealPercent);
  const buffer = Math.round(totalBudget * bufferPercent);

  return {
    flights,
    hotel,
    hotelPerNight: nights > 0 ? Math.round(hotel / nights) : hotel,
    groundTransport,
    meals,
    buffer,
  };
}
