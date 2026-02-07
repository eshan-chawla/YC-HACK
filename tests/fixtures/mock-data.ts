/**
 * Test Fixtures - Mock Data
 * 
 * Centralized mock data for use across all tests
 */

// Mock Users
export const mockUsers = {
  admin: {
    _id: 'user_admin_1',
    userId: 'auth_admin_1',
    email: 'admin@tripweaver.com',
    displayName: 'Admin User',
    role: 'admin' as const,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  employee: {
    _id: 'user_emp_1',
    userId: 'auth_emp_1',
    email: 'john.doe@company.com',
    displayName: 'John Doe',
    role: 'employee' as const,
    employeeId: 'emp_1',
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
  },
}

// Mock Employees
export const mockEmployees = [
  {
    _id: 'emp_1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    team: 'Engineering',
    department: 'Technology',
    role: 'Senior Engineer',
    location: 'JFK',
    status: 'active' as const,
    startDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
    restrictions: {
      dietary: ['vegetarian'],
      seating: 'aisle',
      mobility: 'none',
    },
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    _id: 'emp_2',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    team: 'Engineering',
    department: 'Technology',
    role: 'Staff Engineer',
    location: 'LAX',
    status: 'active' as const,
    startDate: Date.now() - 500 * 24 * 60 * 60 * 1000,
    restrictions: {
      dietary: [],
      seating: 'window',
      mobility: 'none',
    },
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    _id: 'emp_3',
    name: 'Bob Johnson',
    email: 'bob.johnson@company.com',
    team: 'Product',
    department: 'Product',
    role: 'Product Manager',
    location: 'ORD',
    status: 'active' as const,
    startDate: Date.now() - 200 * 24 * 60 * 60 * 1000,
    restrictions: {
      dietary: ['gluten-free'],
      seating: 'aisle',
      mobility: 'none',
    },
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
]

// Mock Events
export const mockEvents = [
  {
    _id: 'event_1',
    name: 'Q1 Engineering Offsite 2026',
    description: 'Annual engineering team offsite to plan Q1 roadmap',
    destination: 'LHR',
    departureDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    returnDate: Date.now() + 35 * 24 * 60 * 60 * 1000,
    budgetPerEmployee: 2000,
    status: 'pending' as const,
    employeeIds: ['emp_1', 'emp_2'],
    requirements: {
      cabinClass: 'economy',
      preferredAirlines: ['United', 'Delta', 'British Airways'],
      hotelStars: 4,
      mealAllowancePerDay: 75,
    },
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    createdBy: 'admin_1',
  },
  {
    _id: 'event_2',
    name: 'All Hands Paris 2026',
    description: 'Company-wide all hands meeting',
    destination: 'CDG',
    departureDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
    returnDate: Date.now() + 64 * 24 * 60 * 60 * 1000,
    budgetPerEmployee: 2500,
    status: 'draft' as const,
    employeeIds: ['emp_1', 'emp_2', 'emp_3'],
    requirements: {
      cabinClass: 'business',
      preferredAirlines: ['Air France', 'Delta'],
      hotelStars: 5,
      mealAllowancePerDay: 100,
    },
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    createdBy: 'admin_1',
  },
]

// Mock Trips
export const mockTrips = [
  {
    _id: 'trip_1',
    eventId: 'event_1',
    employeeId: 'emp_1',
    status: 'pending' as const,
    itineraryId: 'itin_1',
    costBreakdown: {
      flights: 900,
      hotel: 500,
      groundTransport: 100,
      meals: 0,
      total: 1500,
    },
    policyCompliant: true,
    policyViolations: [],
    agentNotes: 'Direct flight selected due to employee preference. Hotel within walking distance of venue.',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    _id: 'trip_2',
    eventId: 'event_1',
    employeeId: 'emp_2',
    status: 'pending' as const,
    itineraryId: 'itin_2',
    costBreakdown: {
      flights: 850,
      hotel: 500,
      groundTransport: 120,
      meals: 0,
      total: 1470,
    },
    policyCompliant: true,
    policyViolations: [],
    agentNotes: 'Connection via JFK to get better pricing.',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
]

// Mock Flights
export const mockFlights = [
  {
    id: 'flight_1',
    airline: 'United Airlines',
    flightNumber: 'UA123',
    departure: {
      airport: 'JFK',
      time: '2026-03-01T08:00:00',
      terminal: 'T7',
    },
    arrival: {
      airport: 'LHR',
      time: '2026-03-01T20:00:00',
      terminal: 'T2',
    },
    duration: 420,
    stops: 0,
    price: 550,
    currency: 'USD',
    cabinClass: 'economy',
    seatsAvailable: 45,
  },
  {
    id: 'flight_2',
    airline: 'British Airways',
    flightNumber: 'BA456',
    departure: {
      airport: 'JFK',
      time: '2026-03-01T10:30:00',
      terminal: 'T7',
    },
    arrival: {
      airport: 'LHR',
      time: '2026-03-01T22:30:00',
      terminal: 'T5',
    },
    duration: 420,
    stops: 0,
    price: 650,
    currency: 'USD',
    cabinClass: 'economy',
    seatsAvailable: 30,
  },
  {
    id: 'flight_3',
    airline: 'Delta Airlines',
    flightNumber: 'DL789',
    departure: {
      airport: 'LAX',
      time: '2026-03-01T14:00:00',
      terminal: 'TBIT',
    },
    arrival: {
      airport: 'LHR',
      time: '2026-03-02T08:00:00',
      terminal: 'T3',
    },
    duration: 600,
    stops: 0,
    price: 720,
    currency: 'USD',
    cabinClass: 'economy',
    seatsAvailable: 60,
  },
]

// Mock Itineraries
export const mockItineraries = [
  {
    _id: 'itin_1',
    tripId: 'trip_1',
    eventId: 'event_1',
    employeeId: 'emp_1',
    outboundFlight: mockFlights[0],
    returnFlight: {
      ...mockFlights[0],
      id: 'flight_1_return',
      departure: { ...mockFlights[0].arrival, time: '2026-03-05T10:00:00' },
      arrival: { ...mockFlights[0].departure, time: '2026-03-05T13:00:00' },
    },
    hotel: {
      name: 'The Ritz London',
      address: '150 Piccadilly, St. James\'s, London W1J 9BR',
      checkIn: '2026-03-01',
      checkOut: '2026-03-05',
      room: 'Standard Double',
      pricePerNight: 150,
      totalPrice: 600,
      stars: 5,
    },
    groundTransport: {
      type: 'Airport Transfer',
      from: 'LHR',
      to: 'Hotel',
      price: 75,
      roundTrip: true,
    },
    totalCost: 1775,
    withinBudget: true,
    policyCompliant: true,
    isValid: true,
    cacheKey: 'event_1_emp_1_hash123',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
]

// Mock Audit Logs
export const mockAuditLogs = [
  {
    _id: 'log_1',
    action: 'create',
    resourceType: 'event',
    resourceId: 'event_1',
    userId: 'admin_1',
    timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
    details: { name: 'Q1 Engineering Offsite 2026' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
  },
  {
    _id: 'log_2',
    action: 'update',
    resourceType: 'event',
    resourceId: 'event_1',
    userId: 'admin_1',
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
    details: { status: 'pending' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
  },
]

// Mock Conversations
export const mockConversations = [
  {
    _id: 'conv_1',
    userId: 'admin_1',
    title: 'Q1 Offsite Planning',
    messages: [
      {
        role: 'user',
        content: 'Help me plan the Q1 Engineering Offsite',
        timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000,
      },
      {
        role: 'assistant',
        content: 'I\'d be happy to help! Let\'s start with the basics. How many people will be attending?',
        timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 1000,
      },
    ],
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 6 * 24 * 60 * 60 * 1000 + 2000,
  },
]

// Flight Search Result
export const mockFlightSearchResult = {
  searchId: 'search_123456',
  flights: mockFlights,
  currency: 'USD',
  searchedAt: new Date().toISOString(),
}

// Helper to generate dynamic mock data
export function generateMockEmployee(overrides: Partial<typeof mockEmployees[0]> = {}) {
  const id = `emp_${Date.now()}`
  return {
    _id: id,
    name: 'Generated Employee',
    email: `generated${Date.now()}@company.com`,
    team: 'Engineering',
    department: 'Technology',
    role: 'Engineer',
    location: 'JFK',
    status: 'active' as const,
    startDate: Date.now(),
    restrictions: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

export function generateMockEvent(overrides: Partial<typeof mockEvents[0]> = {}) {
  const id = `event_${Date.now()}`
  return {
    _id: id,
    name: 'Generated Event',
    description: 'Test event',
    destination: 'LHR',
    departureDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    returnDate: Date.now() + 35 * 24 * 60 * 60 * 1000,
    budgetPerEmployee: 2000,
    status: 'draft' as const,
    employeeIds: [],
    requirements: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'admin_1',
    ...overrides,
  }
}

export function generateMockTrip(overrides: Partial<typeof mockTrips[0]> = {}) {
  const id = `trip_${Date.now()}`
  return {
    _id: id,
    eventId: 'event_1',
    employeeId: 'emp_1',
    status: 'pending' as const,
    costBreakdown: {
      flights: 0,
      hotel: 0,
      groundTransport: 0,
      meals: 0,
      total: 0,
    },
    policyCompliant: true,
    policyViolations: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}
