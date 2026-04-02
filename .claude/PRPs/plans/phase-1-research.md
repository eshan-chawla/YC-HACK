# Phase 1: Design System Foundation — Research Findings

## Target Phase
PRD: `.claude/PRPs/prds/tripweaver-v2-conference-demo.prd.md` → Phase 1 (pending)

## Key Discovery: Tailwind v4 (CSS-based config)
- **NO `tailwind.config.ts`** — Tailwind v4 uses `@tailwindcss/postcss` plugin + CSS `@theme inline` in `globals.css`
- PostCSS config: `postcss.config.mjs` → `{ '@tailwindcss/postcss': {} }`
- All design tokens live in `app/globals.css` lines 6-132

## Current Design System State

### Fonts
- **Primary**: Plus Jakarta Sans (weights 300-800) — `app/layout.tsx:7-12`
- **Mono**: DM Mono (weights 300-500) — `app/layout.tsx:14-19`
- Set via `--font-sans` and `--font-mono` in `@theme inline` block — `globals.css:94-95`
- Plus Jakarta Sans is already professional. No need to switch unless explicitly desired.

### Color Tokens (globals.css:6-91)
- Light mode: white bg, `#0F172A` fg, `#059669` primary (emerald-600)
- Dark mode: `#020617` bg (slate-950), `#F8FAFC` fg, `#10B981` primary (emerald-500)
- Chart colors: 5 colors defined (emerald, sky, violet, amber, red)
- Sidebar tokens: separate set for sidebar bg/fg/accent/border
- Brand emerald is consistent — preserve this

### Spacing & Radius
- `--radius: 0.75rem` (12px) — `globals.css:44`
- Derived: `--radius-sm` (8px), `--radius-md` (10px), `--radius-lg` (12px), `--radius-xl` (16px)
- No explicit spacing scale beyond Tailwind defaults
- 8px grid NOT formally enforced but mostly followed in practice

### What's Missing from globals.css
- No typography scale utility classes
- No semantic spacing tokens
- No focus ring consistency token
- No transition/animation duration tokens
- Scrollbar utility exists (`scrollbar-thin`) — good

## Files In Scope (all read and analyzed)

### Core Config
| File | Lines | Key Notes |
|------|-------|-----------|
| `app/globals.css` | 167 | All CSS tokens, light/dark mode, scrollbar utility |
| `app/layout.tsx` | 61 | Font loading, ClerkProvider, metadata |
| `postcss.config.mjs` | 9 | Tailwind v4 postcss plugin |
| `next.config.mjs` | 12 | `ignoreBuildErrors: true`, unoptimized images |
| `package.json` | 107 | Tailwind 4.1.9, Next 16.1.6, React 19, framer-motion |

### Landing Page
| File | Lines | Key Notes |
|------|-------|-----------|
| `app/page.tsx` | 372 | Already cleaned (no SOC-2/trust bar/fake footer). Has: hero, features grid, role cards, CTA, minimal footer. Uses `bg-[#020617]` hardcoded throughout instead of `bg-background` |

### Auth Pages (all follow same pattern)
| File | Pattern |
|------|---------|
| `app/auth/login/page.tsx` | Dark bg, logo, heading, Clerk SignIn, footer link |
| `app/auth/select-role/page.tsx` | Dark bg, two role cards (admin/employee), Clerk redirect check |
| `app/auth/signup/admin/page.tsx` | Dark bg, logo, heading, Clerk SignUp |
| `app/auth/signup/employee/page.tsx` | Same pattern as admin signup |
| `app/auth/onboarding/admin/page.tsx` | Multi-step form (3 steps), ~450 lines |
| `app/auth/onboarding/employee/page.tsx` | Multi-step form (3 steps), ~530 lines |

**Common auth page issues:**
- All use hardcoded `bg-[#020617]` instead of `bg-background`
- Clerk appearance config is **copy-pasted across 4 files** — must extract to `lib/clerk-theme.ts`

### Layout Components
| File | Lines | Key Notes |
|------|-------|-----------|
| `components/layout/AppShell.tsx` | 81 | Sidebar + Topbar wrapper, localStorage session check, AnimatePresence page transitions, `max-w-[1400px]` content width |
| `components/layout/Sidebar.tsx` | 176 | Collapsible, role-based nav, motion animate width, tooltip on collapse. Uses `bg-card` + `border-border/60` |
| `components/layout/Topbar.tsx` | 373 | Command palette search (⌘K), notification center, user dropdown with avatar. Convex queries for search |
| `components/layout/PageHeader.tsx` | 31 | Simple title + description + actions slot |
| `components/layout/StatCard.tsx` | 72 | Card with label, value, trend badge, icon, staggered motion |
| `components/layout/EmptyState.tsx` | 45 | Dashed border, icon, title, description, action button |
| `components/layout/Skeletons.tsx` | 109 | TableSkeleton, DashboardSkeleton, ProfileSkeleton |

