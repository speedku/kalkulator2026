---
phase: 05-containers-and-deliveries
plan: "01"
subsystem: database
tags: [prisma, mysql, containers, deliveries, dal, zod, nodemailer, navigation]

# Dependency graph
requires:
  - phase: 04-quotations-and-invoicing
    provides: Invoice DAL patterns, ActionState pattern, email.ts structure, navigation.ts base
  - phase: 02-product-management
    provides: Product and ProductVariant models (ContainerItem links to them)

provides:
  - Container, ContainerItem, ContainerDocument, ContainerNotification, DomesticDelivery, DomesticDeliveryDocument Prisma models
  - prisma/05-DB-MIGRATION.sql with 6 CREATE TABLE IF NOT EXISTS statements for manual DB execution
  - src/lib/dal/containers.ts: getContainers, getContainerById, createContainer, updateContainerStatus, addContainerItem, removeContainerItem, addContainerDocument, getContainerAnalytics
  - src/lib/dal/domestic-deliveries.ts: getDomesticDeliveries, getDomesticDeliveryById, createDomesticDelivery, updateDomesticDeliveryStatus, getCalendarDeliveries
  - src/lib/actions/containers.ts: 6 server actions for container CRUD and notification
  - src/lib/actions/domestic-deliveries.ts: 2 server actions for delivery CRUD
  - src/lib/validations/containers.ts and domestic-deliveries.ts: Zod schemas
  - sendContainerStatusEmail() in src/lib/email.ts
  - Navigation entries for /containers, /deliveries, /delivery-calendar in navigation.ts

affects:
  - 05-02 (container UI — depends on all DAL functions)
  - 05-03 (deliveries + calendar UI — depends on domestic-deliveries DAL)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ContainerItem.totalPrice computed in DAL as quantity * unitPrice — NOT a stored column (avoids MySQL GENERATED ALWAYS AS Prisma conflict)"
    - "getCalendarDeliveries uses requireAuth (not requireAdmin) — calendar is visible to all authenticated users"
    - "ContainerDocument.filePath uses z.string().max(500) not z.string().url() — URLs may not be standard HTTP format (MinIO presigned)"
    - "notifyContainerAction records ContainerNotification with status sent/failed regardless of email success — best-effort pattern"
    - "getContainerAnalytics uses Promise.all for 3 parallel queries + prisma.$queryRaw for DATEDIFF aggregation"

key-files:
  created:
    - prisma/05-DB-MIGRATION.sql
    - src/types/containers.ts
    - src/types/domestic-deliveries.ts
    - src/lib/validations/containers.ts
    - src/lib/validations/domestic-deliveries.ts
    - src/lib/dal/containers.ts
    - src/lib/dal/domestic-deliveries.ts
    - src/lib/actions/containers.ts
    - src/lib/actions/domestic-deliveries.ts
  modified:
    - prisma/schema.prisma (6 new models + User/Product/ProductVariant relations)
    - src/lib/email.ts (added sendContainerStatusEmail)
    - src/lib/navigation.ts (replaced admin-deliveries-hub with 3 Phase 5 entries)

key-decisions:
  - "ContainerItem.totalPrice omitted from Prisma model — computed as quantity * unitPrice in DAL to avoid MySQL generated column write conflict"
  - "getCalendarDeliveries uses requireAuth not requireAdmin — all users should see the delivery calendar per DELV-03"
  - "filePath validation uses z.string().max(500) not z.string().url() — MinIO presigned URLs may not pass strict URL validation"
  - "notifyContainerAction records ContainerNotification with sent/failed status even on email error — allows audit trail of attempted notifications"

patterns-established:
  - "Phase 5 DAL pattern: server-only, requireAdmin/requireAuth, Decimal.Number() conversion, typed return interfaces"
  - "CalendarEvent: unified shape for both container and domestic delivery events (type, label, etaDate, status, detail, href)"

requirements-completed: [CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, CONT-08, DELV-01, DELV-02, DELV-03, DELV-04]

# Metrics
duration: 4min
completed: 2026-03-23
---

# Phase 5 Plan 01: Containers & Deliveries Data Layer Summary

**6 Prisma models with SQL migration DDL, fully typed DAL with 13 exported functions, Zod schemas, Server Actions, sendContainerStatusEmail(), and 3 navigation entries — all TypeScript-clean**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-23T13:39:28Z
- **Completed:** 2026-03-23T13:44:00Z
- **Tasks:** 2
- **Files modified:** 12 (10 created, 2 modified, 1 prisma schema extended)

## Accomplishments

