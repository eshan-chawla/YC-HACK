/**
 * Test fixture data for TripWeaver E2E tests.
 *
 * These are used to seed mock state and assert against expected UI content
 * without hitting real Gemini API or Convex in isolation tests.
 */

export const TEST_ADMIN = {
  email: 'admin@tripweaver-test.com',
  name: 'Test Admin',
  role: 'admin' as const,
}

export const TEST_EMPLOYEE = {
  email: 'employee@tripweaver-test.com',
  name: 'Sarah Chen',
  role: 'employee' as const,
  restrictions: {
    dietary: ['vegetarian'],
    seating: 'aisle',
  },
}

export const TEST_EVENT = {
  name: 'Stripe Sessions 2026',
  destination: 'SFO',
  departureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  returnDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString(),
  budgetPerEmployee: 2500,
  description: 'Annual Stripe conference',
}

/** Mock agent response for itinerary generation */
export const MOCK_ITINERARY_RESPONSE = `## Proposed Itinerary — Sarah Chen → Stripe Sessions 2026

**Flight (Outbound)**
- ✈️ UA 101 · JFK → SFO · May 15, 09:00 → 12:30 · Economy · $420

**Hotel**
- 🏨 Marriott Union Square · Check-in May 15 · 2 nights · $280/night = $560

**Ground Transport**
- 🚌 SFO → Hotel: $45

**Total Cost: $1,025** ✅ Within $2,500 budget

*Dietary note: Vegetarian meal requested on UA 101.*

Reply "Go ahead and book this itinerary as proposed." to confirm booking.`

/** Mock agent response for policy/budget queries */
export const MOCK_BUDGET_RESPONSE = `## Budget Compliance Report — Stripe Sessions 2026

| Employee | Estimated Cost | Budget | Status |
|---|---|---|---|
| Sarah Chen | $1,025 | $2,500 | ✅ Within budget |
| Mike Johnson | $890 | $2,500 | ✅ Within budget |

**Total event spend: $1,915 / $5,000 (38% used)**`

/** Mock agent response for pending trips query */
export const MOCK_TRIPS_RESPONSE = `## Pending Trips — Stripe Sessions 2026

2 trips awaiting itinerary generation:

1. **Sarah Chen** (Engineering) — JFK → SFO
2. **Mike Johnson** (Product) — LAX → SFO

Use \`generate_team_itineraries\` to generate all at once, or specify an employee name.`
