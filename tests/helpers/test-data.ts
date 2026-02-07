/**
 * Test data helpers
 * 
 * Provides mock data generators and fixtures for tests
 */

import type { GeneratedItinerary, Flight, FlightSearchResult } from '@/lib/agent/types'

export const TEST_USERS = {
  admin: {
    email: 'admin@tripweaver.test',
    password: 'Admin123!@#',
    name: 'Test Admin',
    role: 'admin' as const,
  },
  employee: {
    email: 'employee@tripweaver.test',
    password: 'Employee123!@#',
    name: 'Test Employee',
    role: 'employee' as const,
  },
}

export const TEST_EMPLOYEES = [
  {
    id: 'emp_1',
    name: 'John Doe',
    email: 'john@company.com',
    team: 'Engineering',
    role: 'Software Engineer',
    department: 'Technology',
    location: 'New York',
    status: 'active' as const,
    restrictions: {
      dietary: ['vegetarian'],
      seating: 'aisle',
    },
  },
  {
    id: 'emp_2',
    name: 'Jane Smith',
    email: 'jane@company.com',
    team: 'Engineering',
    role: 'Product Manager',
    department: 'Product',
    location: 'San Francisco',
    status: 'active' as const,
    restrictions: {
      mobility: 'wheelchair',
      hotelPreferences: ['ground floor'],
    },
  },
  {
    id: 'emp_3',
    name: 'Bob Wilson',
    email: 'bob@company.com',
    team: 'Sales',
    role: 'Account Executive',
    department: 'Sales',
    location: 'Chicago',
    status: 'active' as const,
  },
]

export const TEST_EVENTS = [
  {
    id: 'event_1',
    name: 'Q1 Engineering Offsite',
    description: 'Quarterly team building event',
    destination: 'London',
    departureDate: new Date('2026-03-01').getTime(),
    returnDate: new Date('2026-03-05').getTime(),
    budgetPerEmployee: 2000,
    totalBudget: 6000,
    employeeIds: ['emp_1', 'emp_2', 'emp_3'],
    status: 'pending' as const,
    requirements: {
      preferredAirlines: ['United', 'Delta'],
      cabinClass: 'economy' as const,
      mealAllowancePerDay: 50,
    },
  },
  {
    id: 'event_2',
    name: 'Sales Kickoff 2026',
    destination: 'Miami',
    departureDate: new Date('2026-04-15').getTime(),
    returnDate: new Date('2026-04-18').getTime(),
    budgetPerEmployee: 1500,
    totalBudget: 4500,
    employeeIds: ['emp_3'],
    status: 'draft' as const,
  },
]

export function createMockFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: `flight_${Math.random().toString(36).slice(2)}`,
    airline: 'United Airlines',
    flightNumber: `UA${Math.floor(Math.random() * 9000) + 1000}`,
    departure: {
      airport: 'JFK',
      time: '2026-03-01T08:00:00',
    },
    arrival: {
      airport: 'LHR',
      time: '2026-03-01T20:00:00',
    },
    duration: 420,
    stops: 0,
    price: 450,
    currency: 'USD',
    cabinClass: 'economy',
    seatsAvailable: 12,
    ...overrides,
  }
}

export function createMockFlightSearchResult(
  params: { origin: string; destination: string },
  count: number = 3
): FlightSearchResult {
  return {
    searchId: `search_${Date.now()}`,
    flights: Array.from({ length: count }, (_, i) =>
      createMockFlight({
        id: `flight_${i + 1}`,
        departure: { airport: params.origin, time: '2026-03-01T08:00:00' },
        arrival: { airport: params.destination, time: '2026-03-01T20:00:00' },
        price: 350 + i * 50,
      })
    ),
    currency: 'USD',
    searchedAt: new Date().toISOString(),
  }
}

export function createMockItinerary(overrides: Partial<GeneratedItinerary> = {}): GeneratedItinerary {
  return {
    tripId: `trip_${Math.random().toString(36).slice(2)}`,
    eventId: 'event_1',
    employeeId: 'emp_1',
    outboundFlight: createMockFlight({ price: 500 }),
    returnFlight: createMockFlight({
      departure: { airport: 'LHR', time: '2026-03-05T10:00:00' },
      arrival: { airport: 'JFK', time: '2026-03-05T14:00:00' },
      price: 450,
    }),
    hotel: {
      name: 'Marriott London',
      address: '123 Business District, London',
      checkIn: '2026-03-01',
      checkOut: '2026-03-05',
      room: 'Standard Room',
      pricePerNight: 150,
      totalPrice: 600,
    },
    groundTransport: {
      type: 'Airport Transfer',
      from: 'LHR Airport',
      to: 'Marriott London',
      price: 50,
    },
    totalCost: 1600,
    withinBudget: true,
    policyCompliant: true,
    notes: 'Generated test itinerary',
    ...overrides,
  }
}

export function createMockCostBreakdown(total: number = 1600) {
  return {
    flights: Math.round(total * 0.6),
    hotel: Math.round(total * 0.3),
    groundTransport: Math.round(total * 0.05),
    meals: Math.round(total * 0.05),
    total,
  }
}

export function randomString(length: number = 10): string {
  return Math.random().toString(36).slice(2, 2 + length)
}

export function randomEmail(): string {
  return `test_${randomString(8)}@tripweaver.test`
}

export function futureDate(daysFromNow: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}
