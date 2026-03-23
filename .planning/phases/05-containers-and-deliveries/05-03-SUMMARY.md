---
phase: 05-containers-and-deliveries
plan: "03"
subsystem: ui
tags: [react, next.js, date-fns, tanstack-table, react-hook-form, zod, deliveries, calendar, subiekt]

# Dependency graph
requires:
  - phase: 05-containers-and-deliveries
    provides: "05-01: Container DAL, domestic-deliveries DAL, getContainerAnalytics, getCalendarDeliveries, Server Actions, Zod schemas, TypeScript types"
  - phase: 05-containers-and-deliveries
    provides: "05-02: Container UI patterns, GlassCard, status pipeline pattern, Aether design conventions"

provides:
  - ContainerAnalyticsPanel: 4 stat cards (in-transit count, total value USD, on-time %, avg days)
  - containers/page.tsx updated: getContainerAnalytics() + ContainerAnalyticsPanel above table
  - /deliveries list page with URL-state status filter and SubiektSyncBtn
  - /deliveries/new create form (RHF + zodResolver + z.input pattern)
  - /deliveries/[id] detail page with status pipeline (pending > in_transit > delivered | cancelled)
  - /delivery-calendar monthly grid with date-fns buildCalendarGrid, Ship/Truck event chips
  - syncDeliveriesFromSubiekt in subiekt.ts: discovery-first (dok% schema query)
  - syncDeliveriesAction in domestic-deliveries actions

affects:
  - 06+ (any phase referencing Phase 5 pages)

# Tech tracking
tech-stack:
  added: [date-fns]
  patterns:
    - "buildCalendarGrid: date-fns startOfMonth/endOfMonth/startOfWeek/endOfWeek/eachDayOfInterval, week starts Monday"
    - "Calendar month nav: useRouter().push with ?year=&month= URL params — triggers Server Component re-render, no client fetch"
    - "SubiektSyncBtn: isolated Client Component wrapper for useTransition around server action, toast.info for discovered=true"
    - "Subiekt delivery sync: discovery-first approach — query information_schema.COLUMNS for dok% tables before attempting data sync"
    - "Status pipeline for deliveries: 3-step (pending/in_transit/delivered) + separate cancel button for non-terminal states"

key-files:
  created:
    - src/app/(dashboard)/containers/_components/container-analytics.tsx
    - src/app/(dashboard)/deliveries/page.tsx
    - src/app/(dashboard)/deliveries/_components/deliveries-table.tsx
    - src/app/(dashboard)/deliveries/_components/delivery-status-badge.tsx
    - src/app/(dashboard)/deliveries/_components/subiekt-sync-btn.tsx
    - src/app/(dashboard)/deliveries/new/page.tsx
    - src/app/(dashboard)/deliveries/new/_components/delivery-form.tsx
    - src/app/(dashboard)/deliveries/[id]/page.tsx
    - src/app/(dashboard)/deliveries/[id]/_components/delivery-detail.tsx
    - src/app/(dashboard)/delivery-calendar/page.tsx
    - src/app/(dashboard)/delivery-calendar/_components/delivery-calendar.tsx
  modified:
    - src/app/(dashboard)/containers/page.tsx (added ContainerAnalyticsPanel)
    - src/lib/actions/domestic-deliveries.ts (added syncDeliveriesAction)
    - src/lib/dal/subiekt.ts (added syncDeliveriesFromSubiekt)
    - package.json / package-lock.json (installed date-fns)

key-decisions:
  - "date-fns was not in node_modules despite appearing in package.json — installed explicitly via npm install date-fns"
  - "DeliveryDetail status pipeline renders 3-step pipeline (excluding cancelled); cancel is a separate red button visible for non-terminal states"
  - "SubiektSyncBtn uses toast.info for result.discovered=true errors — communicates to admin this is a configuration step, not a failure"
  - "Calendar grid cells have min-h-[80px] to ensure consistent height even for days with no events"

patterns-established:
  - "Calendar URL state: ?year=&month= in delivery-calendar — no client-side fetch on navigation"
  - "date-fns buildCalendarGrid: 6x7 grid, weekStartsOn: 1 (Monday), eachDayOfInterval"
  - "Event chips: truncate class + title attribute for overflow; max 3 visible + '+N więcej' indicator"

requirements-completed: [CONT-07, DELV-01, DELV-02, DELV-03, DELV-04]

# Metrics
duration: 7min
completed: 2026-03-23
---

# Phase 5 Plan 03: Deliveries UI & Calendar Summary

**Container analytics stats panel, full domestic deliveries CRUD UI, unified monthly calendar with date-fns grid, and Subiekt GT discovery-first delivery sync — completing all Phase 5 requirements**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-23T13:59:58Z
- **Completed:** 2026-03-23T14:06:36Z
- **Tasks:** 2
- **Files modified:** 15 (11 created, 4 modified)

## Accomplishments

