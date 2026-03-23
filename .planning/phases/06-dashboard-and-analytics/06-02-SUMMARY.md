---
phase: 06-dashboard-and-analytics
plan: "02"
subsystem: ui
tags: [recharts, dashboard, kpi, area-chart, notifications, settings, react-19, server-components]

# Dependency graph
requires:
  - phase: 06-01
    provides: "getDashboardKpis, getWeeklyTrend, getActivityFeed, getUpcomingDeliveries, changePasswordAction, /api/notifications/unread-count"

provides:
  - Main dashboard page at / with KPI cards, trend chart, activity feed, upcoming deliveries widget
  - NotificationBell component polling /api/notifications/unread-count every 30 seconds
  - NotificationBell wired into topbar between user name and avatar
  - Account settings page at /settings/account with password change form

affects:
  - 06-03 (analytics + notifications UI — layout and design patterns established here)

# Tech tracking
tech-stack:
  added: [recharts@3.8.0]
  patterns:
    - "Client chart boundary: all Recharts components must be 'use client' — dashboard page is Server Component passing data as props"
    - "Polling bell: useEffect + setInterval(30_000) + cleanup return clearInterval — standard pattern for periodic UI refresh"
    - "Dashboard layout: Server Component fetches all data in parallel via Promise.all, passes to child client components as props"
    - "Account settings: Server Component page with requireAuth() guard wrapping a client-side form component"

key-files:
  created:
    - src/app/(dashboard)/page.tsx
    - src/app/(dashboard)/_components/kpi-cards.tsx
    - src/app/(dashboard)/_components/trend-chart.tsx
    - src/app/(dashboard)/_components/activity-feed.tsx
    - src/app/(dashboard)/_components/upcoming-widget.tsx
    - src/app/(dashboard)/_components/notification-bell.tsx
    - src/app/(dashboard)/settings/account/page.tsx
    - src/app/(dashboard)/settings/account/_components/change-password-form.tsx
  modified:
    - src/components/aether/topbar.tsx

key-decisions:
  - "GlassCard used directly in ActivityFeed and UpcomingWidget (not wrapping TrendChart — TrendChart uses own styled div to avoid double borders)"
  - "NotificationBell placed in (dashboard)/_components (not aether/) — it depends on basePath /kalkulator2026 and is dashboard-specific"
  - "state?.error and state?.success with optional chaining in ChangePasswordForm to handle undefined initial state safely"

patterns-established:
  - "Dashboard _components directory: all dashboard-specific client and server component pieces live in src/app/(dashboard)/_components/"
  - "KPI data flow: Server Component page → Promise.all DAL calls → typed props → presentational child components"

requirements-completed: [DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06]

# Metrics
duration: 13min
completed: 2026-03-23
---

# Phase 6 Plan 02: Dashboard UI Summary

**Recharts AreaChart dashboard with 5 KPI StatCards, activity feed, upcoming deliveries widget, polling notification bell in topbar, and account settings password-change page — all compiling cleanly with `npx tsc --noEmit` and `npx next build`**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-23T14:29:43Z
- **Completed:** 2026-03-23T14:42:38Z
- **Tasks:** 2
- **Files modified:** 9 (8 created, 1 modified)

## Accomplishments

- Main dashboard page replaced Phase 1 stub with async Server Component fetching all 4 DAL functions in parallel via `Promise.all`
- 5 KPI StatCard instances (quotations/month, revenue/month, containers in transit, upcoming deliveries/7d, active users)
- Recharts dual-axis AreaChart (revenue + count series) with Aether dark theme styling and "use client" boundary
- Activity feed showing last 10 log entries with user avatar initials and `formatDistanceToNow` (Polish locale)
- Upcoming deliveries widget with Ship/Truck icons and `date-fns format` for ETA dates
- NotificationBell polling `/kalkulator2026/api/notifications/unread-count` every 30s with badge capped at "9+"
- NotificationBell inserted into topbar between user name span and avatar div
- Account settings page at `/settings/account` with `requireAuth()` guard and `ChangePasswordForm`
- `ChangePasswordForm` using `useActionState(changePasswordAction)` with error/success feedback

## Task Commits

Each task was committed atomically:

1. **Task 1: Main dashboard page + KPI cards + trend chart + activity feed + upcoming widget** - `cc2f4e2` (feat)
2. **Task 2: Notification bell in topbar + account settings page** - `f21cfd3` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/app/(dashboard)/page.tsx` — Async Server Component, replaces Phase 1 stub, fetches all dashboard data in parallel
- `src/app/(dashboard)/_components/kpi-cards.tsx` — 5 StatCard instances with DashboardKpis props
- `src/app/(dashboard)/_components/trend-chart.tsx` — use client Recharts AreaChart with dual Y-axes
- `src/app/(dashboard)/_components/activity-feed.tsx` — GlassCard wrapper with ActivityEntry list
- `src/app/(dashboard)/_components/upcoming-widget.tsx` — GlassCard wrapper with UpcomingItem list
- `src/app/(dashboard)/_components/notification-bell.tsx` — use client Bell icon with 30s polling badge
- `src/components/aether/topbar.tsx` — NotificationBell import + JSX insertion between user name and avatar
- `src/app/(dashboard)/settings/account/page.tsx` — Account settings Server Component with requireAuth()
- `src/app/(dashboard)/settings/account/_components/change-password-form.tsx` — use client form with useActionState

## Decisions Made

- `GlassCard` used in `ActivityFeed` and `UpcomingWidget`, but `TrendChart` uses its own styled `div` — GlassCard uses Framer Motion and has specific padding; TrendChart needs direct control over p-5 and height
- `NotificationBell` placed in `(dashboard)/_components/` (not `aether/`) because it depends on the `/kalkulator2026` basePath and is dashboard-specific, not a reusable design system component
- `state?.error` and `state?.success` use optional chaining in ChangePasswordForm to handle the `undefined` initial state cleanly without TypeScript errors

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — `npx tsc --noEmit` exits 0. `npx next build` exits 0 with `/` and `/settings/account` listed in route output. Only pre-existing ESLint warnings in unrelated files (audit-log-table.tsx, quotation-builder/index.tsx).

## User Setup Required

None - no external service configuration required. Notification polling endpoint `/api/notifications/unread-count` was already built in 06-01.

## Next Phase Readiness

- Dashboard UI complete — all 6 DASH requirements fulfilled across 06-01 and 06-02
- Analytics UI (06-03) can now be built: analytics DAL from 06-01 is ready, and the dashboard layout/design patterns are established
- Notification bell is wired up and polling; Phase 06-03 will add the full notifications panel UI

---
*Phase: 06-dashboard-and-analytics*
*Completed: 2026-03-23*

## Self-Check: PASSED

All 9 files confirmed on disk. Commits cc2f4e2 and f21cfd3 verified in git log. `npx tsc --noEmit` exits 0. `npx next build` exits 0 with `/` (267kB) and `/settings/account` in route output.
