/**
 * Test Fixtures - Index
 * 
 * Central export for all test fixtures and utilities
 */

// Mock Data
export * from './mock-data'

// Mock Functions
export * from './mock-functions'

// Convenience re-exports
export {
  mockUsers,
  mockEmployees,
  mockEvents,
  mockTrips,
  mockFlights,
  mockItineraries,
  mockAuditLogs,
  mockConversations,
  mockFlightSearchResult,
  generateMockEmployee,
  generateMockEvent,
  generateMockTrip,
} from './mock-data'

export {
  createMockDbContext,
  createMockConvexContext,
  createMockAuthHelpers,
  createMockKiwiClient,
  createMockLocusClient,
  createMockGeminiClient,
  setupAgentTestMocks,
  setupConvexTestMocks,
  wait,
  retry,
} from './mock-functions'
