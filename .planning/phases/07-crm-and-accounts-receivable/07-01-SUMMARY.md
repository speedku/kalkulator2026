---
phase: 07-crm-and-accounts-receivable
plan: "01"
subsystem: database
tags: [prisma, mysql, crm, windykacja, accounts-receivable, zod, server-actions, date-fns, nodemailer]

# Dependency graph
requires:
  - phase: 04-quotations-and-invoicing
    provides: "Invoice model with dueAt, totalGross, status fields — aging computation source"
  - phase: 03-pricing-engine
    provides: "PriceList model — Customer.priceListId FK target"
  - phase: 01-foundation-auth-and-system-shell
    provides: "requireAdmin(), email.ts with createTransport + emailTemplate helpers"

provides:
  - Customer, Lead, Deal, BrandWatchItem, WindykacjaCase, ReminderLog Prisma models
  - 07-DB-MIGRATION.sql with 6 CREATE TABLE IF NOT EXISTS statements
  - DAL: getCustomers, getCustomerById, createCustomer, updateCustomer (soft delete), deleteCustomer, getLeads, createLead, updateLead, deleteLead, getDeals, createDeal, updateDeal, getBrandWatchItems, createBrandWatchItem, updateBrandWatchItem, deleteBrandWatchItem
  - DAL: getAgingData (differenceInDays aging buckets), getWindykacjaCases, getWindykacjaCase, createWindykacjaCase, updateCaseStatus, logReminder
  - Server Actions: crm.ts (customer/lead/deal/brand watch CRUD), windykacja.ts (case create/status/reminder)
  - Zod schemas: CustomerSchema, LeadSchema, DealSchema, BrandWatchItemSchema, WindykacjaCaseSchema, SendReminderSchema
  - sendPaymentReminderEmail() in email.ts with 4 escalation levels (pl-PL labels)
  - Navigation: CRM group (Klienci, Leady, Pipeline) + Windykacja added to sidebarItems

affects:
  - Phase 7 Plan 02 (CRM UI — depends entirely on crm.ts DAL + actions)
  - Phase 7 Plan 03 (Windykacja UI — depends entirely on windykacja.ts DAL + actions + sendPaymentReminderEmail)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Aging bucket computation: differenceInDays(new Date(), dueAt) in TypeScript, not SQL — returns AgingBucket type current/0-30/31-60/61-90/90+"
    - "Soft delete for Customer: updateCustomer({ isActive: false }) — preserves FK relations to deals/leads/windykacjaCases"
    - "Best-effort email with always-log: try { sendPaymentReminderEmail } catch {}, then always logReminder with sent/failed status"
    - "Decimal → number coercion: Number(inv.totalGross) in all DAL map functions (Phase 03-01 pattern)"
    - "requireAdmin() at top of every DAL function — server-only import + auth guard on all CRM/windykacja data"

key-files:
  created:
    - prisma/schema.prisma (modified — 6 new models + back-relations)
    - .planning/phases/07-crm-and-accounts-receivable/07-DB-MIGRATION.sql
    - src/lib/dal/crm.ts
    - src/lib/dal/windykacja.ts
    - src/lib/actions/crm.ts
    - src/lib/actions/windykacja.ts
    - src/lib/validations/crm.ts
    - src/lib/validations/windykacja.ts
  modified:
    - src/lib/email.ts (added sendPaymentReminderEmail)
    - src/lib/navigation.ts (added CRM + Windykacja nav items)

key-decisions:
  - "Soft delete for Customer: deleteCustomer() sets isActive=false to preserve historical deal/lead/windykacja relations instead of hard deleting"
  - "Best-effort email in sendReminderAction: try/catch around sendPaymentReminderEmail, logReminder always called regardless of email result — action never fails due to SMTP issues"
  - "aging query filter: dueAt < new Date() in Prisma where clause to restrict to past-due invoices only (not future-due)"
  - "WindykacjaCase.@@unique([invoiceId]): one case per invoice enforced at DB level; createWindykacjaCaseAction returns friendly error on duplicate"

patterns-established:
  - "AgingBucket type: current | 0-30 | 31-60 | 61-90 | 90+ — TypeScript computed from differenceInDays"
  - "CRM DAL pattern: requireAdmin() + prisma.model.findMany/create/update with typed interfaces, no Prisma Decimal leaks (Number() coercion)"
  - "sendReminderAction: parse → get case → try email → always log → update status — Windykacja escalation flow"

requirements-completed: [CRM-01, CRM-02, CRM-03, CRM-04, CRM-05, CRM-06, WIND-01, WIND-02, WIND-03, WIND-04]

# Metrics
duration: 7min
completed: 2026-03-23
---

# Phase 7 Plan 01: CRM & Windykacja Data Layer Summary

