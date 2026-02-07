import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Hook for fetching employees list
 */
export function useEmployees(options?: {
  team?: string;
  status?: "active" | "inactive";
  limit?: number;
}) {
  const employees = useQuery(api.employees.list, options ?? {});

  return {
    employees: employees ?? [],
    isLoading: employees === undefined,
  };
}

/**
 * Hook for fetching a single employee
 */
export function useEmployee(id: Id<"employees"> | null) {
  const employee = useQuery(
    api.employees.get,
    id ? { id } : "skip"
  );

  return {
    employee,
    isLoading: id !== null && employee === undefined,
  };
}

/**
 * Hook for fetching employees by team
 */
export function useEmployeesByTeam(team: string | null) {
  const employees = useQuery(
    api.employees.getByTeam,
    team ? { team } : "skip"
  );

  return {
    employees: employees ?? [],
    isLoading: team !== null && employees === undefined,
  };
}

/**
 * Hook for fetching employee statistics
 */
export function useEmployeeStats() {
  const stats = useQuery(api.employees.getStats);

  return {
    stats,
    isLoading: stats === undefined,
  };
}

/**
 * Hook for employee mutations
 */
export function useEmployeeMutations() {
  const create = useMutation(api.employees.create);
  const update = useMutation(api.employees.update);
  const updateRestrictions = useMutation(api.employees.updateRestrictions);
  const remove = useMutation(api.employees.remove);

  return {
    createEmployee: create,
    updateEmployee: update,
    updateEmployeeRestrictions: updateRestrictions,
    deleteEmployee: remove,
  };
}
