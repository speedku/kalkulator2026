---
phase: 06-dashboard-and-analytics
plan: "01"
subsystem: database
tags: [prisma, mysql, dal, notifications, analytics, dashboard, bcryptjs, zod]

# Dependency graph
requires:
  - phase: 05-containers-and-deliveries
    provides: "Container, DomesticDelivery models and patterns used in dashboard DAL"
  - phase: 04-quotations-and-invoicing
    provides: "Quotation, QuotationItem models — primary data source for revenue KPIs and analytics"

provides:
  - Prisma models: Notification, NotificationRead, NotificationRecipient, PackerLiveStat
  - DB migration SQL: prisma/06-DB-MIGRATION.sql (3 CREATE TABLE statements)
  - Dashboard DAL: getDashboardKpis, getWeeklyTrend, getActivityFeed, getUpcomingDeliveries
  - Analytics DAL: getSalesAnalytics, getYoYComparison, getWoWComparison, getTopProducts, getPackerStats, getDeadStock, getWarehouseKpis
  - Notifications DAL: getUnreadCount, getNotifications, markNotificationRead, createNotification
  - Server Actions: markNotificationReadAction, changePasswordAction
  - API Route: GET /api/notifications/unread-count

affects:
  - 06-02 (main dashboard UI consumes getDashboardKpis, getWeeklyTrend, getActivityFeed, getUpcomingDeliveries)
  - 06-03 (analytics + notifications UI consumes all analytics DAL + notifications DAL)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "$queryRaw for time-series: all GROUP BY date functions use prisma.$queryRaw with MySQL DATE_FORMAT/YEAR/MONTH/WEEK"
    - "BigInt/Decimal coercion: Number() wraps all COUNT(*) and SUM() from raw queries"
    - "AND-wrapped OR: Prisma where uses AND: [{ OR: [...] }, { OR: [...] }] to avoid duplicate key TypeScript issue"
    - "Graceful empty state: getPackerStats wrapped in try/catch returning [] when packer_live_stats absent"
    - "changePasswordAction: bcryptjs.compare() for verification + bcryptjs.hash(pw, 12) for new hash"

key-files:
  created:
    - prisma/06-DB-MIGRATION.sql
    - src/types/dashboard.ts
    - src/types/analytics.ts
    - src/lib/dal/dashboard.ts
    - src/lib/dal/analytics.ts
    - src/lib/dal/notifications.ts
    - src/lib/actions/notifications.ts
    - src/lib/actions/user-settings.ts
    - src/app/api/notifications/unread-count/route.ts
  modified:
    - prisma/schema.prisma (4 new models + User back-relations)

key-decisions:
  - "ActivityEntry.entityId typed as number | null (not string) to match Prisma ActivityLog.entityId: Int?"
  - "Container.totalValue used in getWarehouseKpis (not totalValueUsd — field doesn't exist in schema)"
  - "createNotification added to notifications DAL beyond plan spec — needed for completeness of the DAL surface"
  - "getTopProducts: sku nullable in QuotationItem, defaulted to empty string to satisfy TopProductRow.sku: string"

patterns-established:
  - "Dashboard DAL: requireAuth() for user-visible data, requireAdmin() for analytics-only data"
  - "Notifications DAL: auth() direct call (returns 0/[] gracefully when unauthenticated, no redirect)"
  - "Analytics $queryRaw: typed with Array<{ field: unknown }> then Number() coercion on map()"

requirements-completed: [DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, ANAL-01, ANAL-02, ANAL-03, ANAL-04, ANAL-05, ANAL-06]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 6 Plan 01: Dashboard & Analytics Data Layer Summary

**Prisma schema extended with Notification/NotificationRead/NotificationRecipient/PackerLiveStat models, complete DAL layer for dashboard KPIs + trend charts + analytics + notifications, and Server Actions for password change — all compiling cleanly with `npx tsc --noEmit` and `npx next build`**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-23T14:29:43Z
- **Completed:** 2026-03-23T14:34:28Z
- **Tasks:** 3
- **Files modified:** 11 (9 created, 2 modified)

## Accomplishments

