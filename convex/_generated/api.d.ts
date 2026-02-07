/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auditLogs from "../auditLogs.js";
import type * as conversations from "../conversations.js";
import type * as employees from "../employees.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as itineraries from "../itineraries.js";
import type * as onboarding from "../onboarding.js";
import type * as rateLimits from "../rateLimits.js";
import type * as trips from "../trips.js";
import type * as userProfiles from "../userProfiles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auditLogs: typeof auditLogs;
  conversations: typeof conversations;
  employees: typeof employees;
  events: typeof events;
  http: typeof http;
  itineraries: typeof itineraries;
  onboarding: typeof onboarding;
  rateLimits: typeof rateLimits;
  trips: typeof trips;
  userProfiles: typeof userProfiles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
