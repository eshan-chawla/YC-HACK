import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Flight segment validator
const flightSegmentValidator = v.object({
  airline: v.string(),
  flightNumber: v.string(),
  departure: v.object({
    airport: v.string(),
    time: v.number(), // Unix timestamp
  }),
  arrival: v.object({
    airport: v.string(),
    time: v.number(), // Unix timestamp
  }),
  seat: v.optional(v.string()),
  cabin: v.string(),
  baggage: v.optional(v.string()),
  cost: v.number(),
});

// Hotel booking validator
const hotelBookingValidator = v.object({
  name: v.string(),
  address: v.string(),
  checkIn: v.number(), // Unix timestamp
  checkOut: v.number(), // Unix timestamp
  room: v.string(),
  nights: v.number(),
  costPerNight: v.number(),
  totalCost: v.number(),
});

// Transport booking validator
const transportBookingValidator = v.object({
  type: v.string(),
  from: v.string(),
  to: v.string(),
  time: v.number(), // Unix timestamp
  cost: v.number(),
});

// Full itinerary validator
const itineraryDataValidator = v.object({
  outboundFlight: v.optional(flightSegmentValidator),
  hotel: v.optional(hotelBookingValidator),
  groundTransport: v.optional(transportBookingValidator),
  returnFlight: v.optional(flightSegmentValidator),
});

// Cost breakdown validator
const costBreakdownValidator = v.object({
  flights: v.number(),
  hotel: v.number(),
  groundTransport: v.number(),
  meals: v.number(),
  total: v.number(),
});

// Employee restrictions/preferences validator
const employeeRestrictionsValidator = v.object({
  dietary: v.optional(v.array(v.string())), // e.g., ["vegetarian", "gluten-free"]
  mobility: v.optional(v.string()), // e.g., "wheelchair", "none"
  seating: v.optional(v.string()), // e.g., "window", "aisle"
  hotelPreferences: v.optional(v.array(v.string())), // e.g., ["non-smoking", "ground floor"]
  other: v.optional(v.string()),
});

// Frequent flyer number validator
const frequentFlyerValidator = v.object({
  airline: v.string(),
  number: v.string(),
});

// Loyalty program validator
const loyaltyProgramValidator = v.object({
  program: v.string(),
  memberId: v.string(),
});

// Notification preferences validator
const notificationPreferencesValidator = v.object({
  email: v.boolean(),
  sms: v.boolean(),
  push: v.boolean(),
});

// Admin requirements for events validator
const eventRequirementsValidator = v.object({
  preferredAirlines: v.optional(v.array(v.string())),
  preferredHotels: v.optional(v.array(v.string())),
  maxFlightDuration: v.optional(v.number()), // in minutes
  cabinClass: v.optional(v.union(v.literal("economy"), v.literal("premium_economy"), v.literal("business"), v.literal("first"))),
  requireDirectFlights: v.optional(v.boolean()),
  mealAllowancePerDay: v.optional(v.number()),
  groundTransportLimit: v.optional(v.number()),
  customRestrictions: v.optional(v.string()),
});