- Prisma schema extended with 4 new models (Notification, NotificationRead, NotificationRecipient, PackerLiveStat) and User back-relations; `npx prisma validate` passes
- DB migration SQL (`prisma/06-DB-MIGRATION.sql`) with 3 CREATE TABLE statements — ready to run on production MySQL
- Full dashboard DAL (getDashboardKpis, getWeeklyTrend, getActivityFeed, getUpcomingDeliveries) using `requireAuth()` and `$queryRaw` for time-series
- Full analytics DAL (getSalesAnalytics, getYoYComparison, getWoWComparison, getTopProducts, getPackerStats, getDeadStock, getWarehouseKpis) using `requireAdmin()` with graceful empty state for PackerStats
- Notifications DAL (getUnreadCount, getNotifications, markNotificationRead, createNotification) using auth() with graceful unauthenticated handling
- changePasswordAction with bcryptjs.compare() verification + hash(12) for new password
- API route GET /api/notifications/unread-count for 30-second polling badge

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema extension + DB migration SQL** - `1878a5b` (feat)
2. **Task 2: Dashboard DAL + Analytics DAL + TypeScript types** - `1351350` (feat)
3. **Task 3: Notifications DAL + Server Actions + API route** - `7d129c4` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `prisma/schema.prisma` — Added Notification, NotificationRead, NotificationRecipient, PackerLiveStat models + User back-relations
- `prisma/06-DB-MIGRATION.sql` — CREATE TABLE for notifications, notification_reads, notification_recipients
- `src/types/dashboard.ts` — DashboardKpis, TrendDataPoint, ActivityEntry, UpcomingItem
- `src/types/analytics.ts` — SalesAnalyticsRow, YoYRow, TopProductRow, PackerStatRow, DeadStockRow, WarehouseKpis
- `src/lib/dal/dashboard.ts` — getDashboardKpis, getWeeklyTrend, getActivityFeed, getUpcomingDeliveries
- `src/lib/dal/analytics.ts` — getSalesAnalytics, getYoYComparison, getWoWComparison, getTopProducts, getPackerStats, getDeadStock, getWarehouseKpis
- `src/lib/dal/notifications.ts` — getUnreadCount, getNotifications, markNotificationRead, createNotification
- `src/lib/actions/notifications.ts` — markNotificationReadAction
- `src/lib/actions/user-settings.ts` — changePasswordAction
- `src/app/api/notifications/unread-count/route.ts` — GET polling endpoint returning `{ data: { total: number } }`

## Decisions Made

- `ActivityEntry.entityId` typed as `number | null` (not `string | null`) — the Prisma ActivityLog model has `entityId: Int?`, so the plan's `string | null` would have been incorrect
- `getWarehouseKpis` uses `totalValue` (not `totalValueUsd`) — the Container Prisma model field is `totalValue @map("total_value")`, `totalValueUsd` doesn't exist
- `createNotification` added to notifications DAL even though not in plan spec — the DAL surface is incomplete without a write function; `markNotificationReadAction` calls the read DAL but admin create will need this in 06-03
- `getTopProducts`: QuotationItem.sku is `String?` (nullable), defaulted to `""` to satisfy `TopProductRow.sku: string`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ActivityEntry.entityId type mismatch**
- **Found during:** Task 2 (dashboard.ts TypeScript check)
- **Issue:** Plan specified `entityId: string | null` but Prisma ActivityLog model has `entityId: Int?` — would cause type error when mapping `l.entityId` which is `number | null`
- **Fix:** Changed `ActivityEntry.entityId` to `number | null` in `src/types/dashboard.ts`
- **Files modified:** `src/types/dashboard.ts`
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `1351350` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed getWarehouseKpis field name (totalValue not totalValueUsd)**
- **Found during:** Task 2 (analytics.ts TypeScript check)
- **Issue:** Plan specified `prisma.container.aggregate({ _sum: { totalValueUsd: true } })` but the Container model field is `totalValue` — field `totalValueUsd` does not exist
- **Fix:** Changed to `_sum: { totalValue: true }` in `getWarehouseKpis`
- **Files modified:** `src/lib/dal/analytics.ts`
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `1351350` (Task 2 commit)

**3. [Rule 2 - Missing Critical] Added createNotification to notifications DAL**
- **Found during:** Task 3 (notifications.ts implementation)
- **Issue:** The notifications DAL has only read functions; the admin notification creation (needed in 06-03) requires a write function to be part of the DAL surface
- **Fix:** Added `createNotification()` function with recipientUserIds support for `targetType: "specific"`
- **Files modified:** `src/lib/dal/notifications.ts`
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `7d129c4` (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (2 Rule 1 bugs, 1 Rule 2 missing critical)
**Impact on plan:** All fixes necessary for correctness. No scope creep — fixes ensure the DAL layer is correct and complete for 06-02/06-03 to consume.

## Issues Encountered

None — all planned functionality implemented after auto-fixes. `npx tsc --noEmit` and `npx next build` both pass with 0 errors.

## User Setup Required

**DB migration must be executed on production MySQL before testing notifications.**
Run `prisma/06-DB-MIGRATION.sql` on the production database. The `packer_live_stats` table already exists — do NOT recreate it.

## Next Phase Readiness

- All Phase 6 Wave 1 requirements complete: data layer for 06-02 (dashboard UI) and 06-03 (analytics + notifications UI) is ready
- DAL functions are typed, auth-gated, and compile cleanly
- Six named exports available: getDashboardKpis, getWeeklyTrend, getActivityFeed, getUpcomingDeliveries, getSalesAnalytics, getUnreadCount
- DB migration SQL is ready to run; until it's run on production, notification queries will return empty results (graceful handling already in place)

## Self-Check: PASSED

All 9 created files confirmed on disk. Commits 1878a5b, 1351350, 7d129c4 verified in git log. `npx prisma validate` exits 0. `npx tsc --noEmit` exits 0. `npx next build` exits 0.

---
*Phase: 06-dashboard-and-analytics*
*Completed: 2026-03-23*
