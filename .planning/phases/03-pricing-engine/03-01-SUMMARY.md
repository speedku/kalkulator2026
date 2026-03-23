---
phase: 03-pricing-engine
plan: "01"
subsystem: database
tags: [prisma, price-lists, margins, zod, server-actions, dal, mysql, decimal]

# Dependency graph
requires:
  - phase: 02-product-management
    plan: "01"
    provides: "ProductGroup model already in schema (id, name, displayOrder); prisma import convention; server-only DAL pattern"
  - phase: 02-product-management
    plan: "02"
    provides: "ActionState type; Zod v4 issues[0] pattern; zodResolver + z.input<> convention"

provides:
  - "PriceList and PriceListMargin Prisma models in schema.prisma"
  - "User.priceListId Int? relation to PriceList"
  - "ProductGroup.margins PriceListMargin[] back-relation"
  - "calculateSalePrice(purchasePrice, marginPercent): number — gross margin formula, reusable in Phase 4"
  - "getPriceLists, getPriceListById, createPriceList, updatePriceList, deletePriceList — admin-guarded CRUD"
  - "batchUpsertMargins — atomic prisma.$transaction upsert for margin matrix"
  - "clonePriceList — deep copy (header + all margins) in single transaction"
  - "getUserPriceList — user-facing read with margins and group names"
  - "6 Server Actions: createPriceListAction, updatePriceListAction, deletePriceListAction, batchUpsertMarginsAction, clonePriceListAction, assignPriceListAction"
  - "Zod schemas: createPriceListSchema, updatePriceListSchema, batchMarginsSchema, assignPriceListSchema, clonePriceListSchema"
  - "03-DB-MIGRATION.sql — raw SQL for when real DB creds are available"
affects:
  - "04-quotations (depends on calculateSalePrice, getUserPriceList, getPriceLists)"
  - "05-containers (same DAL/Server Action patterns)"
  - "admin users page (assignPriceListAction, User.priceListId)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gross margin formula: salePrice = cost / (1 - marginPercent/100); confirmed from kalkulator2025/api/price-lists.php"
    - "Prisma Decimal coercion: Number(m.marginPercent) before arithmetic — avoids IEEE 754 errors"
    - "Compound unique upsert: @@unique([priceListId, productGroupId]) generates priceListId_productGroupId key name for prisma.priceListMargin.upsert where clause"
    - "Deep clone transaction: prisma.$transaction with findUniqueOrThrow + create header + createMany margins"

key-files:
  created:
    - "prisma/schema.prisma — PriceList, PriceListMargin models; User.priceListId; ProductGroup.margins back-relation"
    - "src/types/price-lists.ts — PriceListRow, MarginMatrixEntry, PriceListWithMargins types"
    - "src/lib/validations/price-lists.ts — 5 Zod schemas with Polish error messages"
    - "src/lib/dal/price-lists.ts — server-only DAL with calculateSalePrice + 8 exported functions"
    - "src/lib/actions/price-lists.ts — 6 Server Actions with Zod validation"
    - ".planning/phases/03-pricing-engine/03-DB-MIGRATION.sql — raw SQL for CREATE TABLE + ALTER TABLE"
  modified:
    - "prisma/schema.prisma — extended User model (priceListId) and ProductGroup model (margins back-relation)"

key-decisions:
  - "calculateSalePrice accepts number | { toNumber(): number } union type — handles both plain number and Prisma Decimal without callers needing to coerce explicitly"
  - "ActionState type redeclared in actions/price-lists.ts (not imported from products.ts) — avoids cross-action import coupling; identical shape"
  - "getPriceLists uses requireAuth() (not requireAdmin()) — regular users need to see available price lists for quotation builder; admin-only is too restrictive"
  - "03-DB-MIGRATION.sql uses CREATE TABLE IF NOT EXISTS and ALTER TABLE ADD COLUMN IF NOT EXISTS — safe to re-run if tables already exist in production"

patterns-established:
  - "Gross margin pricing: calculateSalePrice(cost, margin) = cost / (1 - margin/100) — established for Phase 4 reuse"
  - "Prisma Decimal pattern: always Number(decimalField) before arithmetic in DAL map functions"
  - "Compound upsert: @@unique([a, b]) → fieldA_fieldB as Prisma where key in upsert"

requirements-completed: [PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05]