**6 new Prisma models (Customer, Lead, Deal, BrandWatchItem, WindykacjaCase, ReminderLog) with full DAL, Server Actions, Zod schemas, payment reminder email function, and CRM/Windykacja navigation — all 10 files TypeScript-clean with npx next build passing**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-23T15:12:04Z
- **Completed:** 2026-03-23T15:19:42Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- 6 new Prisma models appended to schema.prisma with correct FK relations, back-relations on Invoice and PriceList, and `@@map` snake_case table names
- 07-DB-MIGRATION.sql with 6 `CREATE TABLE IF NOT EXISTS` statements (customers, leads, deals, brand_watch_items, windykacja_cases, reminder_logs) — InnoDB/utf8mb4
- CRM DAL (crm.ts): full CRUD for Customer (soft delete), Lead (hard delete), Deal, BrandWatchItem with typed row interfaces and `requireAdmin()` guard
- Windykacja DAL (windykacja.ts): `getAgingData()` computes aging buckets using `differenceInDays` from date-fns, `logReminder()` for reminder audit trail
- Server Actions with Zod safeParse and error handling; `sendReminderAction` uses best-effort email pattern with always-log guarantee
- `sendPaymentReminderEmail()` with 4 Polish escalation level labels (Pierwsze/Drugie/Pilne/Ostateczne) and Aether-styled email template
- Navigation updated: CRM group (Klienci/Leady/Pipeline) + Windykacja added before admin settings

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema extension (6 models) + DB migration SQL** - `99b64a9` (feat)
2. **Task 2: DAL files, Server Actions, Zod schemas, email extension, navigation** - `6fc6d09` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `prisma/schema.prisma` — 6 new models + Invoice.invoiceCase back-relation + PriceList.customers back-relation
- `.planning/phases/07-crm-and-accounts-receivable/07-DB-MIGRATION.sql` — 6 CREATE TABLE IF NOT EXISTS statements
- `src/lib/dal/crm.ts` — Customer/Lead/Deal/BrandWatchItem CRUD with requireAdmin() and typed interfaces
- `src/lib/dal/windykacja.ts` — getAgingData() with differenceInDays, getWindykacjaCases/Case, createWindykacjaCase, updateCaseStatus, logReminder
- `src/lib/actions/crm.ts` — Server Actions for customer/lead/deal/brand watch CRUD with FormData parsing
- `src/lib/actions/windykacja.ts` — createWindykacjaCaseAction, updateCaseStatusAction, sendReminderAction
- `src/lib/validations/crm.ts` — CustomerSchema, LeadSchema, DealSchema, BrandWatchItemSchema
- `src/lib/validations/windykacja.ts` — WindykacjaCaseSchema, SendReminderSchema
- `src/lib/email.ts` — added sendPaymentReminderEmail() with level labels + HTML body
- `src/lib/navigation.ts` — added Users2, TrendingUp, BarChart2, AlertTriangle icons + CRM/Windykacja nav entries

## Decisions Made

- Soft delete for Customer: `deleteCustomer()` sets `isActive: false` to preserve historical FK relations to deals, leads, and windykacja cases
- Best-effort email: `sendReminderAction` wraps `sendPaymentReminderEmail()` in try/catch; `logReminder()` is always called with "sent" or "failed" status — action never throws due to SMTP errors
- Aging query filter includes `dueAt: { lt: new Date() }` in Prisma where to restrict results to past-due invoices only
- `WindykacjaCase.@@unique([invoiceId])` enforces one case per invoice at DB level; action returns friendly Polish error on duplicate key

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — `npx tsc --noEmit` exits 0. `npx next build` exits 0. `npx prisma validate` exits 0. `npx prisma generate` exits 0.

## User Setup Required

None - no external service configuration required. The 6 new MySQL tables must be created by running `07-DB-MIGRATION.sql` in phpMyAdmin or via `prisma db execute --file .planning/phases/07-crm-and-accounts-receivable/07-DB-MIGRATION.sql` before using the CRM/Windykacja UI pages in plans 07-02 and 07-03.

## Next Phase Readiness

- Plan 07-02 (CRM UI) can begin immediately: `getCustomers`, `getLeads`, `getDeals`, `getBrandWatchItems` + all Server Actions are in place
- Plan 07-03 (Windykacja UI) can begin immediately: `getAgingData`, `getWindykacjaCases`, `sendReminderAction` are all implemented
- DB tables must be created via `07-DB-MIGRATION.sql` before running the app with CRM/Windykacja data

## Self-Check: PASSED

All 10 files confirmed on disk. Commits 99b64a9 and 6fc6d09 verified in git log. `npx prisma validate` exits 0. `npx prisma generate` exits 0. `npx tsc --noEmit` exits 0. `npx next build` exits 0.

---
*Phase: 07-crm-and-accounts-receivable*
*Completed: 2026-03-23*
