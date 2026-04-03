# TripWeaver v2 — Conference Demo Ready

## Problem Statement

TripWeaver was built for a hackathon and won 2nd place (Stripe prize track) at the Locus YC F25 Agentic Payments Hackathon. The architecture is sound, but ~40% of the visible demo flow runs on hardcoded mock data, critical features (employee change requests, admin approval, booking confirmation, direct messaging) are absent, and the UI reads as a hackathon project rather than a production platform. The target audience at Stripe Sessions — Stripe Startups leads, YC-backed founders, and Stripe engineers — will immediately recognize the gap. A single "John Smith / TW-12345" visible in the admin panel would undermine the entire demo.

## Evidence

- Admin trip detail page (`/admin/itineraries/[id]/trips/[tripId]/page.tsx` lines 21-82) uses entirely hardcoded `mockTripData` — real Convex data is never fetched
- Hotels are a hardcoded array in `lib/agent/itinerary-generator.ts` lines 19-25, not a real API
- Kiwi MCP falls back to mock flights ~50% of the time with no graceful UI signal
- Employee → Admin direct messaging is disabled: "Direct messages with team members are not yet available" (`components/Chat/ChatLayout.tsx` lines 96-104)
- Approval workflow is completely absent — no `changeRequests` table, no approval mutations
- Payment always sends $0.05 regardless of itinerary cost (`lib/agent/tool-executor.ts` line 112)
- Stripe Sessions is a real, time-boxed deadline with career stakes (target: Stripe New Grad PM role)

## Proposed Solution

Two parallel workstreams executed over 3 weeks:

**Workstream A — UI/UX Revamp**: Replace the hackathon aesthetic with a design language inspired by Stripe, Ramp, Brex, Cluely, and PostHog. Establish a proper design system (tokens, typography, spacing grid) then apply it systematically across landing page, auth flows, admin dashboard, and employee portal.

**Workstream B — Agent & Feature Completion**: Fix the core demo-breaking gaps — replace all mock data with real Convex data, complete the end-to-end booking flow (flights → hotel → rideshare/rental), implement employee change requests + admin approval, persist all chat types, add agent memory for personalization, and add a multi-source fallback chain for flight/hotel data so the demo survives Kiwi MCP downtime.

## Key Hypothesis

We believe a fully functional agentic travel platform with production-quality UI will demonstrate to Stripe Startups that AI agents can orchestrate complex multi-service workflows (flight + hotel + transport + payments) end-to-end — and that this pattern, built on Stripe's infrastructure, is the future of B2B travel.

We'll know we're right when: a Stripe judge can be onboarded as an employee, see a personalized itinerary generated for them in under 2 minutes, request a change, watch an admin approve it, and confirm the booking in a single click — without any visible mock data or broken flows.

## What We're NOT Building

- **Real payment charging** — demo stays at $0.05 Locus MCP amount; the booking "confirmation" is simulated
- **Mobile app** — web-only for Stripe Sessions
- **Real email notifications** — in-app notifications only
- **Multi-company/multi-tenant support** — single company demo context
- **Hardcoded mock as primary data source** — mock is only acceptable as last-resort fallback, clearly labeled

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| End-to-end demo flow completion | 100% (zero broken steps) | Manual walkthrough before event |
| Visible mock/hardcoded data | 0 instances in demo flow | Code review + walkthrough |
| Itinerary generation time | < 2 minutes per employee | Timed test with 3 employees |
| UI fidelity vs Stripe/Ramp reference | "Could be a real product" reaction | Peer review |
| Agent daily token budget respected | No runaway costs in demo | Usage dashboard in admin |
| Demo fallback resilience | Works even if Kiwi MCP is down | Test with Kiwi MCP disabled |

## Open Questions

