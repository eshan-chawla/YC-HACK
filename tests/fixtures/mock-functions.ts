/**
 * Test Fixtures - Mock Functions
 * 
 * Reusable mock functions for testing
 */

import { vi } from 'vitest'
import { 
  mockEmployees, 
  mockEvents, 
  mockTrips, 
  mockItineraries,
  mockFlightSearchResult,
  mockUsers,
} from './mock-data'

/**
 * Creates a mock Convex database context
 */
export function createMockDbContext(overrides: Partial<MockDbContext> = {}): MockDbContext {
  return {
    getEvent: vi.fn().mockImplementation((id: string) => 
      Promise.resolve(mockEvents.find(e => e._id === id) || null)
    ),
    getEmployee: vi.fn().mockImplementation((id: string) =>
      Promise.resolve(mockEmployees.find(e => e._id === id) || null)
    ),
    getTrip: vi.fn().mockImplementation((id: string) =>
      Promise.resolve(mockTrips.find(t => t._id === id) || null)
    ),
    listTrips: vi.fn().mockImplementation(({ eventId, employeeId, status }) => {
      let trips = [...mockTrips]
      if (eventId) trips = trips.filter(t => t.eventId === eventId)
      if (employeeId) trips = trips.filter(t => t.employeeId === employeeId)
      if (status) trips = trips.filter(t => t.status === status)
      return Promise.resolve(trips)
    }),
    updateTrip: vi.fn().mockResolvedValue(undefined),
    createItinerary: vi.fn().mockResolvedValue('itin_new'),
    ...overrides,
  }
}

export interface MockDbContext {
  getEvent: ReturnType<typeof vi.fn>
  getEmployee: ReturnType<typeof vi.fn>
  getTrip: ReturnType<typeof vi.fn>
  listTrips: ReturnType<typeof vi.fn>
  updateTrip: ReturnType<typeof vi.fn>
  createItinerary: ReturnType<typeof vi.fn>
}

/**
 * Creates a mock Convex context for queries/mutations
 */
export function createMockConvexContext(options: {
  userId?: string | null
  role?: 'admin' | 'employee'
} = {}) {
  const { userId = 'user_1', role = 'admin' } = options
  
  // In-memory database state
  const dbState = {
    employees: [...mockEmployees],
    events: [...mockEvents],
    trips: [...mockTrips],
    itineraries: [...mockItineraries],
    userProfiles: [mockUsers.admin, mockUsers.employee],
  }
  
  return {
    db: {
      get: vi.fn().mockImplementation((id: string) => {
        for (const collection of Object.values(dbState)) {
          const item = collection.find((item: any) => item._id === id)
          if (item) return Promise.resolve(item)
        }
        return Promise.resolve(null)
      }),
      insert: vi.fn().mockImplementation((table: string, data: any) => {
        const id = `${table.slice(0, -1)}_${Date.now()}`
        const record = { _id: id, ...data }
        ;(dbState as any)[table]?.push(record)
        return Promise.resolve(id)
      }),
      patch: vi.fn().mockImplementation((id: string, updates: any) => {
        for (const collection of Object.values(dbState)) {
          const index = collection.findIndex((item: any) => item._id === id)
          if (index >= 0) {
            ;(collection as any[])[index] = { ...(collection as any[])[index], ...updates }
            return Promise.resolve(undefined)
          }
        }
        return Promise.resolve(undefined)
      }),
      delete: vi.fn().mockImplementation((id: string) => {
        for (const [name, collection] of Object.entries(dbState)) {
          const index = collection.findIndex((item: any) => item._id === id)
          if (index >= 0) {
            collection.splice(index, 1)
            return Promise.resolve(undefined)
          }
        }
        return Promise.resolve(undefined)
      }),
      query: vi.fn().mockImplementation((table: string) => ({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockImplementation(() => 
            Promise.resolve((dbState as any)[table]?.[0] || null)
          ),
          collect: vi.fn().mockImplementation(() => 
            Promise.resolve((dbState as any)[table] || [])
          ),
        }),
        filter: vi.fn().mockReturnValue({
          collect: vi.fn().mockImplementation(() => 
            Promise.resolve((dbState as any)[table] || [])
          ),
        }),
        order: vi.fn().mockReturnValue({
          take: vi.fn().mockImplementation((limit: number) => 
            Promise.resolve((dbState as any)[table]?.slice(0, limit) || [])
          ),
        }),
        collect: vi.fn().mockImplementation(() => 
          Promise.resolve((dbState as any)[table] || [])
        ),
      })),
    },
    auth: {
      getUserIdentity: vi.fn().mockResolvedValue(
        userId ? { subject: userId, email: `${userId}@example.com` } : null
      ),
    },
    _dbState: dbState,
    _userId: userId,
    _role: role,
  }
}

