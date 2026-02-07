import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type EventStatus = "draft" | "pending" | "active" | "completed" | "cancelled";

/**
 * Hook for fetching events list
 */
export function useEvents(options?: {
  status?: EventStatus;
  limit?: number;
}) {
  const events = useQuery(api.events.list, options ?? {});

  return {
    events: events ?? [],
    isLoading: events === undefined,
  };
}

/**
 * Hook for fetching a single event
 */
export function useEvent(id: Id<"events"> | null) {
  const event = useQuery(
    api.events.get,
    id ? { id } : "skip"
  );

  return {
    event,
    isLoading: id !== null && event === undefined,
  };
}

/**
 * Hook for fetching event with employee details
 */
export function useEventWithEmployees(id: Id<"events"> | null) {
  const event = useQuery(
    api.events.getWithEmployees,
    id ? { id } : "skip"
  );

  return {
    event,
    isLoading: id !== null && event === undefined,
  };
}

/**
 * Hook for event mutations
 */
export function useEventMutations() {
  const create = useMutation(api.events.create);
  const update = useMutation(api.events.update);
  const addEmployees = useMutation(api.events.addEmployees);
  const removeEmployee = useMutation(api.events.removeEmployee);
  const send = useMutation(api.events.send);
  const cancel = useMutation(api.events.cancel);

  return {
    createEvent: create,
    updateEvent: update,
    addEmployeesToEvent: addEmployees,
    removeEmployeeFromEvent: removeEmployee,
    sendEvent: send,
    cancelEvent: cancel,
  };
}
