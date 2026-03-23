---
phase: 01-foundation-auth-and-system-shell
plan: "02"
subsystem: auth
tags: [next.js, auth.js, react-19, server-actions, zustand, aether, glassmorphism, rbac, nodemailer, bcryptjs]

# Dependency graph
requires:
  - phase: 01-foundation-auth-and-system-shell
    provides: "Auth.js v5 split config, DAL with getCurrentUser/hasPageAccess/requireAuth, Zod schemas, Aether tokens, Prisma schema"

provides:
  - "Four auth pages: login, register, forgot-password, reset-password with Aether glassmorphism styling"
  - "Server Actions: loginAction, registerAction, forgotPasswordAction, resetPasswordAction with full Zod validation"
  - "Nodemailer email utility for password reset and verification emails"
  - "AetherShell layout: SidebarNav (server RBAC) + SidebarClient (collapsible, mobile overlay) + Topbar"
  - "Dashboard layout calling requireAuth() + SidebarNav + Topbar"
  - "Aether components: GlassCard, GlowButton/SubmitButton, PageHeader"
  - "Navigation config (sidebarItems) matching PHP admin-sidebar-config.php page_ids"
  - "Zustand UI store with sidebar collapse persisted in localStorage"
  - "shadcn/ui base-nova components: input, label, card, tooltip"

affects:
  - "01-03-admin-panels"
  - "all subsequent phases (app shell, Aether components, Server Action pattern)"

# Tech tracking
tech-stack:
  added:
    - "zustand@5.0.12 (UI state management)"
    - "shadcn/ui base-nova: input, label, card, tooltip components"
  patterns:
    - "Server Actions with useActionState (React 19) — NOT useFormState"
    - "SubmitButton uses useFormStatus for automatic pending state"
    - "SidebarNav server/client split: server fetches RBAC, client handles interactivity"
    - "Hash-then-store token pattern for password reset (sha256 hash stored, raw UUID in email)"
    - "Best-effort activity logging and email sending (catch errors, don't fail auth flow)"
    - "GlassCard with Framer Motion entrance animation (spring physics)"
    - "base-nova shadcn style uses @base-ui/react (not Radix) — render prop instead of asChild"

key-files:
  created:
    - "src/components/aether/glass-card.tsx - Glassmorphism card with motion entrance animation"
    - "src/components/aether/glow-button.tsx - Button with glow effect + SubmitButton with useFormStatus"
    - "src/components/aether/page-header.tsx - Server Component with title/description/actions"
    - "src/components/aether/sidebar-nav.tsx - Server Component: RBAC filtering, renders SidebarClient"
    - "src/components/aether/sidebar-client.tsx - Client Component: collapse, mobile overlay, active state"
    - "src/components/aether/topbar.tsx - Client Component: mobile menu, user info, role badge, logout"
    - "src/app/(auth)/layout.tsx - Auth layout with grid background + radial glow"
    - "src/app/(auth)/login/page.tsx - Login with useActionState + loginAction"
    - "src/app/(auth)/register/page.tsx - Register with access code validation"
    - "src/app/(auth)/forgot-password/page.tsx - Forgot password with success state"
    - "src/app/(auth)/reset-password/page.tsx - Reset password with token from searchParams"
    - "src/app/(dashboard)/layout.tsx - Dashboard shell with requireAuth + SidebarNav + Topbar"
    - "src/app/(dashboard)/page.tsx - Placeholder dashboard with PageHeader + GlassCard"
    - "src/lib/actions/auth.ts - All four Server Actions with Zod validation + activity logging"
    - "src/lib/email.ts - Nodemailer SMTP utility for password reset + verification emails"
    - "src/lib/navigation.ts - sidebarItems array with NavItem type, 11 items + separator"
    - "src/stores/ui.ts - Zustand store: sidebarCollapsed (persisted) + sidebarMobileOpen"
  modified:
    - "src/app/page.tsx - Deleted (replaced by (dashboard)/page.tsx route group)"
    - "package.json - Added zustand@5"

key-decisions:
  - "SidebarClient uses base-ui render prop (not asChild) for custom Link trigger in TooltipTrigger — asChild not in @base-ui/react API"
  - "Root page.tsx deleted since (dashboard)/page.tsx transparently handles / via route group"
  - "Best-effort pattern for activity logging and emails: try/catch around non-critical operations so auth flows never fail due to DB or SMTP issues"
  - "Hash-then-store for reset tokens: crypto.randomUUID() raw token in email, sha256 hash stored in DB"
  - "registerAction validates confirmPassword manually (registerSchema only has 4 fields)"

patterns-established:
  - "Server Action pattern: 'use server', prevState: ActionState, formData: FormData, returns ActionState"
  - "Auth page pattern: 'use client', useActionState(action, {}), SubmitButton inside form"
  - "GlassCard wraps all content cards with consistent glassmorphism styling"
  - "SidebarNav server/client split: RBAC in server, interactivity in client"

requirements-completed: [AUTH-01, AUTH-03, AUTH-05, AUTH-08]

# Metrics
duration: 8min
completed: "2026-03-23"
---

# Phase 1 Plan 02: Auth Pages & App Shell Summary

**Four auth pages (login/register/forgot/reset) with Server Actions, Aether glassmorphism GlassCard/GlowButton components, and AetherShell layout (SidebarNav with RBAC, collapsible sidebar, Topbar) built on zustand + base-nova shadcn**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-23T10:29:18Z
- **Completed:** 2026-03-23T10:37:04Z
- **Tasks:** 2
- **Files modified:** 20

