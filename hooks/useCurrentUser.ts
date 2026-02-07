import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type UserRole = "admin" | "employee";

export interface CurrentUser {
  _id: string;
  userId: string;
  role: UserRole;
  employeeId?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export function useCurrentUser() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  
  const userProfile = useQuery(
    api.userProfiles.me,
    isAuthenticated ? {} : "skip"
  );

  return {
    user: userProfile as CurrentUser | null | undefined,
    isLoading: isAuthLoading || (isAuthenticated && userProfile === undefined),
    isAuthenticated,
    isAdmin: userProfile?.role === "admin",
    isEmployee: userProfile?.role === "employee",
  };
}

export function useRequireAuth(redirectTo: string = "/auth/login") {
  const { user, isLoading, isAuthenticated } = useCurrentUser();

  // Note: Actual redirect is handled by middleware
  // This hook is for client-side state management
  return {
    user,
    isLoading,
    isAuthenticated,
  };
}

export function useRequireAdmin() {
  const { user, isLoading, isAuthenticated, isAdmin } = useCurrentUser();

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    hasAccess: isAdmin,
  };
}

export function useRequireEmployee() {
  const { user, isLoading, isAuthenticated, isEmployee } = useCurrentUser();

  return {
    user,
    isLoading,
    isAuthenticated,
    isEmployee,
    hasAccess: isEmployee,
  };
}
