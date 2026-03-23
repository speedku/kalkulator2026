---
phase: 06-dashboard-and-analytics
plan: "03"
subsystem: ui
tags: [recharts, analytics, xlsx, sheetjs, bar-chart, line-chart, server-components, react-19]

# Dependency graph
requires:
  - phase: 06-01
    provides: "getSalesAnalytics, getYoYComparison, getWoWComparison, getTopProducts, getPackerStats, getDeadStock, getWarehouseKpis — all analytics DAL functions"
  - phase: 06-02
    provides: "Layout + design patterns (GlassCard, StatCard, PageHeader, _components structure)"

provides:
  - Sales analytics page at /analytics with monthly/weekly BarChart, YoY LineChart, top 10 products table
  - Paczkarnia analytics page at /analytics/paczkarnia with packer efficiency BarChart + graceful empty state
  - Warehouse dashboard at /analytics/warehouse with 3 StatCards (KPIs) + dead stock table
  - Excel export Route Handler at /api/analytics/export?report={sales|wow|paczkarnia|dead-stock}
  - Export download links on all three analytics pages

affects:
  - Phase 7+ (all admin analytics views are complete; pattern for SheetJS xlsx export established)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SheetJS require() import: xlsx uses CommonJS — import via require() with TypeScript cast, not ESM import * as"
    - "xlsx Buffer fix: Buffer.from(XLSX.write(wb, { type: 'buffer' })) wraps ArrayBufferLike for valid BodyInit in Next.js Response"
    - "Analytics data flow: Server Component requireAdmin() + Promise.all DAL calls → typed props → use client chart components"
    - "Graceful empty state: both PackerChart (use client) and TopProductsTable/DeadStockTable render dedicated empty messages when data is empty"

key-files:
  created:
    - src/app/(dashboard)/analytics/page.tsx
    - src/app/(dashboard)/analytics/_components/sales-chart.tsx
    - src/app/(dashboard)/analytics/_components/yoy-chart.tsx
    - src/app/(dashboard)/analytics/_components/top-products-table.tsx
    - src/app/(dashboard)/analytics/paczkarnia/page.tsx
    - src/app/(dashboard)/analytics/paczkarnia/_components/packer-chart.tsx
    - src/app/(dashboard)/analytics/warehouse/page.tsx
    - src/app/(dashboard)/analytics/warehouse/_components/dead-stock-table.tsx
    - src/app/api/analytics/export/route.ts
  modified: []

key-decisions:
  - "SheetJS require() instead of ESM import: xlsx 0.20.3 CommonJS module cannot be imported with import * as XLSX — require() cast avoids ESLint/TS module resolution issues cleanly"
  - "Buffer.from() wrapping for xlsx output: XLSX.write() returns Buffer<ArrayBufferLike> which is not directly assignable to BodyInit; Buffer.from() produces a valid Uint8Array-compatible buffer (same pattern used in Phase 04-02 for react-pdf)"
  - "YoYChart pivot: data pivoted from row-per-month-per-year into 12-point array with year columns for Recharts LineChart multi-line rendering"

patterns-established:
  - "Analytics page structure: requireAdmin() guard + Promise.all DAL calls + 'use client' chart components receiving typed props"
  - "Export route pattern: GET Route Handler + SheetJS json_to_sheet + Buffer.from(XLSX.write) + Content-Disposition attachment header"

requirements-completed: [ANAL-01, ANAL-02, ANAL-03, ANAL-04, ANAL-05, ANAL-06]

# Metrics
duration: 3min
completed: 2026-03-23
---

# Phase 6 Plan 03: Analytics Pages & Excel Export Summary

**Three admin analytics pages (sales hub with BarChart + YoY LineChart, paczkarnia packer stats, warehouse KPI dashboard) plus SheetJS Excel export Route Handler — all 9 files compile cleanly and `npx next build` passes with routes /analytics, /analytics/paczkarnia, /analytics/warehouse, and /api/analytics/export**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-23T14:45:39Z
- **Completed:** 2026-03-23T14:49:25Z
- **Tasks:** 2
- **Files modified:** 9 (all created)

## Accomplishments

