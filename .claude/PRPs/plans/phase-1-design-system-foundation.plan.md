# Plan: Phase 1 — Design System Foundation

## Summary
Establish the visual language and token consistency that makes TripWeaver look like Stripe/Ramp built it. This plan covers extending `globals.css` with missing utility tokens, extracting duplicated Clerk appearance config into a shared module, replacing all hardcoded `bg-[#020617]` with semantic tokens across 7 files, and making targeted polish improvements to 5 layout components.

## User Story
As a Stripe Sessions judge onboarding as a demo user, I want the landing page and auth flow to feel production-quality within 10 seconds of loading, so that I engage with the AI demo rather than mentally filing TripWeaver as "another hackathon project."

## Problem → Solution
Landing page and all auth pages use `bg-[#020617]` hardcoded directly (7 files, 14+ occurrences) instead of `bg-background`. Clerk appearance config is copy-pasted across 4 files. StatCard has a bouncy translate hover that signals hackathon polish. EmptyState has no entrance animation. PageHeader has no breadcrumb support. → Replace all hardcoded colors with semantic tokens, centralize Clerk theme, remove bouncy hover, add subtle animations where missing.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/PRPs/prds/tripweaver-v2-conference-demo.prd.md`
- **PRD Phase**: Phase 1 — Design System Foundation
- **Estimated Files**: 11 files modified, 1 file created

---

## UX Design

### Before
```
┌──────────────────────────────────────────────────┐
│ Landing Page:                                    │
│  - bg-[#020617] hardcoded (bypasses CSS tokens)  │
│  - Feature cards bg-[#020617] on hover           │
│  - Footer says "Not a production product"        │
│                                                  │
│ Auth Pages (login, signup×2, select-role):       │
│  - bg-[#020617] hardcoded in each file           │
│  - Clerk appearance copy-pasted in 4 files       │
│                                                  │
│ StatCard:                                        │
│  - hover:-translate-y-0.5 (bouncy, toy-like)     │
│                                                  │
│ EmptyState:                                      │
│  - No entrance animation                         │
│                                                  │
│ PageHeader:                                      │
│  - No breadcrumb slot                            │
└──────────────────────────────────────────────────┘
```

### After
```
┌──────────────────────────────────────────────────┐
│ All pages: bg-background (semantic, theme-aware) │
│ Clerk theme: single source of truth              │
│ globals.css: typography scale + duration tokens  │
│                                                  │
│ StatCard: shadow-only hover (calm, B2B-quality)  │
│ EmptyState: motion fade-in on mount              │
│ PageHeader: optional breadcrumb slot             │
│                                                  │
│ Footer: "Built for Stripe Sessions 2026"         │
│ (removes "Not a production product" signal)      │
└──────────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| StatCard hover | shadow + translate-y (-0.5px) | shadow only | Less toy-like for B2B |
| EmptyState mount | instant appear | fade-in (opacity 0→1, 300ms) | Subtle, not distracting |
| Auth page background | `bg-[#020617]` inline | `bg-background` token | Functionally same, semantically correct |
| Clerk form | inline appearance object (×4) | imported `clerkDarkAppearance` | DRY, single source of truth |
| PageHeader | title + description + actions | + optional breadcrumb slot | Needed for admin sub-pages (Phase 2) |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 (critical) | `app/globals.css` | 1-167 | All token definitions — must understand before adding new ones |
| P0 (critical) | `app/auth/login/page.tsx` | 42-118 | Auth page shell pattern to replicate in all auth pages |
| P1 (important) | `app/page.tsx` | 88-116 | Loading state + nav with hardcoded bg — tokens to replace |
| P1 (important) | `components/layout/StatCard.tsx` | 1-71 | Current hover — line 37 has `hover:-translate-y-0.5` to remove |
| P1 (important) | `components/layout/EmptyState.tsx` | 1-44 | Current no-animation state — needs motion wrapper |
| P2 (reference) | `components/layout/Sidebar.tsx` | 107-143 | Active nav item pattern — add left border accent here |
| P2 (reference) | `components/layout/PageHeader.tsx` | 1-30 | Current interface — add `breadcrumb?` prop |

## External Documentation
| Topic | Source | Key Takeaway |
|---|---|---|
| Tailwind v4 `@theme inline` | Research findings | Add tokens inside existing `@theme inline {}` block in globals.css — they become Tailwind utility classes automatically |
| Framer Motion `motion.div` | Installed: `framer-motion` in package.json | Wrap with `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>` |

---

## Patterns to Mirror

### TAILWIND_V4_TOKEN_ADDITION
```css
/* SOURCE: app/globals.css:93-132 — inside @theme inline block */
@theme inline {
  --font-sans: 'Plus Jakarta Sans', 'Plus Jakarta Sans Fallback', system-ui, sans-serif;
  --color-background: var(--background);
  /* ... existing tokens ... */
  /* NEW tokens go here — they become Tailwind utility classes */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;
}
```

### TAILWIND_V4_UTILITY_LAYER
```css
/* SOURCE: app/globals.css:147-165 — @layer utilities block */
@layer utilities {
  .scrollbar-thin { ... }
  /* Add typography scale here, same pattern */
  .text-display { ... }
}
```

### CLERK_APPEARANCE_PATTERN
```tsx
/* SOURCE: app/auth/login/page.tsx:71-93 — identical in 3 other files */
/* EXTRACT to: lib/clerk-theme.ts */
appearance={{
  elements: {
    rootBox: "w-full",
    card: "bg-transparent shadow-none p-0 w-full",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton: "h-11 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-slate-300",
    socialButtonsBlockButtonText: "text-slate-300 font-medium",
    dividerLine: "bg-white/[0.06]",
    dividerText: "text-slate-600 text-xs uppercase tracking-wider",
    formFieldLabel: "text-xs font-medium text-slate-400",
    formFieldInput: "h-11 bg-white/[0.02] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-emerald-500/40 focus:ring-emerald-500/10",
    formButtonPrimary: "h-11 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30",
    footerActionLink: "text-emerald-400 hover:text-emerald-300 font-medium",
    identityPreviewEditButton: "text-emerald-400",
    formFieldAction: "text-emerald-400",
    footer: "hidden",
  },
}}
```

### AUTH_PAGE_SHELL
```tsx
/* SOURCE: app/auth/login/page.tsx:43-108 */
<div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 py-12">
  {/* CHANGE: bg-[#020617] → bg-background */}
  <div className="w-full max-w-[440px]">
    {/* back link → logo → heading → clerk component → footer */}
  </div>
</div>
/* Loading fallback pattern: */
<div className="min-h-screen flex items-center justify-center bg-[#020617]">
  {/* CHANGE: bg-[#020617] → bg-background */}
  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
</div>
```

### MOTION_FADEIN_COMPONENT
```tsx
/* SOURCE: components/layout/StatCard.tsx:32-36 — motion pattern to mirror */
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.06, duration: 0.3 }}
>
```

### MOTION_FADEIN_SIMPLE
```tsx
/* SOURCE: app/page.tsx:215-219 — simple opacity-only fade for EmptyState */
initial={{ opacity: 0 }}
whileInView={{ opacity: 1 }}
viewport={{ once: true, margin: "-40px" }}
transition={{ duration: 0.4 }}
```

### SIDEBAR_ACTIVE_ITEM
```tsx
/* SOURCE: components/layout/Sidebar.tsx:116-121 */
className={cn(
  'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group relative',
  isActive
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
)}
/* ADD: left border accent for active state */
/* isActive adds: 'border-l-2 border-emerald-500 dark:border-emerald-400 pl-[10px]' */
/* (reduce px-3 → pl-[10px] pr-3 when active to compensate for border) */
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `app/globals.css` | UPDATE | Add typography scale utilities + animation duration tokens |
| `lib/clerk-theme.ts` | CREATE | Centralize duplicated Clerk appearance config |
| `app/auth/login/page.tsx` | UPDATE | Replace `bg-[#020617]` × 2, import `clerkDarkAppearance` |
| `app/auth/signup/admin/page.tsx` | UPDATE | Replace `bg-[#020617]` × 1, import `clerkDarkAppearance` |
| `app/auth/signup/employee/page.tsx` | UPDATE | Replace `bg-[#020617]` × 1, import `clerkDarkAppearance` |
| `app/auth/select-role/page.tsx` | UPDATE | Replace `bg-[#020617]` × 2 |
| `app/page.tsx` | UPDATE | Replace `bg-[#020617]` × 4, update footer text |
| `components/layout/Sidebar.tsx` | UPDATE | Add active left border accent, fix tooltip semantic token |
| `components/layout/StatCard.tsx` | UPDATE | Remove `hover:-translate-y-0.5` |
| `components/layout/EmptyState.tsx` | UPDATE | Add motion fade-in wrapper |
| `components/layout/PageHeader.tsx` | UPDATE | Add optional `breadcrumb?` prop + render slot |

## NOT Building
- Dark/light mode toggle (app is dark-first, dark mode is the primary experience)
- New color palette or brand changes (emerald + slate stays)
- Font changes (Plus Jakarta Sans is professional, keep it)
- New shadcn components (no `npx shadcn add` needed for this phase)
- Framer Motion page transitions (AppShell already handles this)
- Responsive/mobile breakpoint work (desktop-first for Stripe Sessions booth)
- Onboarding pages (`app/auth/onboarding/`) — these are long forms, deferred to Phase 2/3

---

## Step-by-Step Tasks

### Task 1: Extend globals.css with typography scale + duration tokens
- **ACTION**: Add `@layer utilities` typography scale classes and animation duration tokens to `@theme inline`
- **IMPLEMENT**:
  ```css
  /* In @theme inline block (after line 131, before closing }): */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;

  /* New @layer utilities block (after existing scrollbar-thin block): */
  @layer utilities {
    .text-display {
      font-size: clamp(2.5rem, 6vw, 4.5rem);
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.035em;
    }
    .text-heading {
      font-size: clamp(1.75rem, 3vw, 2.25rem);
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }
    .text-label {
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
  }
  ```
- **MIRROR**: TAILWIND_V4_TOKEN_ADDITION and TAILWIND_V4_UTILITY_LAYER patterns
- **IMPORTS**: None
- **GOTCHA**: Tailwind v4 does NOT use `tailwind.config.ts` — tokens go in `globals.css` only. Do not create or modify any `tailwind.config.ts`.
- **VALIDATE**: `pnpm build` — zero type errors. Verify `duration-fast` works as `transition-duration-[var(--duration-fast)]` isn't needed — Tailwind v4 exposes CSS vars as utilities automatically.

### Task 2: Create lib/clerk-theme.ts
- **ACTION**: Extract the shared Clerk appearance object into a typed constant
- **IMPLEMENT**:
  ```ts
  // lib/clerk-theme.ts
  import type { Appearance } from '@clerk/types'

  export const clerkDarkAppearance: Appearance = {
    elements: {
      rootBox: "w-full",
      card: "bg-transparent shadow-none p-0 w-full",
      headerTitle: "hidden",
      headerSubtitle: "hidden",
      socialButtonsBlockButton:
        "h-11 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-slate-300",
      socialButtonsBlockButtonText: "text-slate-300 font-medium",
      dividerLine: "bg-white/[0.06]",
      dividerText: "text-slate-600 text-xs uppercase tracking-wider",
      formFieldLabel: "text-xs font-medium text-slate-400",
      formFieldInput:
        "h-11 bg-white/[0.02] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-emerald-500/40 focus:ring-emerald-500/10",
      formButtonPrimary:
        "h-11 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30",
      footerActionLink:
        "text-emerald-400 hover:text-emerald-300 font-medium",
      identityPreviewEditButton: "text-emerald-400",
      formFieldAction: "text-emerald-400",
      footer: "hidden",
    },
  }
  ```
- **MIRROR**: CLERK_APPEARANCE_PATTERN (extract exactly as seen in login page)
- **IMPORTS**: `import type { Appearance } from '@clerk/types'` — package is already installed
- **GOTCHA**: `@clerk/types` may re-export `Appearance` from `@clerk/nextjs`. If TS can't find it, use `import type { Appearance } from '@clerk/nextjs'` instead.
- **VALIDATE**: `pnpm lint` — no TypeScript errors. File is importable.

### Task 3: Update app/auth/login/page.tsx
- **ACTION**: Replace 2 hardcoded `bg-[#020617]` with `bg-background`; import `clerkDarkAppearance`
- **IMPLEMENT**:
  - Line 43: `bg-[#020617]` → `bg-background`
  - Line 114: `bg-[#020617]` → `bg-background`
  - Line 69-93: Replace inline `appearance={{ elements: { ... } }}` with `appearance={clerkDarkAppearance}`
  - Add import: `import { clerkDarkAppearance } from '@/lib/clerk-theme'`
- **MIRROR**: AUTH_PAGE_SHELL pattern
- **IMPORTS**: `import { clerkDarkAppearance } from '@/lib/clerk-theme'`
- **GOTCHA**: Keep `routing="hash"` on `SignIn` component — do not change Clerk routing config.
- **VALIDATE**: Visual check at `localhost:3000/auth/login` — page renders identically.

### Task 4: Update app/auth/signup/admin/page.tsx
- **ACTION**: Replace 1 hardcoded `bg-[#020617]` with `bg-background`; import `clerkDarkAppearance`
- **IMPLEMENT**:
  - Line 15: `bg-[#020617]` → `bg-background`
  - Lines 44-70: Replace inline appearance with `appearance={clerkDarkAppearance}`
  - Add import: `import { clerkDarkAppearance } from '@/lib/clerk-theme'`
- **MIRROR**: AUTH_PAGE_SHELL pattern
- **IMPORTS**: `import { clerkDarkAppearance } from '@/lib/clerk-theme'`
- **GOTCHA**: Keep `forceRedirectUrl="/auth/onboarding/admin"` on `SignUp` — do not touch routing.
- **VALIDATE**: Page renders identically at `localhost:3000/auth/signup/admin`.

### Task 5: Update app/auth/signup/employee/page.tsx
- **ACTION**: Replace 1 hardcoded `bg-[#020617]` with `bg-background`; import `clerkDarkAppearance`
- **IMPLEMENT**:
  - Line 15: `bg-[#020617]` → `bg-background`
  - Lines 44-70: Replace inline appearance with `appearance={clerkDarkAppearance}`
  - Add import: `import { clerkDarkAppearance } from '@/lib/clerk-theme'`
- **MIRROR**: AUTH_PAGE_SHELL pattern
- **IMPORTS**: `import { clerkDarkAppearance } from '@/lib/clerk-theme'`
- **GOTCHA**: Keep `forceRedirectUrl="/auth/onboarding/employee"` on `SignUp` — do not touch routing.
- **VALIDATE**: Page renders identically at `localhost:3000/auth/signup/employee`.

### Task 6: Update app/auth/select-role/page.tsx
- **ACTION**: Replace 2 hardcoded `bg-[#020617]` with `bg-background`
- **IMPLEMENT**:
  - Line 74 (loading state): `bg-[#020617]` → `bg-background`
  - Line 81 (main container): `bg-[#020617]` → `bg-background`
  - No Clerk component on this page — no clerk-theme import needed
- **MIRROR**: AUTH_PAGE_SHELL pattern
- **IMPORTS**: No new imports
- **GOTCHA**: This page has its own role card hover states (`hover:border-emerald-500/25 hover:bg-white/[0.03]`) — these are already semantic-ish (white-alpha) and should not be changed.
- **VALIDATE**: Page renders identically at `localhost:3000/auth/select-role`.

### Task 7: Update app/page.tsx (landing page)
- **ACTION**: Replace 4+ hardcoded `bg-[#020617]` with `bg-background`; update footer text; update feature card hover
- **IMPLEMENT**:
  - Line 88: `bg-[#020617]` → `bg-background` (loading spinner wrapper)
  - Line 95: `bg-[#020617]` → `bg-background` (main page wrapper)
  - Line 100: `bg-[#020617]/80` → `bg-background/80` (nav backdrop)
  - Line 222: `bg-[#020617]` → `bg-background` (feature card individual bg on hover)
  - Line 363: Update footer text:
    - Before: `"Demo project built for the Locus (YC F25) Agentic Payments Hackathon. Not a production product."`
    - After: `"Built for Stripe Sessions 2026. Powered by Gemini 2.5 Pro × Convex × Locus."`
- **MIRROR**: AUTH_PAGE_SHELL pattern (bg token replacement)
- **IMPORTS**: No new imports
- **GOTCHA**: `bg-background/80` uses Tailwind's opacity modifier syntax — this works with CSS vars in Tailwind v4. The grain texture overlay and emerald glow backgrounds use explicit values — leave those unchanged (they are decorative, not semantic).
- **VALIDATE**: Landing page renders identically at `localhost:3000`. Footer text updated.

### Task 8: Update components/layout/Sidebar.tsx
- **ACTION**: Add left border accent to active nav items; fix tooltip hardcoded `bg-slate-900`
- **IMPLEMENT**:
  - **Active item left border**: Change nav item className from:
    ```tsx
    isActive
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    ```
    To:
    ```tsx
    isActive
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-l-2 border-emerald-600 dark:border-emerald-500 pl-[10px]'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent pl-[10px]'
    ```
    (Note: `border-l-2 border-transparent pl-[10px]` on inactive items prevents layout shift when becoming active)
  - **Tooltip token**: Line 137: `bg-slate-900` → `bg-popover border border-border` and `text-white` → `text-popover-foreground`
    ```tsx
    // Before:
    className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg"
    // After:
    className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover border border-border text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg"
    ```
- **MIRROR**: SIDEBAR_ACTIVE_ITEM pattern
- **IMPORTS**: No new imports (cn already imported)
- **GOTCHA**: The existing `px-3` on nav items must become `pl-[10px] pr-3` to accommodate the 2px left border without causing content shift. Use `border-l-2 border-transparent` on inactive state so layout is stable.
- **VALIDATE**: Navigate to `/admin` — active "Overview" item has visible left emerald border. Collapse sidebar — tooltip renders with card-like styling.

### Task 9: Update components/layout/StatCard.tsx
- **ACTION**: Remove `hover:-translate-y-0.5` from Card className — keep shadow only
- **IMPLEMENT**:
  - Line 37: Change:
    ```tsx
    <Card className={cn("p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200", className)}>
    ```
    To:
    ```tsx
    <Card className={cn("p-5 hover:shadow-md transition-shadow duration-200", className)}>
    ```
  - Change `transition-all` → `transition-shadow` for more precise animation
- **MIRROR**: B2B SaaS convention (Ramp/Stripe cards don't translate on hover)
- **IMPORTS**: No new imports
- **GOTCHA**: `transition-shadow` only animates the shadow, not all properties — this is intentional and performs better.
- **VALIDATE**: Dashboard StatCards at `/admin` — hover shows shadow only, no vertical movement.

### Task 10: Update components/layout/EmptyState.tsx
- **ACTION**: Wrap root element with `motion.div` for fade-in on mount
- **IMPLEMENT**:
  - Add framer-motion import
  - Wrap the outer `<div>` with `<motion.div>`:
    ```tsx
    import { motion } from 'framer-motion'

    // Replace outer div:
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-8 rounded-xl border border-dashed border-border/60",
        className
      )}
    >
    ```
- **MIRROR**: MOTION_FADEIN_SIMPLE pattern
- **IMPORTS**: `import { motion } from 'framer-motion'`
- **GOTCHA**: `framer-motion` is already installed (`package.json` confirmed). Do not install anything new.
- **VALIDATE**: Navigate to a page with empty state (e.g., new admin with no events at `/admin/itineraries`) — state fades in smoothly.

### Task 11: Update components/layout/PageHeader.tsx
- **ACTION**: Add optional `breadcrumb?: React.ReactNode` prop rendered above the title
- **IMPLEMENT**:
  ```tsx
  interface PageHeaderProps {
    title: string
    description?: string
    actions?: React.ReactNode
    breadcrumb?: React.ReactNode  // ADD
    className?: string
  }

  export function PageHeader({ title, description, actions, breadcrumb, className }: PageHeaderProps) {
    return (
      <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", className)}>
        <div className="space-y-0.5">
          {breadcrumb && (              // ADD
            <div className="mb-1">     // ADD
              {breadcrumb}             // ADD
            </div>                     // ADD
          )}                           // ADD
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    )
  }
  ```
- **MIRROR**: Existing PageHeader interface pattern (additive change, no breaking)
- **IMPORTS**: No new imports
- **GOTCHA**: This is purely additive — existing callers do not need to change. The prop is optional and renders nothing when not provided.
- **VALIDATE**: `pnpm build` — zero type errors. Existing admin pages with PageHeader still render correctly.

---

## Testing Strategy

### Unit Tests
Phase 1 is entirely visual/token work — no business logic changes. No unit tests required for CSS token additions or className replacements.

### Visual Regression Checklist
| Check | Where | Expected |
|---|---|---|
| Landing page background | `localhost:3000` | Dark background, hero text visible |
| Nav bar | `localhost:3000` | Translucent dark bg with blur |
| Feature grid cards | `localhost:3000` (hover) | Dark bg on hover, no color flash |
| Footer | `localhost:3000` (bottom) | "Built for Stripe Sessions 2026" text |
| Login page | `localhost:3000/auth/login` | Dark bg, Clerk form renders |
| Select role page | `localhost:3000/auth/select-role` | Dark bg, 2 role cards |
| Admin sidebar | `localhost:3000/admin` | Active item has left emerald border |
| Admin stat cards | `localhost:3000/admin` | Hover shows shadow, no vertical jump |
| Empty state | Empty itineraries page | Fades in smoothly |

### Edge Cases Checklist
- [ ] Light mode (if user toggles): `bg-background` resolves to `#FFFFFF` — landing page becomes white (expected behavior)
- [ ] Sidebar collapse: Active border still shows in collapsed state (icon-only mode)
- [ ] StatCard with and without trend badge — hover only affects shadow
- [ ] EmptyState with and without action button — fade-in works in both cases
- [ ] PageHeader with breadcrumb AND without — no layout shift

---

## Validation Commands

### Static Analysis
```bash
pnpm lint
```
EXPECT: Zero lint errors, zero TypeScript errors

### Build Check
```bash
pnpm build
```
EXPECT: Successful build with `ignoreBuildErrors: true` still passing (no new errors introduced)

### Visual Review
```bash
pnpm dev
```
EXPECT: Navigate through `localhost:3000`, `localhost:3000/auth/login`, `localhost:3000/auth/select-role`, and `localhost:3000/admin`. Verify all changes look correct.

### Token Verification
```bash
grep -r "bg-\[#020617\]" app/ components/
```
EXPECT: Zero matches after all tasks complete

### Duplication Check
```bash
grep -r "socialButtonsBlockButton" app/ components/
```
EXPECT: Only `lib/clerk-theme.ts` contains this string (zero matches in auth pages)

---

## Acceptance Criteria
- [ ] `pnpm build` passes with no new errors
- [ ] `pnpm lint` is clean
- [ ] Zero instances of `bg-[#020617]` in `app/` or `components/` (verified by grep)
- [ ] Clerk appearance config exists only in `lib/clerk-theme.ts` — not in auth page files
- [ ] `lib/clerk-theme.ts` created and correctly imported in login, signup/admin, signup/employee
- [ ] Landing page footer no longer says "Not a production product"
- [ ] Admin sidebar active item shows left emerald border accent
- [ ] StatCard hover is shadow-only (no vertical translate)
- [ ] EmptyState fades in on mount
- [ ] PageHeader accepts `breadcrumb?` prop without breaking existing usages
- [ ] Typography scale utilities added to `globals.css`
- [ ] Animation duration tokens added to `@theme inline`

## Completion Checklist
- [ ] Code follows Tailwind v4 CSS-based token pattern (no `tailwind.config.ts` changes)
- [ ] Error handling unchanged (no new error paths introduced)
- [ ] No new packages installed
- [ ] No Clerk routing, auth logic, or redirect behavior changed
- [ ] No shadcn component primitives hand-edited
- [ ] All changes are purely additive or safe replacements
- [ ] Self-contained — implementable without further codebase searching

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `@clerk/types` package doesn't export `Appearance` type | Low | Low | Fall back to `import type { Appearance } from '@clerk/nextjs'` |
| `bg-background/80` opacity syntax not supported in Tailwind v4 | Low | Medium | Test in dev first; if unsupported, use `bg-[color:color-mix(in_srgb,var(--background)_80%,transparent)]` |
| Left border on sidebar active item causes layout shift | Low | Low | Use `border-l-2 border-transparent` on inactive items to pre-allocate border space |
| Feature card `bg-[#020617]` on hover in features grid breaks dark mode | None | None | `bg-background` is dark on dark, white on light — both correct |

## Notes
- The Tailwind v4 `@theme inline` mechanism: CSS custom properties defined there become Tailwind utility classes automatically. `--duration-fast: 150ms` becomes usable as `duration-[var(--duration-fast)]` or just referenced by other CSS.
- The research file at `.claude/PRPs/plans/phase-1-research.md` contains additional context on all files in scope — consult it if any pattern is unclear.
- After this phase, the design system foundation is established. Phases 2 and 3 (admin/employee UI revamp) can proceed with confidence that `bg-background`, `text-foreground`, `border-border` etc. all resolve correctly in dark mode.
- `app/auth/onboarding/` pages (admin: ~450 lines, employee: ~530 lines) were deliberately excluded — they are complex multi-step forms better handled in Phase 2/3 when those pages get full revamp treatment.
````