- Extended prisma/schema.prisma with 6 models (Container, ContainerItem, ContainerDocument, ContainerNotification, DomesticDelivery, DomesticDeliveryDocument) plus User/Product/ProductVariant relations
- Created prisma/05-DB-MIGRATION.sql with all 6 CREATE TABLE IF NOT EXISTS statements for manual MySQL execution
- Container DAL with 8 functions: getContainers, getContainerById (with totalPrice computation), createContainer, updateContainerStatus, addContainerItem, removeContainerItem, addContainerDocument, getContainerAnalytics (parallel queries + $queryRaw DATEDIFF)
- Domestic delivery DAL with 5 functions including getCalendarDeliveries (requireAuth — all users) returning unified CalendarEvent shape
- 6 container Server Actions + 2 domestic delivery Server Actions following ActionState pattern
- sendContainerStatusEmail() added to email.ts using existing createTransport/emailTemplate helpers
- Navigation updated: replaced single "Dostawy" entry with Ship/Truck/Calendar entries for /containers, /deliveries, /delivery-calendar

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema, SQL migration, TypeScript types** - `155e2b5` (feat)
2. **Task 2: DAL, Server Actions, validations, email, navigation** - `a6b606e` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `prisma/schema.prisma` — 6 new Phase 5 models + User/Product/ProductVariant relations
- `prisma/05-DB-MIGRATION.sql` — 6 CREATE TABLE IF NOT EXISTS statements with FK constraints and indexes
- `src/types/containers.ts` — ContainerRow, ContainerItem (with computed totalPrice), ContainerDocumentRow, ContainerWithItems, ContainerAnalytics
- `src/types/domestic-deliveries.ts` — DomesticDeliveryRow, DomesticDeliveryDocument, DomesticDeliveryWithDocuments, CalendarEvent
- `src/lib/validations/containers.ts` — ContainerSchema, ContainerStatusSchema, ContainerItemSchema, ContainerDocumentSchema, NotifyContainerSchema
- `src/lib/validations/domestic-deliveries.ts` — DomesticDeliverySchema, DomesticDeliveryStatusSchema
- `src/lib/dal/containers.ts` — 8 exported DAL functions, all requireAdmin, server-only
- `src/lib/dal/domestic-deliveries.ts` — 5 exported DAL functions (getCalendarDeliveries uses requireAuth)
- `src/lib/actions/containers.ts` — 6 server actions: createContainerAction, updateContainerStatusAction, addContainerItemAction, removeContainerItemAction, addContainerDocumentAction, notifyContainerAction
- `src/lib/actions/domestic-deliveries.ts` — 2 server actions: createDomesticDeliveryAction, updateDomesticDeliveryStatusAction
- `src/lib/email.ts` — Added sendContainerStatusEmail() with Aether-styled HTML, status/notification type labels in Polish
- `src/lib/navigation.ts` — Added Ship + Calendar to lucide-react imports; replaced admin-deliveries-hub with 3 Phase 5 nav entries

## Decisions Made

- ContainerItem.totalPrice is computed in DAL (`Number(item.unitPrice) * item.quantity`) rather than as a Prisma model field, to avoid MySQL GENERATED ALWAYS AS column write conflict. The Prisma model omits totalPrice entirely.
- getCalendarDeliveries uses `requireAuth()` not `requireAdmin()` so all logged-in users can see the delivery calendar (per requirement DELV-03).
- ContainerDocumentSchema uses `z.string().max(500)` for filePath instead of `z.string().url()` because MinIO presigned URLs may not pass strict URL validation.
- notifyContainerAction records a ContainerNotification record with status "sent" or "failed" regardless of whether the email succeeded — provides audit trail.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] ContainerDocumentSchema filePath uses max(500) not .url()**
- **Found during:** Task 2 (creating validations/containers.ts)
- **Issue:** Plan specified `z.string().url().max(500)` but MinIO presigned URLs may include query parameters or non-standard formats that fail Zod's URL validation
- **Fix:** Changed to `z.string().max(500)` — validates length without strict URL format requirement
- **Files modified:** src/lib/validations/containers.ts
- **Verification:** TypeScript passes, no Zod validation errors expected for valid file paths
- **Committed in:** a6b606e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical — security/correctness)
**Impact on plan:** Minor schema adjustment. No scope creep. All plan artifacts delivered as specified.

## Issues Encountered

None — all tasks completed without errors. `npx prisma generate` and `npx tsc --noEmit` both passed with 0 errors.

## User Setup Required

None - no external service configuration required. The DB migration SQL is at `prisma/05-DB-MIGRATION.sql` — run it manually against the MySQL database before using container/delivery features.

## Next Phase Readiness

- All Wave 2 and Wave 3 plans can now proceed: DAL functions, Server Actions, Zod schemas, and types are all in place
- Wave 2 (Plan 05-02): Container UI — page.tsx, containers-table.tsx, container-form.tsx, container-detail.tsx, container-labels-btn.tsx, container-notify-dialog.tsx
- Wave 3 (Plan 05-03): Domestic delivery UI + delivery calendar using getCalendarDeliveries()
- DB migration must be run on the production MySQL server before any container/delivery pages will function

## Self-Check: PASSED

All 10 key files found on disk. Task commits 155e2b5 and a6b606e verified in git log. npx tsc --noEmit exits 0. npx prisma generate completes with "Generated Prisma Client" and no errors. prisma/05-DB-MIGRATION.sql contains 6 CREATE TABLE IF NOT EXISTS statements.

---
*Phase: 05-containers-and-deliveries*
*Completed: 2026-03-23*