- [ ] What rideshare/rental car APIs are accessible without enterprise agreements? (Uber Business API, Lyft Business, Hertz/Enterprise affiliate programs, or aggregators like Hopper for Business)
- [ ] What is the best secondary flight data source if Kiwi MCP fails? (Amadeus Self-Service API, Skyscanner Rapid API, or another MCP server)
- [ ] What is the exact Stripe Sessions date and format? (Booth? Talk? Informal demos?) — this affects how much we need to harden edge cases
- [ ] Should agent memory be stored in Convex (queryable, structured) or as a vector embedding? For 3-week timeline, structured Convex fields are safer
- [ ] What daily token limit is acceptable for demo usage without racking up costs? (Estimate: 50 agent turns/day = ~$2-5/day at Gemini pricing)

---

## Users & Context

**Primary User (Demo Context)**
- **Who**: Stripe Startups partnership lead or YC-backed founder, likely with technical background, evaluating agent-native product patterns
- **Current behavior**: Has seen dozens of hackathon demos; pattern-matches "impressive agent demo" vs "AI wrapper with mocked backend" within 30 seconds
- **Trigger**: Being onboarded as an employee user during the demo
- **Success state**: They request a change to their itinerary, see it routed to the admin, watch it get approved, and click "Confirm Booking" — and the experience feels like using Ramp or Brex for the first time

**Job to Be Done**
When I (admin) create a new corporate travel event, I want the AI agent to handle all the research, personalization, and booking logistics for each employee automatically, so I can focus entirely on the event itself instead of coordinating travel for 10+ people across different cities.

**Non-Users**
- Individual leisure travelers (this is B2B only)
- Enterprise IT/procurement teams (no SSO, SAML, or compliance workflows in v2)
- Finance teams doing reconciliation (expense reporting is out of scope)

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | UI/UX revamp to Stripe/Ramp/Brex aesthetic | Demo audience will judge product maturity in first 10 seconds |
| Must | Per-employee real itineraries (flights + hotel + transport) with zero visible mock data | Core demo claim — must be true |
| Must | Employee change request → Admin approval → Employee booking confirmation loop | Differentiates from "just a chat with flights" — shows full workflow orchestration |
| Must | Multi-source flight/hotel fallback chain (Kiwi → backup API → realistic mock) | Demo resilience — Kiwi MCP has 50% mock fallback rate |
| Must | All chat types persisted (employee↔agent, admin↔agent, employee↔admin) | Judges will look at message history |
| Should | Agent memory: learns from each employee's past itineraries for future personalization | Demonstrates longitudinal AI value, not just one-shot generation |
| Should | Daily token/prompt usage limits per user with admin visibility | Cost control + shows operational maturity |
| Should | Rideshare/rental car in itinerary (real API preferred, curated mock fallback) | Completes the "end-to-end" story |
| Could | Booking confirmation with realistic generated confirmation numbers | Makes confirmed bookings feel real |
| Could | Admin analytics dashboard showing travel spend by employee/event | Shows data value of the platform |
| Won't | Real email notifications | Not visible in demo context |
| Won't | Real payment charging | Risk + complexity with no demo benefit |
| Won't | Mobile app | Out of scope for v2 |

### MVP Scope

The minimum to validate the hypothesis at Stripe Sessions:
1. Landing page and auth flows look production-quality (no one should say "hackathon project")
2. Admin can create an event, agent generates 2-3 unique per-employee itineraries with real flight data
3. One employee can request a change, admin approves, employee confirms — end to end, no broken steps
4. Zero hardcoded mock data visible in the demo path

### User Flow (Critical Demo Path)

```
[ADMIN]
1. Signs in → lands on polished dashboard
2. Creates new travel event (destination, dates, budget tier, selects 2-3 employees)
3. Clicks "Send to Agent" → agent begins working
4. Watches real-time: agent searches flights for each employee's origin, checks budget compliance,
   selects hotels, adds rideshare to/from airport
5. Agent completes → each employee receives itinerary notification

[EMPLOYEE (judge is now the user)]
6. Receives notification: "Your itinerary for [Event] is ready"
7. Opens itinerary — sees personalized flight (from their city), hotel, car to hotel
8. Reads details, decides to request a change: "Can I get a window seat on the return flight?"
9. Submits change request → admin notified

[ADMIN]
10. Sees change request in inbox, reviews, approves
11. Agent updates itinerary with the change

[EMPLOYEE]
12. Sees updated itinerary notification
13. Clicks "Confirm & Book" → sees booking confirmation with confirmation number
14. Trip status moves to "Booked" ✓
```

