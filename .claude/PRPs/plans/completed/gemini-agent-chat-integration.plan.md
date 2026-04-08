# Plan: Gemini Agent Chat Integration

## Summary
The Gemini agent is built and the chat UI exists, but the two are not properly connected. `lib/agent.ts` calls `chatWithGeminiAgent` with `dbContext = undefined`, so every tool call that requires database access (get_event_details, list_pending_trips, generate_itinerary, check_budget_compliance) fails silently. This plan wires up the DatabaseContext using Convex's `fetchQuery`/`fetchMutation`, adds role-differentiated system prompts, creates the missing employee chat page, and makes the Approve/Reject proposal buttons functional.

## User Story
As an admin or employee, I want to chat with the TripWeaver AI agent and have it actually look up real event data, generate real itineraries using Kiwi.com, check budgets, and process payments — not fail silently because the database context was never wired up.

## Problem → Solution
Agent is called with `dbContext = undefined` → all DB tool calls throw or return mock data → Wire `DatabaseContext` using `fetchQuery`/`fetchMutation` from `convex/nextjs` authenticated with the Clerk session token.

## Metadata
- **Complexity**: Large
- **Source PRD**: `.claude/PRPs/prds/tripweaver-v2-conference-demo.prd.md`
- **PRD Phase**: Phase 5 — Agent Flow Completion
- **Estimated Files**: 8 files (2 create, 6 modify)

---

## UX Design

### Before
```
┌─────────────────────────────────────────────────┐
│ Admin Chat: Types "Generate itinerary for       │
│ event EVT123 for Sarah"                         │
│                                                 │
│ Agent: calls generate_itinerary tool            │
│ → tool-executor.ts calls dbContext.getEvent()   │
│ → dbContext is undefined                        │
│ → falls back to mock data (JFK→LHR, $150/night) │
│ → returns generic fake itinerary                │
│                                                 │
│ Employee: No /employee/chat page exists          │
│ Approve/Reject buttons: no onClick, do nothing  │
└─────────────────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────────────────┐
│ Admin Chat: Types "Generate itinerary for       │
│ event EVT123 for Sarah"                         │
│                                                 │
│ Agent: calls generate_itinerary tool            │
│ → dbContext.getEvent('EVT123') → real event     │
│ → dbContext.getEmployee('sarah-id') → real emp  │
│ → Kiwi flight search with real budget           │
│ → returns real itinerary + cost breakdown       │
│                                                 │
│ Employee: /employee/chat exists and works       │
│ Approve button: triggers trip status update     │
│ Admin prompt: team-aware, policy-override focus │
│ Employee prompt: personal travel, preferences   │
└─────────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Agent DB tools | Always undefined context, mock fallback | Real Convex data via fetchQuery | Uses Clerk auth token |
| Employee chat | No page exists → 404 | `/employee/chat` page works | Mirrors admin pattern |
| Admin system prompt | Generic travel assistant | Team management, policy override framing | Role passed from ChatInterface |
| Employee system prompt | Generic travel assistant | Personal trip, preferences, booking focus | Role passed from ChatInterface |
| Approve button | No onClick, decorative | Marks trip status → 'booked' | Via Convex mutation |
| Reject button | No onClick, decorative | Appends rejection note to chat | Re-opens dialogue |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `lib/agent.ts` | all | The server action to fix — add auth + dbContext |
| P0 | `lib/agent/tool-executor.ts` | 1-65 | DatabaseContext interface — must match exactly |
| P0 | `lib/agent/gemini-agent.ts` | 45-122 | System prompt builder — extend for roles |
| P1 | `components/Chat/ChatInterface.tsx` | 1-50, 126-148 | How chatWithAgent is called, history format |
| P1 | `convex/employees.ts` | 48-60 | `get` query signature — already exists |
| P1 | `convex/events.ts` | 1-60 | Need to add `getById` query |
| P1 | `convex/trips.ts` | 1-80 | Need to add `getById` + `listFiltered` queries |
| P2 | `app/admin/chat/page.tsx` | all | Pattern to mirror for employee page |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| convex/nextjs fetchQuery | https://docs.convex.dev/client/react/nextjs | `fetchQuery(api.foo.bar, args, { token })` — token from Clerk |
| Clerk auth in server actions | https://clerk.com/docs/references/nextjs/auth | `const { getToken } = await auth()` then `getToken({ template: 'convex' })` |
| Convex validators | https://docs.convex.dev/api/modules/values | Use `v.id('tableName')` not strings for Convex IDs |

---

## Patterns to Mirror

### NAMING_CONVENTION
```typescript
// SOURCE: convex/events.ts:18
export const list = query({
  args: { status: v.optional(...), limit: v.optional(v.number()) },
  handler: async (ctx, args) => { ... }
})