- Sales analytics page at `/analytics`: monthly/weekly BarChart with tab toggle (SalesChart), YoY LineChart with pivot data (YoYChart), top 10 products table, export link
- Paczkarnia analytics page at `/analytics/paczkarnia`: packer efficiency BarChart with graceful empty state when `packer_live_stats` is empty or absent
- Warehouse dashboard at `/analytics/warehouse`: 3 StatCards (containers in transit, completed, total USD value) + DeadStockTable with date-fns pl locale
- Excel export Route Handler at `/api/analytics/export`: 4 report types (sales, wow, paczkarnia, dead-stock) using SheetJS `json_to_sheet` + `XLSX.write` + `Content-Disposition: attachment`
- All chart components have `"use client"` directive; all page files are Server Components with `requireAdmin()`

## Task Commits

Each task was committed atomically:

1. **Task 1: Sales analytics page + charts + top products table** - `a73914f` (feat)
2. **Task 2: Paczkarnia + warehouse pages + Excel export Route Handler** - `7177a02` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/app/(dashboard)/analytics/page.tsx` — Server Component, requireAdmin(), Promise.all for 4 DAL calls, export link
- `src/app/(dashboard)/analytics/_components/sales-chart.tsx` — use client BarChart with monthly/weekly tab toggle
- `src/app/(dashboard)/analytics/_components/yoy-chart.tsx` — use client LineChart with year-pivot for multi-year comparison
- `src/app/(dashboard)/analytics/_components/top-products-table.tsx` — Server Component table with graceful empty state
- `src/app/(dashboard)/analytics/paczkarnia/page.tsx` — Server Component, requireAdmin(), nested try/catch for getPackerStats
- `src/app/(dashboard)/analytics/paczkarnia/_components/packer-chart.tsx` — use client BarChart with empty-state fallback
- `src/app/(dashboard)/analytics/warehouse/page.tsx` — Server Component, 3 StatCards (Ship/CheckCircle/DollarSign icons), DeadStockTable
- `src/app/(dashboard)/analytics/warehouse/_components/dead-stock-table.tsx` — Server Component with date-fns pl locale and empty praise message
- `src/app/api/analytics/export/route.ts` — GET Route Handler, SheetJS xlsx via require(), Buffer.from() wrapping, 4 report types

## Decisions Made

- `require("xlsx")` instead of `import * as XLSX from "xlsx"`: SheetJS 0.20.3 uses CommonJS module format; ESM import causes TypeScript module resolution issues; `require()` with TypeScript cast resolves cleanly
- `Buffer.from(XLSX.write(...))` wrapping: `XLSX.write()` returns `Buffer<ArrayBufferLike>` which TypeScript rejects as `BodyInit`; `Buffer.from()` produces a valid buffer (identical pattern to Phase 04-02's react-pdf fix)
- YoY pivot in client component: server passes `YoYRow[]` (year+month+revenue rows); client pivots to 12-point array with year-named columns for Recharts multi-line rendering — keeps server component simple

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Buffer type incompatibility in Excel export route**
- **Found during:** Task 2 (TypeScript check of export/route.ts)
- **Issue:** `XLSX.write(wb, { type: "buffer" })` returns `Buffer<ArrayBufferLike>` which TypeScript cannot assign to `BodyInit` in `new Response(buf, ...)` — TS2345 error
- **Fix:** Wrapped with `Buffer.from(XLSX.write(...) as ArrayBuffer)` to produce a proper buffer type compatible with BodyInit
- **Files modified:** `src/app/api/analytics/export/route.ts`
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `7177a02` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug)
**Impact on plan:** Fix essential for TypeScript correctness. No scope creep — identical pattern used in Phase 04-02.

## Issues Encountered

None — `npx tsc --noEmit` exits 0 after auto-fix. `npx next build` exits 0 with all 4 new routes listed in output. Pre-existing ESLint warnings in audit-log-table.tsx and quotation-builder/index.tsx are out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 6 complete: all DASH-01 through DASH-06 and ANAL-01 through ANAL-06 requirements fulfilled across plans 06-01, 06-02, and 06-03
- Analytics infrastructure ready for Phase 7+
- Excel export pattern established (SheetJS require() + Buffer.from wrapping) for reuse in future export features

## Self-Check: PASSED

All 9 created files confirmed on disk. Commits a73914f and 7177a02 verified in git log. `npx tsc --noEmit` exits 0. `npx next build` exits 0 with /analytics (6.65 kB), /analytics/paczkarnia (1.18 kB), /analytics/warehouse (661 B), and /api/analytics/export (156 B) in route output.

---
*Phase: 06-dashboard-and-analytics*
*Completed: 2026-03-23*