---

## Technical Approach

**Feasibility**: HIGH — architecture is correct, gaps are in data layer and missing features

### Architecture Notes

- **Design system**: Establish CSS custom properties / Tailwind config tokens first; all UI work derives from these. Reference: `tailwind.config.ts` + `app/globals.css`
- **Schema additions**: Add `changeRequests` and `bookingConfirmations` tables to `convex/schema.ts`. No migration pain — Convex schema changes are additive
- **Agent memory**: Store as structured fields on `employees` table (`travelHistory: v.array(...)`, `inferredPreferences: v.object(...)`) rather than vector embeddings — simpler, queryable, achievable in 3 weeks
- **Multi-source fallback chain**: Kiwi MCP → Amadeus Self-Service API (free tier, 2000 calls/month) → Skyscanner Rapid API → curated realistic mock. Implement as a `FlightDataProvider` abstraction in `lib/agent/`
- **Fix mock data**: `app/admin/itineraries/[id]/trips/[tripId]/page.tsx` must be rewritten to use `useQuery(api.trips.getTripWithItinerary, { tripId })`
- **Token limits**: Add `rateLimits` usage tracking per user (table already exists in schema), enforce in `lib/agent/gemini-agent.ts` before calling Gemini
- **Rideshare/rental**: Research Uber Business API and Hertz/Enterprise affiliate APIs first; fall back to a structured mock with realistic pricing if B2B API access requires enterprise agreement

### Technical Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Kiwi MCP down during demo | HIGH (50% fallback rate observed) | Implement Amadeus as primary backup before demo week |
| Gemini latency makes demo feel slow | MEDIUM | Add streaming responses + real-time "agent is thinking" UI |
| 3-week solo timeline too tight | MEDIUM | Phases 2+3 run in parallel; UI revamp and functionality are independent; cut Phase 7 (agent memory) if needed |
| Rideshare API requires enterprise agreement | MEDIUM | Research week 1; if blocked, use structured realistic mock clearly labeled as "simulated" |
| Change request flow is complex to get right | LOW | Well-defined schema addition + clear mutation pattern following existing Convex conventions |

---

## Implementation Phases

<!--
  STATUS: pending | in-progress | complete
  PARALLEL: phases that can run concurrently
  DEPENDS: phases that must complete first
  PRP: link to generated plan file once created
-->

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Design System Foundation | Establish design tokens, typography scale, color system, spacing grid. Update `tailwind.config.ts`, `globals.css`. Revamp landing page and auth pages. | complete | - | - | `.claude/PRPs/plans/phase-1-design-system-foundation.plan.md` |
| 2 | Admin UI Revamp | Redesign dashboard, event management, itinerary list/detail. Fix admin trip detail page to use real Convex data (remove mockTripData entirely). | complete | with 3 | 1 | - |
| 3 | Employee UI Revamp | Redesign employee trips portal, trip detail view, profile page, notification center. | complete | with 2 | 1 | - |
| 4 | Multi-Source Data Layer | Research + implement flight data fallback chain (Kiwi → Amadeus → mock). Research rideshare/rental APIs. Add hotel data improvements. Implement `FlightDataProvider` abstraction. | in-progress | with 5 | 1 | - |
| 5 | Agent Flow Completion | Add booking confirmation flow with generated confirmation numbers. Add rideshare/rental car to itinerary generator. Wire all itinerary data to real Convex queries. Add `bookingConfirmations` table. | complete | with 4 | 2, 3 | - |
| 6 | Change Request & Approval Workflow | Add `changeRequests` table to schema. Employee UI to submit change requests. Admin approval inbox. Approval → itinerary update → employee notification loop. | complete | - | 4, 5 | - |
| 7 | Chat Persistence & Agent Memory | Ensure employee↔admin, employee↔agent, admin↔agent chats all persist to Convex. Add `travelHistory` and `inferredPreferences` to employee records. Agent uses history in itinerary generation prompts. | pending | with 8 | 5 | - |
| 8 | Cost Controls & Rate Limiting | Daily prompt/token limits per user using existing `rateLimits` table. Admin usage visibility. Graceful "limit reached" UX. Enforce in `gemini-agent.ts` before API call. | pending | with 7 | 5 | - |
| 9 | Demo Hardening | Seed realistic demo data (fictional company + 3 employees with varied profiles). End-to-end demo walkthrough test. Loading states, error states, edge case handling. Performance pass. Final UI polish. | pending | - | 6, 7, 8 | - |