// SOURCE: convex/employees.ts:50
export const get = query({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => { ... }
})
```

### CONVEX_AUTH_PATTERN
```typescript
// SOURCE: convex/auth.helpers.ts:22-36
export async function getCurrentUserOrNull(ctx) {
  const userId = await getClerkUserId(ctx)
  if (!userId) return null
  return ctx.db.query("userProfiles").withIndex("by_userId", q => q.eq("userId", userId)).first()
}
// All queries call requireAuth(ctx) or getCurrentUser(ctx) first
```

### SERVER_ACTION_PATTERN
```typescript
// SOURCE: lib/agent.ts:1-3
'use server'
import { chatWithGeminiAgent, AgentMessage, EmployeeContext } from './agent/gemini-agent'
// Server actions: 'use server' at top, async functions only
```

### FETCH_QUERY_PATTERN (for DatabaseContext)
```typescript
// Pattern: convex/nextjs server-side data fetching with auth
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { auth } from '@clerk/nextjs/server'
import { api } from '@/convex/_generated/api'

const { getToken } = await auth()
const token = (await getToken({ template: 'convex' })) ?? undefined
// token passed as third arg to fetchQuery/fetchMutation
await fetchQuery(api.events.getById, { id: eventId as Id<'events'> }, { token })
```

### ERROR_HANDLING
```typescript
// SOURCE: lib/agent.ts:73-98
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
  if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
    return { content: 'The AI service is temporarily rate limited...', paymentCompleted: false }
  }
  return { content: `I encountered an issue: ${errorMessage}...`, paymentCompleted: false }
}
```

### CONVEX_QUERY_PATTERN
```typescript
// SOURCE: convex/employees.ts:50-60
export const get = query({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const employee = await ctx.db.get(args.id)
    if (user.role === "employee" && user.employeeId !== args.id) {
      throw new Error("Unauthorized: Cannot view other employees")
    }
    return employee
  },
})
```

### ADMIN_PAGE_PATTERN
```typescript
// SOURCE: app/admin/chat/page.tsx:1-29
'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { ChatLayout } from '@/components/Chat/ChatLayout'

function AdminChatContent() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('conversationId') as Id<'conversations'> | null
  return (
    <AppShell role="admin">
      <div className="h-[calc(100vh-10rem)]">
        <ChatLayout role="admin" initialConversationId={conversationId ?? undefined} />
      </div>
    </AppShell>
  )
}
// Wrapped in <Suspense> for useSearchParams
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `convex/events.ts` | UPDATE | Add `getById` query (single event by ID) |
| `convex/trips.ts` | UPDATE | Add `getById` query + `listFiltered` query |
| `lib/agent.ts` | UPDATE | Build `DatabaseContext` using fetchQuery; pass role to prompt |
| `lib/agent/gemini-agent.ts` | UPDATE | Add role-aware system prompt builder function |
| `lib/agent/tool-executor.ts` | UPDATE | Add `updateTrip` and `createItinerary` to DatabaseContext implementation |
| `components/Chat/ChatInterface.tsx` | UPDATE | Pass `role` to `chatWithAgent`; wire Approve/Reject buttons |
| `app/employee/chat/page.tsx` | CREATE | Employee AI chat page mirroring admin pattern |
| `app/employee/page.tsx` | UPDATE | Add "Chat with AI" navigation link |

