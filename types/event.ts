export interface Event {
  id: string
  name: string
  description?: string
  destination: string
  secondaryDestination?: string
  departureDate: Date
  returnDate: Date
  departureTime?: string
  budgetPerEmployee: number
  totalBudget: number
  employees: string[]
  airlines: string[]
  hotels: string[]
  mealAllowance: number
  groundTransportLimit: number
  policyTemplate?: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  createdAt: Date
  sentAt?: Date
}

export interface Employee {
  id: string
  name: string
  email: string
  team: string
  role: string
  department?: string
}

export interface Trip {
  id: string
  eventId: string
  employeeId: string
  status: 'pending' | 'booked' | 'in_progress' | 'failed' | 'completed'
  itinerary: {
    outboundFlight: FlightSegment
    hotel: HotelBooking
    groundTransport: TransportBooking
    returnFlight: FlightSegment
  }
  costBreakdown: {
    flights: number
    hotel: number
    groundTransport: number
    meals: number
    total: number
  }
  agentNotes: string
  policyCompliance: boolean
  createdAt: Date
  bookedAt?: Date
}

export interface FlightSegment {
  airline: string
  flightNumber: string
  departure: {
    airport: string
    time: Date
  }
  arrival: {
    airport: string
    time: Date
  }
  seat: string
  cabin: string
  baggage: string
  cost: number
}

export interface HotelBooking {
  name: string
  address: string
  checkIn: Date
  checkOut: Date
  room: string
  nights: number
  costPerNight: number
  totalCost: number
}

export interface TransportBooking {
  type: string
  from: string
  to: string
  time: Date
  cost: number
}