### Phase Details

**Phase 1: Design System Foundation**
- **Goal**: Establish the visual language that makes TripWeaver look like Stripe/Ramp built it
- **Scope**: `tailwind.config.ts`, `app/globals.css`, `app/page.tsx` (landing), all `app/auth/` pages, `components/layout/` components (Sidebar, Topbar, AppShell, PageHeader)
- **Design references**: Stripe (trust, polish, micro-copy), Ramp/Brex (fintech data density), Cluely (dark minimal drama), PostHog (readable dark theme)
- **Key decisions**: Dark-first, Inter/Geist font, single emerald accent (existing brand preserved), 8px grid, card-based data surfaces
- **Success signal**: Landing page + login flow looks indistinguishable from a funded B2B SaaS

**Phase 2: Admin UI Revamp**
- **Goal**: Every admin screen looks production-quality; critical demo-breaker (mockTripData) is eliminated
- **Scope**: `/app/admin/` all pages, admin trip detail page rewritten to use `useQuery(api.trips.getTripWithItinerary)`, event detail page polished
- **Success signal**: Admin can click through entire event → itinerary → trip detail flow with zero hardcoded strings visible

**Phase 3: Employee UI Revamp**
- **Goal**: Employee experience feels like receiving a premium travel service, not a hackathon prototype
- **Scope**: `/app/employee/` all pages, trip detail with real itinerary data, notification center
- **Success signal**: A first-time user (demo judge) can navigate the employee portal intuitively without guidance

**Phase 4: Multi-Source Data Layer**
- **Goal**: Demo works reliably regardless of Kiwi MCP status
- **Scope**: `lib/agent/mcp-integration.ts` refactored with `FlightDataProvider` abstraction, Amadeus API integration, rideshare/rental research + integration or structured mock
- **Success signal**: Disabling Kiwi MCP does not break itinerary generation; backup source activates transparently

**Phase 5: Agent Flow Completion**
- **Goal**: End-to-end booking flow has no gaps — agent generates → employee sees real data → employee confirms → status updates correctly
- **Scope**: `convex/schema.ts` (add `bookingConfirmations`), `lib/agent/itinerary-generator.ts` (add transport), all trip detail pages connected to real data, booking confirmation mutation
- **Success signal**: Trip goes from `pending` → `generating` → `booked` with real data at each step; admin trip detail shows real employee name and generated confirmation number

**Phase 6: Change Request & Approval Workflow**
- **Goal**: The "agentic workflow orchestration" story is fully demonstrable — request → route → approve → update
- **Scope**: `convex/schema.ts` (add `changeRequests`), new mutations in `convex/trips.ts`, employee "Request Change" UI, admin approval inbox, agent re-generates itinerary on approval, notification dispatched
- **Success signal**: Demo judge submits a change request as employee, admin approves it, judge's itinerary updates in real time

**Phase 7: Chat Persistence & Agent Memory**
- **Goal**: Agent gets smarter with each interaction; all conversation history is preserved and visible
- **Scope**: Verify all 3 chat contexts persist to Convex, add `travelHistory` array to `employees` table, update `lib/agent/gemini-agent.ts` system prompt to include employee travel history context
- **Success signal**: Second itinerary generated for an employee reflects their previous preferences without being re-asked

