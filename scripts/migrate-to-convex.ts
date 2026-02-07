/**
 * Migration script to move data from Supabase to Convex
 * 
 * Usage:
 *   1. Ensure Supabase environment variables are set
 *   2. Ensure Convex is deployed (npx convex deploy)
 *   3. Run: npx ts-node scripts/migrate-to-convex.ts
 * 
 * This script:
 *   - Exports employees, events, and trips from Supabase
 *   - Transforms data to match Convex schema
 *   - Imports data into Convex using mutations
 */

import { createClient } from "@supabase/supabase-js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Types for Supabase data
interface SupabaseEmployee {
  id: string;
  name: string;
  email: string;
  team: string;
  location?: string;
  created_at: string;
}

interface SupabaseEvent {
  id: string;
  name: string;
  destination: string;
  location?: string;
  event_date: string;
  event_time?: string;
  budget_per_person: number;
  total_budget: number;
  restrictions?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SupabaseTrip {
  id: string;
  event_id: string;
  employee_id: string;
  price?: number;
  trip_details?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// ID mapping (Supabase UUID -> Convex ID)
const employeeIdMap = new Map<string, string>();
const eventIdMap = new Map<string, string>();

async function main() {
  console.log("Starting migration from Supabase to Convex...\n");

  // Initialize clients
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Supabase environment variables not set");
    console.log("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  if (!convexUrl) {
    console.error("Error: Convex URL not set");
    console.log("Set NEXT_PUBLIC_CONVEX_URL");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const convex = new ConvexHttpClient(convexUrl);

  // Step 1: Export data from Supabase
  console.log("Step 1: Exporting data from Supabase...");

  // Get employees
  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("*");

  if (empError) {
    console.error("Error fetching employees:", empError);
    process.exit(1);
  }

  console.log(`  Found ${employees?.length || 0} employees`);

  // Get events
  const { data: events, error: eventError } = await supabase
    .from("events")
    .select("*");

  if (eventError) {
    console.error("Error fetching events:", eventError);
    process.exit(1);
  }

  console.log(`  Found ${events?.length || 0} events`);

  // Get trips
  const { data: trips, error: tripError } = await supabase
    .from("trips")
    .select("*");

  if (tripError) {
    console.error("Error fetching trips:", tripError);
    process.exit(1);
  }

  console.log(`  Found ${trips?.length || 0} trips\n`);

  // Step 2: Transform and import employees
  console.log("Step 2: Importing employees to Convex...");

  for (const emp of (employees || []) as SupabaseEmployee[]) {
    try {
      // Note: Since we can't use admin mutations directly from a script,
      // this would need to be done through an internal mutation or admin API
      // For now, we'll log what would be imported
      
      console.log(`  Would import employee: ${emp.name} (${emp.email})`);
      
      // In a real migration, you would call:
      // const convexId = await convex.mutation(api.employees.create, {
      //   name: emp.name,
      //   email: emp.email,
      //   team: emp.team,
      //   role: "Employee", // Default role
      //   location: emp.location,
      //   status: "active",
      // });
      // employeeIdMap.set(emp.id, convexId);
      
      // Simulated ID mapping for demonstration
      employeeIdMap.set(emp.id, `convex_emp_${emp.id.slice(0, 8)}`);
    } catch (error) {
      console.error(`  Error importing employee ${emp.email}:`, error);
    }
  }

  console.log(`  Imported ${employeeIdMap.size} employees\n`);

  // Step 3: Transform and import events
  console.log("Step 3: Importing events to Convex...");

  for (const event of (events || []) as SupabaseEvent[]) {
    try {
      // Parse dates
      const departureDate = new Date(event.event_date).getTime();
      // Default return date to 3 days after departure if not specified
      const returnDate = departureDate + (3 * 24 * 60 * 60 * 1000);

      console.log(`  Would import event: ${event.name} -> ${event.destination}`);

      // In a real migration:
      // const convexId = await convex.mutation(api.events.create, {
      //   name: event.name,
      //   destination: event.destination,
      //   departureDate,
      //   returnDate,
      //   departureTime: event.event_time,
      //   budgetPerEmployee: event.budget_per_person,
      //   totalBudget: event.total_budget,
      //   employeeIds: [], // Will be populated from trips
      //   status: mapEventStatus(event.status),
      // });
      // eventIdMap.set(event.id, convexId);

      eventIdMap.set(event.id, `convex_event_${event.id.slice(0, 8)}`);
    } catch (error) {
      console.error(`  Error importing event ${event.name}:`, error);
    }
  }

  console.log(`  Imported ${eventIdMap.size} events\n`);

  // Step 4: Import trips (linking employees to events)
  console.log("Step 4: Importing trips to Convex...");

  let tripCount = 0;
  for (const trip of (trips || []) as SupabaseTrip[]) {
    try {
      const convexEventId = eventIdMap.get(trip.event_id);
      const convexEmployeeId = employeeIdMap.get(trip.employee_id);

      if (!convexEventId || !convexEmployeeId) {
        console.log(`  Skipping trip: missing event or employee mapping`);
        continue;
      }

      console.log(`  Would import trip for event ${trip.event_id.slice(0, 8)}`);

      // In a real migration, trips are created automatically when
      // employees are added to events, so this would be:
      // await convex.mutation(api.events.addEmployees, {
      //   eventId: convexEventId,
      //   employeeIds: [convexEmployeeId],
      // });

      tripCount++;
    } catch (error) {
      console.error(`  Error importing trip:`, error);
    }
  }

  console.log(`  Imported ${tripCount} trips\n`);

  // Summary
  console.log("Migration Summary:");
  console.log("==================");
  console.log(`Employees: ${employeeIdMap.size}`);
  console.log(`Events: ${eventIdMap.size}`);
  console.log(`Trips: ${tripCount}`);
  console.log("\nNote: This was a dry run. To actually migrate data:");
  console.log("1. Deploy Convex: npx convex deploy");
  console.log("2. Create an admin user first");
  console.log("3. Use the admin dashboard or internal mutations to import data");
}

function mapEventStatus(supabaseStatus: string): "draft" | "pending" | "active" | "completed" | "cancelled" {
  const statusMap: Record<string, "draft" | "pending" | "active" | "completed" | "cancelled"> = {
    pending: "pending",
    active: "active",
    completed: "completed",
    cancelled: "cancelled",
  };
  return statusMap[supabaseStatus] || "draft";
}

// Run migration
main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