# Metrics
duration: 3min
completed: "2026-03-23"
---

# Phase 3 Plan 01: Pricing Engine Data Foundation Summary

**PriceList + PriceListMargin Prisma models, full DAL with gross-margin calculateSalePrice formula, 6 Server Actions with Polish Zod validation, and manual DB migration SQL — data foundation for Phase 4 Quotations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-23T12:14:23Z
- **Completed:** 2026-03-23T12:17:07Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Prisma schema extended with `PriceList` and `PriceListMargin` models, `User.priceListId` optional relation, and `ProductGroup.margins` back-relation; `npx prisma generate` passes clean
- Full DAL (`src/lib/dal/price-lists.ts`) with `calculateSalePrice` (gross-margin formula confirmed from kalkulator2025), CRUD functions guarded by `requireAuth()`/`requireAdmin()`, atomic `batchUpsertMargins` via `prisma.$transaction`, deep `clonePriceList` transaction, and `getUserPriceList` for user-facing view
- 5 Zod validation schemas with Polish error messages + 6 Server Actions following established Phase 2 patterns (`result.error.issues[0]?.message`, `revalidatePath`, try/catch ActionState)
- All Prisma `Decimal` fields coerced with `Number()` before arithmetic; `@@unique` compound key `priceListId_productGroupId` used correctly in upsert `where` clause
- `03-DB-MIGRATION.sql` documents exact `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN IF NOT EXISTS` statements for when real DB credentials are available

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema extension** - `d27ff94` (feat)
2. **Task 2: DAL, validations, types, Server Actions** - `2d66a7f` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `prisma/schema.prisma` - Added PriceList model, PriceListMargin model, User.priceListId relation, ProductGroup.margins back-relation
- `src/types/price-lists.ts` - PriceListRow, MarginMatrixEntry (Decimal already coerced to number), PriceListWithMargins types
- `src/lib/validations/price-lists.ts` - createPriceListSchema, updatePriceListSchema, marginEntrySchema, batchMarginsSchema, assignPriceListSchema, clonePriceListSchema + inferred types
- `src/lib/dal/price-lists.ts` - server-only, calculateSalePrice, getPriceLists, getPriceListById, createPriceList, updatePriceList, deletePriceList, batchUpsertMargins, clonePriceList, getUserPriceList
- `src/lib/actions/price-lists.ts` - createPriceListAction, updatePriceListAction, deletePriceListAction, batchUpsertMarginsAction, clonePriceListAction, assignPriceListAction
- `.planning/phases/03-pricing-engine/03-DB-MIGRATION.sql` - Manual migration SQL with IF NOT EXISTS guards

## Decisions Made

- `calculateSalePrice` accepts `number | { toNumber(): number }` union — handles both raw numbers and Prisma Decimal objects so callers don't need to coerce before passing
- `ActionState` redeclared locally in `actions/price-lists.ts` rather than imported from `products.ts` — avoids coupling between action files; the type is trivial (`{ error?: string; success?: string }`)
- `getPriceLists` uses `requireAuth()` not `requireAdmin()` — regular users need to browse available price lists for the quotation builder (Phase 4); admin-only would break that flow
- SQL migration file uses `ADD COLUMN IF NOT EXISTS` guard — MySQL 8 supports this syntax; safe to re-run if column already exists

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — `npx prisma generate` and `npx tsc --noEmit` both passed on first attempt. Formula verified: `calculateSalePrice(10, 80) = 50.00`, `calculateSalePrice(10, 50) = 20.00`.

## User Setup Required

None - no external service configuration required. When DATABASE_URL is configured with real MySQL credentials, run `.planning/phases/03-pricing-engine/03-DB-MIGRATION.sql` on the `allbag_kalkulator` database before using any pricing features.

## Next Phase Readiness

- Phase 3 Plan 01 complete — data foundation for pricing engine is in place
- `calculateSalePrice` exported from DAL, ready for Phase 4 (Quotations) line-item pricing
- `getUserPriceList` ready for Phase 3 Plan 02 (UI) and Phase 4 quotation builder
- Phase 3 Plan 02 (Price List UI) can proceed immediately — all DAL functions and Server Actions are ready

## Self-Check: PASSED

All created files confirmed on disk. Both task commits (d27ff94, 2d66a7f) confirmed in git log.

---
*Phase: 03-pricing-engine*
*Completed: 2026-03-23*