**Phase 8: Cost Controls & Rate Limiting**
- **Goal**: Agent usage is metered and visible; demo can run all day without surprise API bills
- **Scope**: `lib/agent/gemini-agent.ts` (check rateLimits before each call), admin settings page showing usage, graceful "you've reached today's limit" response
- **Success signal**: Admin can see how many agent calls were made today; user hitting limit gets a clear message, not an error

**Phase 9: Demo Hardening**
- **Goal**: The exact 14-step demo flow works perfectly every time
- **Scope**: Demo data seed script, loading/skeleton states on all async operations, error boundaries, Kiwi MCP fallback tested, performance review, final UI polish pass
- **Success signal**: 5 consecutive end-to-end demo walkthroughs complete without a single broken step

### Parallelism Notes

- **Phases 2 + 3** run in parallel: admin and employee UI are separate routes with no shared new components
- **Phases 4 + 5** start in parallel: data layer research and agent flow completion touch different files (`mcp-integration.ts` vs trip detail pages)
- **Phases 7 + 8** run in parallel: chat/memory touches agent and schema; cost controls touches rate limiting layer — minimal overlap
- Phase 6 (approval workflow) is the critical path item that blocks Phase 9; prioritize it

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Agent memory storage | Structured Convex fields on `employees` | Vector embeddings (Pinecone/pgvector) | 3-week timeline; structured is queryable, no new infrastructure |
| Flight fallback chain | Kiwi → Amadeus → mock | Skyscanner only, Google Flights scraping | Amadeus has free tier (2000 calls/month), official API, good docs |
| Rideshare data | Research first; mock if no B2B API | Always mock | Real data preferred for demo authenticity; investigate Uber Business |
| Design direction | Dark-first, single emerald accent | Light theme | Existing brand + Cluely/PostHog reference aesthetic; dark feels more "agent-native" |
| Token limits | Convex `rateLimits` table (already exists) | External rate limiter | Zero new infrastructure, already in schema |
| Change request flow | Separate `changeRequests` table | Status field on `trips` | Clean separation, enables history, follows Convex patterns |
| Booking confirmation numbers | Generated (e.g., `TW-${timestamp}-${hash}`) | Real booking API numbers | Demo context; looks real, zero external dependency |

---

## Research Summary

### Market Context
Corporate travel incumbents (Navan $9.2B, TravelPerk, Concur/SAP) are booking UIs with AI suggestions bolted on — they still require human routing at every decision point. No current platform has a genuinely agentic loop where a single AI orchestrates search → compliance → multi-service booking → payment end-to-end. TripWeaver's MCP-composable agent architecture is architecturally differentiated. The Stripe Sessions audience will understand this distinction immediately because it mirrors how Stripe thinks about payments-as-a-primitive in agent workflows.

Design references share a common language: earned minimalism, strong typography hierarchy (Inter/Geist), dark backgrounds with precise accent colors, card-based data surfaces, no decorative gradients, micro-copy that builds trust.

### Technical Context
- **What works**: Gemini agent loop, Convex real-time schema, Kiwi MCP client, Clerk auth, all shadcn/ui components, budget compliance checks, event creation, trip auto-creation
- **Critical gap**: Admin trip detail page is 100% hardcoded mock data (`mockTripData` object, lines 21-82 in trip detail page)
- **Agent tool fidelity**: 5/9 tools use real Convex data; 4/9 fall back to mocks for flights/hotels/payment
- **Schema readiness**: All needed tables exist except `changeRequests` and `bookingConfirmations`
- **Kiwi MCP reliability**: ~50% real results, ~50% mock fallback due to transport errors

---

*Generated: 2026-04-02*
*Status: DRAFT — ready for implementation planning*
*Timeline: 3 weeks to Stripe Sessions*