/**
 * Creates mock auth helpers
 */
export function createMockAuthHelpers(options: {
  userId?: string | null
  role?: 'admin' | 'employee'
  employeeId?: string
} = {}) {
  const { userId = 'user_1', role = 'admin', employeeId } = options
  
  const mockUser = {
    _id: `profile_${userId}`,
    userId,
    role,
    employeeId,
  }
  
  return {
    getCurrentUserOrNull: vi.fn().mockResolvedValue(userId ? mockUser : null),
    getCurrentUser: vi.fn().mockImplementation(() => {
      if (!userId) throw new Error('Not authenticated')
      return Promise.resolve(mockUser)
    }),
    requireAuth: vi.fn().mockImplementation(() => {
      if (!userId) throw new Error('Not authenticated')
      return Promise.resolve(mockUser)
    }),
    requireAdmin: vi.fn().mockImplementation(() => {
      if (!userId) throw new Error('Not authenticated')
      if (role !== 'admin') throw new Error('Unauthorized: Admin access required')
      return Promise.resolve(mockUser)
    }),
    requireEmployee: vi.fn().mockImplementation(() => {
      if (!userId) throw new Error('Not authenticated')
      if (role !== 'employee') throw new Error('Unauthorized: Employee access required')
      return Promise.resolve(mockUser)
    }),
    canAccessEmployee: vi.fn().mockImplementation((ctx: any, targetEmployeeId: string) => {
      if (!userId) return Promise.resolve(false)
      if (role === 'admin') return Promise.resolve(true)
      return Promise.resolve(employeeId === targetEmployeeId)
    }),
  }
}

/**
 * Creates mock Kiwi MCP client
 */
export function createMockKiwiClient() {
  return {
    searchFlights: vi.fn().mockResolvedValue(mockFlightSearchResult),
    getFlightDetails: vi.fn().mockResolvedValue(null),
    listTools: vi.fn().mockResolvedValue([
      { name: 'search-flight', description: 'Search for flights' },
      { name: 'feedback-to-devs', description: 'Send feedback' },
    ]),
    disconnect: vi.fn().mockResolvedValue(undefined),
  }
}

/**
 * Creates mock Locus payment client
 */
export function createMockLocusClient() {
  return {
    sendPayment: vi.fn().mockResolvedValue({
      success: true,
      transactionId: `tx_${Date.now()}`,
    }),
  }
}

/**
 * Creates mock Gemini AI client
 */
export function createMockGeminiClient(responseText: string = 'Test response') {
  return {
    getGenerativeModel: vi.fn().mockReturnValue({
      startChat: vi.fn().mockReturnValue({
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: vi.fn().mockReturnValue(responseText),
            functionCalls: vi.fn().mockReturnValue(null),
          },
        }),
        sendMessageStream: vi.fn().mockImplementation(async function* () {
          yield {
            text: () => responseText,
            functionCalls: () => null,
          }
        }),
      }),
    }),
  }
}

/**
 * Helper to setup common mocks for agent tests
 */
export function setupAgentTestMocks() {
  vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: vi.fn().mockImplementation(() => createMockGeminiClient()),
    FunctionCallingMode: { AUTO: 'AUTO' },
  }))
  
  vi.mock('@/lib/agent/mcp-integration', () => ({
    kiwiClient: createMockKiwiClient(),
    locusClient: createMockLocusClient(),
  }))
}

/**
 * Helper to setup common mocks for Convex tests
 */
export function setupConvexTestMocks(options: Parameters<typeof createMockAuthHelpers>[0] = {}) {
  const authHelpers = createMockAuthHelpers(options)
  
  vi.mock('@/convex/auth.helpers', () => authHelpers)
  
  return authHelpers
}

/**
 * Wait helper for async tests
 */
export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry helper for flaky tests
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxAttempts) {
        await wait(delayMs * attempt)
      }
    }
  }
  
  throw lastError
}