- ContainerAnalyticsPanel with 4 stat cards (in-transit, total value USD, on-time %, avg days) added above containers table
- Full domestic deliveries CRUD: list at `/deliveries`, create at `/deliveries/new`, detail at `/deliveries/[id]` with status pipeline and cancel
- Unified monthly calendar at `/delivery-calendar` with Ship (blue) and Truck (green) event chips, max 3 visible + overflow indicator
- Month navigation via `?year=&month=` URL params using `router.push` — no client fetch
- `syncDeliveriesFromSubiekt` with discovery-first approach: queries `information_schema.COLUMNS` for dok% tables, returns structured feedback with column names if `dok__Dokument` found
- `syncDeliveriesAction` wrapped with `toast.info` (not `toast.error`) for `discovered=true` scenario

## Task Commits

Each task was committed atomically:

1. **Task 1: Container analytics, deliveries CRUD UI, Subiekt sync** - `74ae455` (feat)
2. **Task 2: Unified delivery calendar + date-fns install** - `8a748a8` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/app/(dashboard)/containers/_components/container-analytics.tsx` — 4 stat cards, responsive 2-col/4-col grid
- `src/app/(dashboard)/containers/page.tsx` — Now calls getContainerAnalytics() in parallel, renders ContainerAnalyticsPanel
- `src/app/(dashboard)/deliveries/page.tsx` — Server Component, requireAdmin, DeliveriesTable + SubiektSyncBtn
- `src/app/(dashboard)/deliveries/_components/deliveries-table.tsx` — URL-state status filter, table with row links
- `src/app/(dashboard)/deliveries/_components/delivery-status-badge.tsx` — Polish labels (Oczekuje/W drodze/Dostarczona/Anulowana)
- `src/app/(dashboard)/deliveries/_components/subiekt-sync-btn.tsx` — Client wrapper, useTransition, info/error toast
- `src/app/(dashboard)/deliveries/new/page.tsx` — Server Component, requireAdmin
- `src/app/(dashboard)/deliveries/new/_components/delivery-form.tsx` — RHF + zodResolver + z.input<DomesticDeliverySchema>
- `src/app/(dashboard)/deliveries/[id]/page.tsx` — await params (Next.js 15), notFound() on null
- `src/app/(dashboard)/deliveries/[id]/_components/delivery-detail.tsx` — 3-step pipeline + cancel, document list
- `src/app/(dashboard)/delivery-calendar/page.tsx` — requireAuth, reads ?year+?month, calls getCalendarDeliveries
- `src/app/(dashboard)/delivery-calendar/_components/delivery-calendar.tsx` — buildCalendarGrid, Ship/Truck chips, legend
- `src/lib/dal/subiekt.ts` — Added syncDeliveriesFromSubiekt with schema discovery
- `src/lib/actions/domestic-deliveries.ts` — Added syncDeliveriesAction

## Decisions Made

- date-fns was installed via `npm install date-fns` because the package was missing from node_modules despite being listed in package.json (the earlier `ls node_modules/date-fns` returned EXIT 0 due to partial glob matching)
- Delivery status pipeline excludes "cancelled" from the 3-step progress indicator and provides a separate red "Anuluj dostawę" button visible for non-terminal (non-delivered, non-cancelled) states
- Subiekt sync result `discovered: true` shows as `toast.info` not `toast.error` — communicates that the GT table was found but column mapping needs manual configuration, not that something broke

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript error in delivery-detail.tsx — redundant `delivery.status !== "cancelled"` comparison**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** Inside the `{delivery.status !== "cancelled" && (...)}` parent block, TypeScript narrowed the type to not include "cancelled", making the inner `delivery.status !== "cancelled"` check trigger TS2367 ("This comparison appears to be unintentional")
- **Fix:** Removed the inner `delivery.status !== "cancelled"` check (kept outer block guard), leaving only `delivery.status !== "delivered"` for the cancel button condition
- **Files modified:** `src/app/(dashboard)/deliveries/[id]/_components/delivery-detail.tsx`
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `74ae455` (Task 1 commit, fix applied before commit)

**2. [Rule 3 - Blocking] date-fns not found in node_modules despite package.json listing**
- **Found during:** Task 2 (`npx tsc --noEmit` after writing delivery-calendar.tsx)
- **Issue:** TypeScript error TS2307: "Cannot find module 'date-fns'". `ls node_modules/` confirmed date-fns directory was absent
- **Fix:** Ran `npm install date-fns` which installed the package and updated package-lock.json
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** `npx tsc --noEmit` exits 0 after install
- **Committed in:** `8a748a8` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 bug, 1 Rule 3 blocking)
**Impact on plan:** Both fixes were necessary for compilation. No scope changes. All 11 planned artifacts delivered.

## Issues Encountered

None — all planned functionality implemented after auto-fixes. `npx tsc --noEmit` and `npx next build` both pass with 0 errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 5 requirements complete: CONT-01 through CONT-08 and DELV-01 through DELV-04
- Container analytics, full deliveries CRUD, unified calendar, and Subiekt sync are all live
- DB migration (prisma/05-DB-MIGRATION.sql) must still be executed on production MySQL
- Phase 6 can begin

## Self-Check: PASSED

All 11 created files confirmed on disk. Commits 74ae455 and 8a748a8 verified in git log. npx tsc --noEmit exits 0. npx next build exits 0 with /deliveries, /deliveries/[id], /deliveries/new, /delivery-calendar all listed in route output.

---
*Phase: 05-containers-and-deliveries*
*Completed: 2026-03-23*