## Accomplishments
- Built four auth pages with Aether glassmorphism styling, all using `useActionState` (React 19) and `SubmitButton` with `useFormStatus` for pending states
- Implemented all four Server Actions with Zod validation, bcryptjs password hashing (cost 12), hash-then-store token pattern, and best-effort activity logging
- Created AetherShell: SidebarNav (server component with RBAC filtering) + SidebarClient (collapsible, mobile overlay, persistent Zustand state) + Topbar (user info, role badge, logout)
- Established the base Aether component library: GlassCard (Framer Motion entrance), GlowButton/SubmitButton, PageHeader

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth pages, Aether components, Server Actions, email utility** - `4e02942` (feat)
2. **Task 2: App shell (sidebar+topbar), dashboard layout, RBAC navigation** - `d8b6b41` (feat)

## Files Created/Modified

- `src/components/aether/glass-card.tsx` - Glassmorphism card with motion entrance animation
- `src/components/aether/glow-button.tsx` - GlowButton + SubmitButton (useFormStatus)
- `src/components/aether/page-header.tsx` - Server Component with title/description/actions
- `src/components/aether/sidebar-nav.tsx` - Server Component: RBAC filtering
- `src/components/aether/sidebar-client.tsx` - Client: collapsible sidebar, mobile overlay
- `src/components/aether/topbar.tsx` - Client: mobile menu, user info, role badge, logout
- `src/app/(auth)/layout.tsx` - Auth layout with CSS grid background + radial glow
- `src/app/(auth)/login/page.tsx` - Login with loginAction
- `src/app/(auth)/register/page.tsx` - Register with access code validation
- `src/app/(auth)/forgot-password/page.tsx` - Forgot password
- `src/app/(auth)/reset-password/page.tsx` - Reset password with token from searchParams
- `src/app/(dashboard)/layout.tsx` - Dashboard shell with requireAuth + SidebarNav + Topbar
- `src/app/(dashboard)/page.tsx` - Placeholder dashboard
- `src/lib/actions/auth.ts` - loginAction, registerAction, forgotPasswordAction, resetPasswordAction
- `src/lib/email.ts` - sendPasswordResetEmail, sendVerificationEmail (Nodemailer)
- `src/lib/navigation.ts` - sidebarItems with PHP admin-sidebar-config.php page_ids
- `src/stores/ui.ts` - Zustand store for sidebar collapse/mobile state

## Decisions Made

- Used base-ui `render` prop instead of `asChild` for TooltipTrigger wrapping a Link — `asChild` is Radix-only, `@base-ui/react` uses the `render` prop pattern
- Deleted `src/app/page.tsx` (root page) since `(dashboard)/page.tsx` handles `/` via transparent route group — having both would be a route conflict
- Best-effort pattern for activity logging and email: wrapped in try/catch so auth flows never fail due to non-critical side effects
- `registerAction` validates `confirmPassword` directly (not in Zod `registerSchema`) since the schema has only 4 fields

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed erroneous `.extend?` conditional in registerAction**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** `registerSchema.extend ? ... : ...` always evaluates to truthy (`.extend` is always defined as a method) — TypeScript error TS2774
- **Fix:** Replaced ternary with direct `registerSchema.safeParse(raw)` call
- **Files modified:** src/lib/actions/auth.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 4e02942 (Task 1 commit)

**2. [Rule 1 - Bug] Replaced `asChild` with `render` prop in TooltipTrigger**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `asChild` is a Radix UI pattern not in `@base-ui/react` API — TS2322 type error
- **Fix:** Used `render={<Link href={...} />}` pattern (base-ui's polymorphism API)
- **Files modified:** src/components/aether/sidebar-client.tsx
- **Verification:** `npx tsc --noEmit` passes, build succeeds
- **Committed in:** d8b6b41 (Task 2 commit)

**3. [Rule 3 - Blocking] Deleted stale .next/types to clear cached page.ts type errors**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `.next/types/app/page.ts` referenced the deleted `src/app/page.tsx` — stale cache causing false type errors
- **Fix:** `rm -rf .next/types` before final TypeScript check
- **Files modified:** None (build cache only)
- **Verification:** `npx tsc --noEmit` passes after cache clear
- **Committed in:** Not committed (build artifact)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes required for TypeScript correctness and build success. No scope creep.

## Issues Encountered

- None beyond the auto-fixed TypeScript issues above.

## User Setup Required

None - same external service configuration as Plan 01. See `01-01-SUMMARY.md` for environment variable setup (DATABASE_URL, AUTH_SECRET, SMTP_PASS, etc.).

## Next Phase Readiness

- Auth pages and app shell are complete. All four auth flows are implemented as Server Actions.
- Dashboard layout is ready — adding new pages only requires creating `src/app/(dashboard)/[route]/page.tsx`.
- Next plan (01-03) can build admin panels (users, permissions, access codes, audit log) and the notepad feature on top of this shell.
- The SidebarNav RBAC filter is live — admin sees all items, users see only their permitted pages.
- Sidebar collapse state persists in localStorage via Zustand persist middleware.

---
*Phase: 01-foundation-auth-and-system-shell*
*Completed: 2026-03-23*