## NOT Building
- Direct employee↔admin messaging (marked "coming soon" in ChatLayout.tsx — out of scope)
- Streaming responses (current polling/one-shot pattern is fine for now)
- Hotel/transport real integrations (Kiwi covers flights; hotel uses mock cost, acceptable for demo)
- Change request workflow via chat (that's Phase 6 — separate)

---

## Step-by-Step Tasks

### Task 1: Add `events.getById` Convex query
- **ACTION**: Add a `getById` query to `convex/events.ts`
- **IMPLEMENT**:
  ```typescript
  export const getById = query({
    args: { id: v.id("events") },
    handler: async (ctx, args) => {
      const user = await requireAuth(ctx)
      const event = await ctx.db.get(args.id)
      if (!event) return null
      // Employees can only see events they're assigned to
      if (user.role === "employee" && user.employeeId) {
        const trips = await ctx.db
          .query("trips")
          .withIndex("by_eventId_employeeId", (q) =>
            q.eq("eventId", args.id).eq("employeeId", user.employeeId!)
          )
          .first()
        if (!trips) throw new Error("Unauthorized: Not assigned to this event")
      }
      return event
    },
  })
  ```
- **MIRROR**: CONVEX_QUERY_PATTERN
- **IMPORTS**: `v` from `convex/values`, `requireAuth` from `./auth.helpers`
- **GOTCHA**: Convex `ctx.db.get()` takes an `Id<'events'>` typed value — the `args.id` validator `v.id("events")` ensures this automatically
- **VALIDATE**: `pnpm build` passes; `api.events.getById` appears in generated types

### Task 2: Add `trips.getById` and `trips.listFiltered` Convex queries
- **ACTION**: Add two queries to `convex/trips.ts`
- **IMPLEMENT**:
  ```typescript
  export const getById = query({
    args: { id: v.id("trips") },
    handler: async (ctx, args) => {
      const user = await requireAuth(ctx)
      const trip = await ctx.db.get(args.id)
      if (!trip) return null
      if (user.role === "employee" && trip.employeeId !== user.employeeId) {
        throw new Error("Unauthorized: Cannot view another employee's trip")
      }
      return trip
    },
  })

  export const listFiltered = query({
    args: {
      eventId: v.optional(v.id("events")),
      employeeId: v.optional(v.id("employees")),
      status: v.optional(v.union(
        v.literal("pending"), v.literal("generating"), v.literal("booked"),
        v.literal("in_progress"), v.literal("failed"), v.literal("completed"),
        v.literal("cancelled")
      )),
    },
    handler: async (ctx, args) => {
      const user = await requireAuth(ctx)
      let q
      if (args.eventId) {
        q = ctx.db.query("trips").withIndex("by_eventId", (idx) => idx.eq("eventId", args.eventId!))
      } else if (args.employeeId) {
        q = ctx.db.query("trips").withIndex("by_employeeId", (idx) => idx.eq("employeeId", args.employeeId!))
      } else {
        q = ctx.db.query("trips")
      }
      const trips = await q.collect()
      const filtered = args.status ? trips.filter((t) => t.status === args.status) : trips
      if (user.role === "employee") {
        return filtered.filter((t) => t.employeeId === user.employeeId)
      }
      return filtered
    },
  })
  ```
- **MIRROR**: CONVEX_QUERY_PATTERN
- **IMPORTS**: `v`, `requireAuth`
- **VALIDATE**: `pnpm build` passes; both appear in generated types

### Task 3: Add role-aware system prompt to `gemini-agent.ts`
- **ACTION**: Add an `AdminSystemAddendum` constant and update `buildSystemPrompt` to accept a role
- **IMPLEMENT**: Add after the `SYSTEM_PROMPT` constant (line 70):
  ```typescript
  const ADMIN_SYSTEM_ADDENDUM = `

  ## Admin Capabilities
  You are speaking with a **travel admin**. You have full access to:
  - All employee profiles, restrictions, and travel history
  - All events and their budgets
  - Team-wide itinerary generation (generate_team_itineraries tool)
  - Budget compliance checking across all trips
  - Policy override authority — you can approve exceptions

  When the admin says "generate itineraries for event X" or "book all trips for [event]",
  use generate_team_itineraries. Always show cost summaries grouped by employee.
  Flag any policy violations clearly with the specific policy rule breached.`

  const EMPLOYEE_SYSTEM_ADDENDUM = `

  ## Employee Mode
  You are speaking with a **traveling employee**. Focus on:
  - Their personal upcoming trip only
  - Their specific restrictions and preferences (shown in context above)
  - Explaining flight options clearly with pros/cons
  - Confirming before any booking action
  - Making change requests feel easy — offer to draft one if they're unhappy`
  ```

  Update the function signature:
  ```typescript
  export function buildSystemPrompt(employeeContext?: EmployeeContext, role?: 'admin' | 'employee'): string {
    let prompt = SYSTEM_PROMPT
    if (role === 'admin') prompt += ADMIN_SYSTEM_ADDENDUM
    else if (role === 'employee') prompt += EMPLOYEE_SYSTEM_ADDENDUM
    // ... existing employee context appending logic unchanged
    if (!employeeContext) return prompt
    // rest of function unchanged
  }
  ```
- **MIRROR**: Existing `buildSystemPrompt` function pattern (lines 75-122)
- **GOTCHA**: The function is not exported currently — export it or update the call site in `chatWithGeminiAgent` to accept a role param
- **VALIDATE**: TypeScript compiles; admin chat shows team-focused prompt behavior

### Task 4: Thread `role` through `chatWithGeminiAgent`
- **ACTION**: Add `role` parameter to `chatWithGeminiAgent` and pass it to `buildSystemPrompt`
- **IMPLEMENT**: In `lib/agent/gemini-agent.ts`, update the function signature at line 136:
  ```typescript
  export async function chatWithGeminiAgent(
    userMessage: string,
    chatHistory: AgentMessage[] = [],
    dbContext?: DatabaseContext,
    employeeContext?: EmployeeContext,
    role?: 'admin' | 'employee'  // ADD THIS
  ): Promise<AgentResponse> {
    // ...
    systemInstruction: buildSystemPrompt(employeeContext, role),  // PASS ROLE
  ```
- **MIRROR**: Existing function signature pattern
- **VALIDATE**: No TypeScript errors (optional param, backward compatible)

### Task 5: Build `DatabaseContext` in `lib/agent.ts` and pass `role`
- **ACTION**: This is the core fix. Import fetchQuery/fetchMutation, get Clerk token, build dbContext, pass role
- **IMPLEMENT**: Replace the file content (keeping `'use server'` and error handling patterns):
  ```typescript
  'use server'

  import { fetchQuery, fetchMutation } from 'convex/nextjs'
  import { auth } from '@clerk/nextjs/server'
  import { api } from '@/convex/_generated/api'
  import type { Id } from '@/convex/_generated/dataModel'
  import { chatWithGeminiAgent } from './agent/gemini-agent'
  import type { AgentMessage, EmployeeContext } from './agent/gemini-agent'
  import type { DatabaseContext } from './agent/tool-executor'

  export interface SerializedChatMessage {
    role: 'user' | 'agent'
    content: string
    timestamp: string
    paymentCompleted?: boolean
  }

  export interface AgentResponse {
    content: string
    paymentCompleted: boolean
  }

  export async function chatWithAgent(
    userMessage: string,
    chatHistory: SerializedChatMessage[],
    employeeContext?: EmployeeContext,
    role?: 'admin' | 'employee'
  ): Promise<AgentResponse> {
    try {
      if (!process.env.GOOGLE_AI_API_KEY) {
        return {
          content: 'Configuration error: Google AI API key is not configured.',
          paymentCompleted: false,
        }
      }

      // Get Clerk → Convex auth token for authenticated DB queries
      const { getToken } = await auth()
      const token = (await getToken({ template: 'convex' })) ?? undefined

      // Build DatabaseContext — all methods use the user's auth token
      const dbContext: DatabaseContext = {
        getEvent: async (eventId) =>
          fetchQuery(api.events.getById, { id: eventId as Id<'events'> }, { token }),

        getEmployee: async (employeeId) =>
          fetchQuery(api.employees.get, { id: employeeId as Id<'employees'> }, { token }),

        getTrip: async (tripId) =>
          fetchQuery(api.trips.getById, { id: tripId as Id<'trips'> }, { token }),

        listTrips: async ({ eventId, employeeId, status }) =>
          fetchQuery(
            api.trips.listFiltered,
            {
              eventId: eventId as Id<'events'> | undefined,
              employeeId: employeeId as Id<'employees'> | undefined,
              status: status as any,
            },
            { token }
          ),

        updateTrip: async (tripId, data) => {
          await fetchMutation(
            api.trips.update,
            { id: tripId as Id<'trips'>, ...(data as object) },
            { token }
          )
        },

        createItinerary: async (data) =>
          fetchMutation(api.itineraries.create, data as any, { token }),
      }

      const geminiHistory: AgentMessage[] = chatHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp).getTime(),
      }))

      const response = await chatWithGeminiAgent(
        userMessage,
        geminiHistory,
        dbContext,
        employeeContext,
        role
      )

      return {
        content: response.content,
        paymentCompleted: response.paymentTriggered ?? false,
      }
    } catch (error) {
      // ... existing error handling pattern unchanged
    }
  }
  ```
- **MIRROR**: SERVER_ACTION_PATTERN, FETCH_QUERY_PATTERN, ERROR_HANDLING
- **IMPORTS**: `fetchQuery`, `fetchMutation` from `convex/nextjs`; `auth` from `@clerk/nextjs/server`; `api` from `@/convex/_generated/api`; `Id` from `@/convex/_generated/dataModel`
- **GOTCHA**: `convex/nextjs` is the correct subpath for server-side usage; `convex/browser` `ConvexHttpClient` is NOT needed here. The token may be `null` if Clerk session is not set up — handle with `?? undefined`.
- **GOTCHA**: `api.trips.update` and `api.itineraries.create` may not exist yet — add them in next tasks or provide no-op stubs that log instead of failing (tool calls that use them will gracefully error in the agent's tool results).
- **VALIDATE**: Chat with admin asking "what events do we have?" should trigger `get_event_details` tool and return real data

### Task 6: Update `ChatInterface.tsx` to pass `role` and wire buttons
- **ACTION**: Pass `role` to `chatWithAgent`; add onClick handlers to Approve/Reject buttons
- **IMPLEMENT**:
  1. Update the `chatWithAgent` call (line 127) to include `role`:
     ```typescript
     const agentResponse = await chatWithAgent(
       userMessage,
       historyForAgent,
       employeeMemory ?? undefined,
       role   // ADD THIS
     )
     ```
  2. Add a `useMutation` for trip status update near the top of the component:
     ```typescript
     const updateTrip = useMutation(api.trips.update)
     ```
  3. Replace the decorative Approve button (line 242) with:
     ```typescript
     <Button
       size="sm"
       className="text-xs h-8 gap-1.5"
       onClick={async () => {
         // Extract tripId from the proposal message if present
         // For now: surface a toast that booking is confirmed
         // Full implementation: parse tripId from msg.content or from agent metadata
       }}
     >
       <Check className="w-3.5 h-3.5" /> Approve
     </Button>
     ```
  4. Replace the decorative Reject button with:
     ```typescript
     <Button
       size="sm" variant="outline"
       className="text-xs h-8 gap-1.5 text-destructive hover:text-destructive"
       onClick={() => setMessage('I want to request a revision to this itinerary: ')}
     >
       <X className="w-3.5 h-3.5" /> Request Revision
     </Button>
     ```
     Note: The Reject button pre-fills the input so the user can articulate what they want changed. A full implementation would create a `changeRequest` Convex record.
- **MIRROR**: ADMIN_PAGE_PATTERN for role usage
- **GOTCHA**: `api.trips.update` mutation may not exist — check trips.ts and add it in Task 7 if missing. For demo, the Approve button can simply fire a `toast.success('Itinerary approved!')` using `sonner` (already installed) and the Reject pre-fill is sufficient.
- **VALIDATE**: Clicking Reject pre-fills the message input. Role context is passed through to the agent.

### Task 7: Add `trips.update` mutation (if missing) and verify `itineraries.create`
- **ACTION**: Check `convex/trips.ts` for an `update` mutation; add if missing
- **IMPLEMENT**: Add to `convex/trips.ts`:
  ```typescript
  export const update = mutation({
    args: {
      id: v.id("trips"),
      status: v.optional(v.union(
        v.literal("pending"), v.literal("generating"), v.literal("booked"),
        v.literal("in_progress"), v.literal("failed"), v.literal("completed"),
        v.literal("cancelled")
      )),
      agentNotes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
      await requireAdmin(ctx)
      const { id, ...updates } = args
      await ctx.db.patch(id, { ...updates, updatedAt: Date.now() })
      return id
    },
  })
  ```
- **MIRROR**: CONVEX_QUERY_PATTERN (mutation variant using `ctx.db.patch`)
- **GOTCHA**: Only admin can update trip status (employee submits change requests instead)
- **VALIDATE**: `api.trips.update` appears in generated types

### Task 8: Create `app/employee/chat/page.tsx`
- **ACTION**: Create the employee chat page
- **IMPLEMENT**:
  ```typescript
  'use client'

  import { Suspense } from 'react'
  import { useSearchParams } from 'next/navigation'
  import { AppShell } from '@/components/layout/AppShell'
  import { ChatLayout } from '@/components/Chat/ChatLayout'
  import type { Id } from '@/convex/_generated/dataModel'

  function EmployeeChatContent() {
    const searchParams = useSearchParams()
    const conversationId = searchParams.get('conversationId') as Id<'conversations'> | null

    return (
      <AppShell role="employee">
        <div className="h-[calc(100vh-10rem)]">
          <ChatLayout role="employee" initialConversationId={conversationId ?? undefined} />
        </div>
      </AppShell>
    )
  }

  export default function EmployeeChatPage() {
    return (
      <Suspense fallback={<AppShell role="employee"><div className="h-[calc(100vh-10rem)]" /></AppShell>}>
        <EmployeeChatContent />
      </Suspense>
    )
  }
  ```
- **MIRROR**: ADMIN_PAGE_PATTERN exactly
- **GOTCHA**: `AppShell` must accept `role="employee"` — verify in `components/layout/AppShell.tsx`; it already does based on CLAUDE.md
- **VALIDATE**: Navigate to `/employee/chat` — the chat UI loads with no 404

### Task 9: Add chat navigation link to employee dashboard
- **ACTION**: Add "Chat with AI" link to `app/employee/page.tsx`
- **IMPLEMENT**: Verify the employee dashboard has a navigation link or card that goes to `/employee/chat`. If not, add a simple Link button to the existing page layout using the same card/stat-card pattern from `components/layout/`.
- **MIRROR**: Check `app/employee/page.tsx` for the existing card/navigation pattern
- **VALIDATE**: Employee dashboard has a clickable path to `/employee/chat`

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `chatWithAgent` with no API key | Empty GOOGLE_AI_API_KEY | Returns config error string, no throw | Yes |
| `chatWithAgent` with role='admin' | message + role | System prompt contains "travel admin" text | No |
| `chatWithAgent` with role='employee' | message + role | System prompt contains "traveling employee" text | No |
| `events.getById` — valid ID | Event ID user is authorized for | Event object returned | No |
| `events.getById` — unauthorized employee | Event ID not in their trips | Throws "Unauthorized" | Yes |
| `trips.listFiltered` with status | status='pending' | Only pending trips returned | No |

### Edge Cases Checklist
- [ ] `auth().getToken()` returns `null` (user not authenticated) — token becomes `undefined`, fetchQuery uses unauthenticated request, Convex `requireAuth` throws → agent catches and returns error message
- [ ] `GOOGLE_AI_API_KEY` not set → early return with config error (existing behavior preserved)
- [ ] Tool call to `get_event_details` for non-existent event ID → fetchQuery returns null → tool result is null → Gemini handles gracefully
- [ ] Employee tries to access another employee's trip via the agent → `trips.getById` throws "Unauthorized" → tool result has error → agent explains they don't have access
- [ ] Rate limit exceeded → existing rate limit check in `ChatInterface.tsx` fires first (before agent call)

---

## Validation Commands

### Static Analysis
```bash
pnpm build
```
EXPECT: Zero type errors (note: `ignoreBuildErrors: true` in next.config.mjs, but fix errors anyway)

### Type Check
```bash
npx tsc --noEmit
```
EXPECT: Zero errors

### Lint
```bash
pnpm lint
```
EXPECT: No new lint errors

### Dev Server Smoke Test
```bash
pnpm dev
```
Then manually:
1. Log in as admin → go to `/admin/chat` → ask "What events do we have?" → agent should call `get_event_details` tool and return real data
2. Log in as employee → go to `/employee/chat` → page loads without 404
3. Ask "What are my upcoming trips?" → agent should call `list_pending_trips` with employee context

### Manual Validation
- [ ] Admin chat: "Show me all pending trips" → agent returns real trip list (not mock)
- [ ] Admin chat: "Generate an itinerary for event [real event ID]" → agent calls `generate_itinerary` with real event data
- [ ] Employee chat: page loads at `/employee/chat`
- [ ] Employee chat: "What restrictions do I have?" → agent mentions real restrictions from `employeeMemory`
- [ ] Reject button in admin chat: pre-fills input with revision prefix
- [ ] No console errors about `dbContext is undefined`

---

## Acceptance Criteria
- [ ] `chatWithGeminiAgent` receives a populated `DatabaseContext` (not undefined) on every call
- [ ] Admin asking about events gets real Convex data in the response
- [ ] `/employee/chat` page loads and renders ChatLayout
- [ ] Employee chat uses employee-focused system prompt addendum
- [ ] Admin chat uses admin-focused system prompt addendum
- [ ] Reject button pre-fills message input (enables revision dialogue)
- [ ] `pnpm build` and `npx tsc --noEmit` pass

## Completion Checklist
- [ ] `convex/events.ts` — `getById` query added
- [ ] `convex/trips.ts` — `getById` and `listFiltered` queries added; `update` mutation added
- [ ] `lib/agent.ts` — `DatabaseContext` built with fetchQuery/fetchMutation + Clerk token
- [ ] `lib/agent.ts` — `role` parameter added to `chatWithAgent`
- [ ] `lib/agent/gemini-agent.ts` — role addenda constants added; `buildSystemPrompt` accepts role
- [ ] `lib/agent/gemini-agent.ts` — `chatWithGeminiAgent` accepts and threads `role`
- [ ] `components/Chat/ChatInterface.tsx` — `role` passed to `chatWithAgent`
- [ ] `components/Chat/ChatInterface.tsx` — Reject button pre-fills input
- [ ] `app/employee/chat/page.tsx` — created and working
- [ ] No hardcoded values; all IDs flow from real Convex data

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `getToken({ template: 'convex' })` returns null in dev | Medium | High — all DB calls fail silently | Log a warning; check Clerk JWT template is configured |
| `convex/nextjs` `fetchQuery` not available in `'use server'` files | Low | High — entire plan fails | Fallback: use `ConvexHttpClient` from `convex/browser` with setAuth |
| `api.itineraries.create` mutation doesn't exist | High | Low — only affects itinerary persistence | The agent still generates the itinerary object; persistence can be added in a follow-up |
| Gemini `gemini-2.5-pro` model name changed in SDK | Low | Medium — agent throws 404 | Use `gemini-2.0-flash` as fallback if `gemini-2.5-pro` fails |

## Notes
- **Auth note**: TripWeaver uses `@convex-dev/auth` (not Convex's built-in Clerk integration). The Clerk → Convex token flow requires a JWT template named `convex` in the Clerk dashboard. Verify this exists at clerk.com/dashboard → JWT Templates.
- **`api.trips.update` vs `api.trips.patch`**: The Convex pattern uses `ctx.db.patch()` internally. The exported mutation name is up to us — use `update` to match the `DatabaseContext` interface's `updateTrip` method name.
- **Demo safety**: The `process_payment` tool already caps amounts at $0.05 for demo safety. The `DatabaseContext` wiring doesn't change this — it only enables real data reads.
- **Itinerary persistence**: The `createItinerary` method in the `DatabaseContext` calls `api.itineraries.create`. If this Convex mutation doesn't exist, the tool will return an error but the agent's text response (the formatted itinerary) will still be shown to the user. The itinerary generation UX works; only DB persistence fails.