const schema = defineSchema({
  // Extended user profile with role
  userProfiles: defineTable({
    userId: v.string(), // Clerk user ID (identity.subject)
    role: v.union(v.literal("admin"), v.literal("employee")),
    employeeId: v.optional(v.id("employees")), // Link to employee record if role is "employee"
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    // Onboarding fields for admins
    companyName: v.optional(v.string()),
    department: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    timezone: v.optional(v.string()),
    currency: v.optional(v.string()),
    language: v.optional(v.string()),
    notificationPreferences: v.optional(notificationPreferencesValidator),
    onboardingCompleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_role", ["role"])
    .index("by_employeeId", ["employeeId"])
    .index("by_onboardingCompleted", ["onboardingCompleted"]),

  // Employees table
  employees: defineTable({
    name: v.string(),
    email: v.string(),
    team: v.string(),
    role: v.string(), // Job role/title (not auth role)
    department: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    restrictions: v.optional(employeeRestrictionsValidator),
    // Additional employee onboarding fields
    phoneNumber: v.optional(v.string()),
    manager: v.optional(v.string()),
    frequentFlyerNumbers: v.optional(v.array(frequentFlyerValidator)),
    loyaltyPrograms: v.optional(v.array(loyaltyProgramValidator)),
    additionalNotes: v.optional(v.string()),
    lastEventBooking: v.optional(v.number()), // Unix timestamp
    totalTripsBooked: v.optional(v.number()),
    profileImage: v.optional(v.string()),
    // Encrypted fields stored as base64 strings
    encryptedData: v.optional(v.string()), // For sensitive personal info
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_team", ["team"])
    .index("by_status", ["status"])
    .index("by_department", ["department"]),

  // Events/Trips table (group travel events)
  events: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    destination: v.string(),
    secondaryDestination: v.optional(v.string()),
    departureDate: v.number(), // Unix timestamp
    returnDate: v.number(), // Unix timestamp
    departureTime: v.optional(v.string()),
    budgetPerEmployee: v.number(),
    totalBudget: v.number(),
    employeeIds: v.array(v.id("employees")),
    requirements: v.optional(eventRequirementsValidator),
    status: v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    createdBy: v.id("userProfiles"), // Admin who created this
    createdAt: v.number(),
    updatedAt: v.number(),
    sentAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"])
    .index("by_departureDate", ["departureDate"]),

  // Individual trips (employee assignments to events)
  trips: defineTable({
    eventId: v.id("events"),
    employeeId: v.id("employees"),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("booked"),
      v.literal("in_progress"),
      v.literal("failed"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    itineraryId: v.optional(v.id("itineraries")), // Link to cached itinerary
    costBreakdown: v.optional(costBreakdownValidator),
    agentNotes: v.optional(v.string()),
    policyCompliance: v.optional(v.boolean()),
    failureReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    bookedAt: v.optional(v.number()),
  })
    .index("by_eventId", ["eventId"])
    .index("by_employeeId", ["employeeId"])
    .index("by_status", ["status"])
    .index("by_eventId_employeeId", ["eventId", "employeeId"]),

  // Cached itineraries (AI-generated)
  itineraries: defineTable({
    tripId: v.id("trips"),
    eventId: v.id("events"),
    employeeId: v.id("employees"),
    // Cache key for invalidation (hash of requirements + restrictions)
    cacheKey: v.string(),
    // The actual itinerary data
    data: itineraryDataValidator,
    // Generation metadata
    generatedAt: v.number(),
    generatedBy: v.string(), // "gemini-2.5" or model identifier
    kiwiSearchId: v.optional(v.string()), // Reference to Kiwi.com search
    // Validity
    isValid: v.boolean(),
    validUntil: v.optional(v.number()), // Prices may expire
    // Version for optimistic updates
    version: v.number(),
  })
    .index("by_tripId", ["tripId"])
    .index("by_eventId", ["eventId"])
    .index("by_employeeId", ["employeeId"])
    .index("by_cacheKey", ["cacheKey"]),

  // Audit logs for security and compliance
  auditLogs: defineTable({
    userId: v.optional(v.id("userProfiles")), // Who performed the action
    action: v.string(), // e.g., "event.create", "employee.view", "itinerary.generate"
    resourceType: v.string(), // e.g., "event", "employee", "trip"
    resourceId: v.optional(v.string()), // ID of the affected resource
    details: v.optional(v.string()), // JSON string with additional details
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_action", ["action"])
    .index("by_resourceType", ["resourceType"])
    .index("by_timestamp", ["timestamp"]),

  // Chat conversations for the AI agent
  conversations: defineTable({
    userId: v.id("userProfiles"),
    title: v.optional(v.string()),
    lastMessageAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_lastMessageAt", ["lastMessageAt"]),

  // Chat messages within conversations
  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    // Tool call tracking
    toolCalls: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      arguments: v.string(), // JSON string
      result: v.optional(v.string()), // JSON string
    }))),
    // Payment tracking
    paymentTriggered: v.optional(v.boolean()),
    paymentAmount: v.optional(v.number()),
    timestamp: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_timestamp", ["timestamp"]),

  // Rate limiting table
  rateLimits: defineTable({
    key: v.string(), // e.g., "auth:user@email.com" or "api:userId"
    count: v.number(),
    windowStart: v.number(), // Unix timestamp
    expiresAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_expiresAt", ["expiresAt"]),
});

export default schema;
