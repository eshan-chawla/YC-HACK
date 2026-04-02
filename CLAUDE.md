# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is TripWeaver

AI-powered corporate travel management platform. Admins create travel events, an AI agent (Gemini 2.5 Pro) generates personalized itineraries per employee, integrating with Kiwi.com for flights and Locus for payments via MCP (Model Context Protocol).

## Commands

```bash
# Development (runs Next.js + Convex in parallel)
pnpm dev

# Run frontend or backend separately
pnpm dev:frontend   # Next.js dev server
pnpm dev:backend    # Convex dev server

# Build
pnpm build

# Lint
pnpm lint

# Tests (Vitest)
pnpm test                          # All unit/integration tests
pnpm test:unit                     # Unit tests only
pnpm test:integration              # Integration tests only
pnpm test:ab                       # A/B comparison tests
pnpm test:coverage                 # With coverage report
pnpm vitest run tests/unit/agent   # Run a specific test directory
pnpm vitest run tests/unit/encryption.test.ts  # Single test file

# E2E (Playwright - requires running app)
pnpm test:e2e                      # Run all E2E tests
pnpm test:e2e:ui                   # Playwright UI mode

# Convex
pnpm convex:dev                    # Start Convex dev server
pnpm convex:deploy                 # Deploy to production
npx convex env set KEY value       # Set backend environment variable
```

Package manager is **pnpm**. Use `--legacy-peer-deps` if falling back to npm.

## Architecture

### Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4.1 + shadcn/ui
- **Backend**: Convex (serverless functions + real-time database)
- **Auth**: Clerk (identity) + Convex Auth (backend session validation)
- **AI**: Google Gemini 2.5 Pro with function calling
- **External APIs**: Kiwi.com MCP (flights), Locus MCP (payments)
- **Testing**: Vitest (unit/integration), Playwright (E2E)

### Data flow

```
Clerk (auth) → ConvexProviderWithClerk → Convex React hooks (useQuery/useMutation)
                                          ↕
                                    Convex serverless functions (convex/*.ts)
                                          ↕
                                    Convex real-time database
```

The AI agent flow:

```
User chat → API route → Gemini 2.5 Pro (function calling)
                              ↕
                        Tool executor (lib/agent/tool-executor.ts)
                              ↕
              ┌───────────────┼───────────────┐
        Kiwi MCP          Convex DB         Locus MCP
       (flights)      (employees/events)    (payments)
```

### Key directories

- `app/admin/` — Admin dashboard (itineraries, employees, policies, chat, settings)
- `app/employee/` — Employee portal (trips, profile)
- `app/auth/` — Login, signup, onboarding
- `convex/` — All backend logic. `schema.ts` defines the database. Each file exports queries/mutations.
- `lib/agent/` — AI agent: `gemini-agent.ts` (orchestrator), `mcp-integration.ts` (Kiwi/Locus clients), `tool-executor.ts` (routes function calls), `function-definitions.ts` (tool schemas), `budget-checker.ts`, `itinerary-generator.ts`
- `components/ui/` — shadcn/ui primitives (don't edit directly, use `npx shadcn@latest add`)
- `hooks/` — React hooks wrapping Convex queries (`useCurrentUser`, `useEmployees`, `useEvents`, etc.)

### Database tables (Convex)

Core tables in `convex/schema.ts`: `userProfiles`, `employees`, `events`, `trips`, `itineraries`, `conversations`, `messages`, `policies`, `notifications`, `auditLogs`, `rateLimits`, `eventInvitationOpens`.

- `userProfiles` — Clerk user ID → role (admin/employee), onboarding state
- `events` — Group travel events with destination, dates, budget, assigned employees
- `trips` — Individual employee assignment to an event (status: pending → generating → booked)
- `itineraries` — AI-generated travel plans cached by `cacheKey` with version tracking

### Auth model

Two roles: **admin** and **employee**. Clerk handles identity; Convex `auth.helpers.ts` provides `getClerkUserId()`, `getCurrentUser()`, `getCurrentUserOrNull()` for backend auth checks. User profiles are indexed by Clerk `userId`.

### Provider hierarchy

`ClerkProvider` → `ConvexProviderWithClerk` → `ThemeProvider` (in `components/Providers.tsx`)

### Path alias

`@/*` maps to the project root (configured in `tsconfig.json`).

## Environment variables

**Local `.env.local`**: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_APP_URL`

**Convex backend secrets** (set via `npx convex env set`): `GOOGLE_AI_API_KEY`, `KIWI_API_KEY`, `LOCUS_API_KEY`, `ENCRYPTION_KEY`, `AUTH_GOOGLE_CLIENT_ID`, `AUTH_GOOGLE_CLIENT_SECRET`

See `envdotexample` for the full template.

## Conventions

- TypeScript strict mode is enabled
- `next.config.mjs` has `ignoreBuildErrors: true` — type errors won't block builds but should still be fixed
- Convex functions use validators from `convex/values` (not Zod) for argument/return validation
- Forms use React Hook Form + Zod for client-side validation
- Timestamps are Unix timestamps (numbers), not ISO strings
- Sensitive data is encrypted with AES-256-GCM (`lib/encryption.ts`)
- shadcn/ui components live in `components/ui/` — add new ones via CLI, don't hand-write

## UI / Design System

TripWeaver targets a **calm, minimal, professional B2B SaaS** aesthetic:

- 8px spacing grid; strong typography hierarchy; brand color used sparingly (CTAs, active states, highlights only)
- Keep the existing TripWeaver logo and brand colors — don't change them
- Framer Motion is for subtle micro-interactions only: sidebar collapse/expand, page transition fade, dialog open/close. Use CSS for everything else.
- Layout system lives in `components/layout/`: `AppShell`, `Sidebar`, `Topbar`, `PageHeader`, `StatCard`, `EmptyState`, `Skeletons`

**Frontend security constraints:**
- Frontend RBAC is UX-only — access control must be enforced by Convex backend, never frontend-only checks
- Never use `dangerouslySetInnerHTML` without explicit sanitization (DOM XSS risk)
- Never store tokens or PII in `localStorage`; don't expose internal IDs that shouldn't be visible in client bundles

## Deployment (Vercel)

1. Push to GitHub → import project in Vercel
2. Set environment variables in Vercel dashboard (Production + Preview + Development):
   - `NEXT_PUBLIC_CONVEX_URL`
   - `ANTHROPIC_API_KEY` (if using Claude SDK features)
   - `LOCUS_API_KEY`, `KIWI_API_KEY` (for MCP integrations)
3. Deploy Convex backend: `npx convex deploy`
4. Verify `pnpm-lock.yaml` is committed — Vercel requires it for pnpm builds

**Serverless limitation:** The Claude Code executable cannot run in Vercel serverless. The agent detects this automatically and disables code-execution features; chat and MCP tool usage (flights, payments) still work. After deploying, test the chat interface at `/employee`.
