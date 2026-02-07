import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type TripStatus = "pending" | "generating" | "booked" | "in_progress" | "failed" | "completed" | "cancelled";

/**
 * Hook for fetching trips by event
 */
export function useTripsByEvent(eventId: Id<"events"> | null) {
  const trips = useQuery(
    api.trips.listByEvent,
    eventId ? { eventId } : "skip"
  );

  return {
    trips: trips ?? [],
    isLoading: eventId !== null && trips === undefined,
  };
}

/**
 * Hook for fetching trips by employee
 */
export function useTripsByEmployee(employeeId: Id<"employees"> | null) {
  const trips = useQuery(
    api.trips.listByEmployee,
    employeeId ? { employeeId } : "skip"
  );

  return {
    trips: trips ?? [],
    isLoading: employeeId !== null && trips === undefined,
  };
}

/**
 * Hook for fetching current user's trips
 */
export function useMyTrips(options?: { status?: TripStatus }) {
  const trips = useQuery(api.trips.listMine, options ?? {});

  return {
    trips: trips ?? [],
    isLoading: trips === undefined,
  };
}

/**
 * Hook for fetching a single trip
 */
export function useTrip(id: Id<"trips"> | null) {
  const trip = useQuery(
    api.trips.get,
    id ? { id } : "skip"
  );

  return {
    trip,
    isLoading: id !== null && trip === undefined,
  };
}

/**
 * Hook for fetching trip with full details
 */
export function useTripWithDetails(id: Id<"trips"> | null) {
  const trip = useQuery(
    api.trips.getWithDetails,
    id ? { id } : "skip"
  );

  return {
    trip,
    isLoading: id !== null && trip === undefined,
  };
}

/**
 * Hook for trip statistics
 */
export function useTripStats(eventId: Id<"events"> | null) {
  const stats = useQuery(
    api.trips.getEventStats,
    eventId ? { eventId } : "skip"
  );

  return {
    stats,
    isLoading: eventId !== null && stats === undefined,
  };
}

/**
 * Hook for trip mutations
 */
export function useTripMutations() {
  const updateStatus = useMutation(api.trips.updateStatus);
  const updateCostBreakdown = useMutation(api.trips.updateCostBreakdown);
  const updateAgentNotes = useMutation(api.trips.updateAgentNotes);
  const linkItinerary = useMutation(api.trips.linkItinerary);
  const setPolicyCompliance = useMutation(api.trips.setPolicyCompliance);

  return {
    updateTripStatus: updateStatus,
    updateTripCostBreakdown: updateCostBreakdown,
    updateTripAgentNotes: updateAgentNotes,
    linkItineraryToTrip: linkItinerary,
    setTripPolicyCompliance: setPolicyCompliance,
  };
}