### Brand
| File | Notes |
|------|-------|
| `components/TripWeaverLogo.tsx` | SVG logo (layered chevrons), `full`/`icon`/`text` variants, `sm`/`md`/`lg` sizes. Emerald-600 bg rounded-lg. **Do not change.** |

### UI Primitives (shadcn)
| File | Notes |
|------|-------|
| `components/ui/button.tsx` | CVA variants: default, destructive, outline, secondary, ghost, link. Sizes: default(h-10), sm(h-8), lg(h-12), icon variants. Has `active:scale-[0.98]` micro-interaction |

## Patterns to Mirror

### TAILWIND_V4_TOKENS
```css
/* SOURCE: app/globals.css:93-132 — how to add new tokens */
@theme inline {
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
  --color-background: var(--background);
  /* add new tokens here — they become Tailwind utility classes */
}
```

### CLERK_APPEARANCE (duplicated — must extract)
```tsx
// SOURCE: app/auth/login/page.tsx:72-93 (same in 3 other files)
// Extract to: lib/clerk-theme.ts
export const clerkDarkAppearance = {
  elements: {
    rootBox: "w-full",
    card: "bg-transparent shadow-none p-0 w-full",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton: "h-11 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-slate-300",
    formFieldInput: "h-11 bg-white/[0.02] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-emerald-500/40 focus:ring-emerald-500/10",
    formButtonPrimary: "h-11 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30",
    footerActionLink: "text-emerald-400 hover:text-emerald-300 font-medium",
    footer: "hidden",
  },
}
```

### MOTION_FADEUP
```tsx
// SOURCE: app/page.tsx:53-56
const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } }
// Usage: {...fadeUp} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
```

### MOTION_STAGGER
```tsx
// SOURCE: components/layout/StatCard.tsx:33-35
transition={{ delay: index * 0.06, duration: 0.3 }}
```

### AUTH_PAGE_LAYOUT
```tsx
// SOURCE: app/auth/login/page.tsx:43-108 — common shell
<div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 py-12">
  <div className="w-full max-w-[440px]">
    {/* Back link → Logo + heading → Clerk component → Footer links */}
  </div>
</div>
// CHANGE: bg-[#020617] → bg-background (tokens are equivalent in dark mode)
```

## Hardcoded Values to Replace
| Pattern | Files Affected | Replace With |
|---------|---------------|--------------|
| `bg-[#020617]` | page.tsx, all 6 auth pages, loading states | `bg-background` |
| `text-slate-400` (in dark pages) | all auth pages | `text-muted-foreground` |
| `text-slate-500` (in dark pages) | all auth pages | `text-muted-foreground` |
| `border-white/[0.04]` | page.tsx | `border-border` |
| `border-white/[0.06]` | page.tsx | `border-border` |
| `bg-emerald-600` on CTA buttons | page.tsx, auth pages | keep (these are explicit brand CTAs, fine to keep literal) |

## Dependencies (no new packages needed)
- `tailwindcss: ^4.1.9`, `framer-motion: latest`, `lucide-react: ^0.454.0`
- `class-variance-authority`, `tailwind-merge`, `tw-animate-css` — all installed
- `next-themes: ^0.4.6` — for dark mode class

## Task Outline for Plan

1. **`app/globals.css`** — Add: typography scale utilities (`@layer utilities { .text-display, .text-heading, .text-body-sm }`), transition duration tokens (`--duration-fast: 150ms`, `--duration-base: 200ms`, `--duration-slow: 300ms`), focus ring token tightening
2. **`lib/clerk-theme.ts`** — CREATE: extract shared Clerk appearance config; import in 4 auth pages
3. **Auth pages** (`login`, `signup/admin`, `signup/employee`) — Replace `bg-[#020617]` with `bg-background`, import `clerkDarkAppearance` from new file
4. **`app/auth/select-role/page.tsx`** — Same token cleanup; role card hover refinement
5. **`app/page.tsx`** — Landing page visual upgrade: refine hero (tighter, more visual weight), add product UI screenshot/mockup section between features and role cards, tighten feature grid gap-px → proper border treatment, CTA section polish
6. **`components/layout/Sidebar.tsx`** — Tighten spacing, add active state left border accent, refine collapse animation
7. **`components/layout/Topbar.tsx`** — Search input border refinement, user dropdown polish
8. **`components/layout/StatCard.tsx`** — Tighter card variant, remove `-translate-y-0.5` hover (too bouncy for B2B)
9. **`components/layout/PageHeader.tsx`** — Add optional breadcrumb slot, tighten description font-size
10. **`components/layout/EmptyState.tsx`** — Minor: tighten icon container size, add motion fade-in

## Validation Commands
```bash
pnpm build    # Must pass
pnpm lint     # Must be clean
pnpm dev      # Visual review at localhost:3000
```

## Success Signal
Landing page + login flow looks indistinguishable from a funded B2B SaaS — no judge says "hackathon project" within the first 10 seconds.
