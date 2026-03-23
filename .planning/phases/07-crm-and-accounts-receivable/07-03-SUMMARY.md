---
phase: 07-crm-and-accounts-receivable
plan: "03"
subsystem: ui
tags: [react, recharts, tanstack-table, react-pdf, windykacja, b2b-portal, server-actions, useActionState]

# Dependency graph
requires:
  - phase: 07-crm-and-accounts-receivable
    provides: "07-01 DAL: getAgingData, getWindykacjaCases, getWindykacjaCase, sendReminderAction, updateCaseStatusAction, createWindykacjaCaseAction"
  - phase: 07-crm-and-accounts-receivable
    provides: "07-02 Aether UI patterns: GlassCard, PageHeader, CRM page structure"
  - phase: 04-quotations-and-invoicing
    provides: "getInvoiceById DAL + react-pdf renderToBuffer + Buffer.from() pattern"
  - phase: 03-pricing-engine
    provides: "getUserPriceList(), calculateSalePrice() for B2B portal"

provides:
  - Windykacja aging dashboard at /windykacja with Recharts bucket chart + TanStack Table
  - Windykacja case detail page at /windykacja/[caseId] with status update + reminder history
  - SendReminderDialog component using useActionState + sendReminderAction
  - PDF Route Handler at /api/windykacja/pdf/[invoiceId] generating collection notice PDF
  - WindykacjaPdfTemplate react-pdf Document with ALLBAG header and payment demand
  - B2B portal layout at (b2b) route group with requireAuth() guard
  - B2B price list page at /portal/price-list showing computed sale prices

affects:
  - Phase 8 (HR/future phases) — B2B portal pattern established as separate route group
  - No further Phase 7 plans needed — this completes the phase

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AgingChart: Recharts BarChart with Cell per bar for individual bucket colors (amber/orange/red)"
    - "B2B portal layout: (b2b) route group without html/body tags (root layout already has them); only minimal portal shell"
    - "PDF Route Handler (windykacja): React.createElement + renderToBuffer + Buffer.from() wrapping — same as Phase 04-02 pattern"
    - "CaseDetailActions: separate client component for status update select + transition in case detail Server Component"
    - "useActionState with inline wrapper: SendReminderDialog uses useActionState with wrapper function to call toast and setShowDialog on success/error"

key-files:
  created:
    - src/app/(dashboard)/windykacja/page.tsx
    - src/app/(dashboard)/windykacja/[caseId]/page.tsx
    - src/app/(dashboard)/windykacja/[caseId]/_components/case-detail-actions.tsx
    - src/app/(dashboard)/windykacja/_components/aging-chart.tsx
    - src/app/(dashboard)/windykacja/_components/overdue-table.tsx
    - src/app/(dashboard)/windykacja/_components/send-reminder-dialog.tsx
    - src/app/(dashboard)/windykacja/_components/case-status-badge.tsx
    - src/app/api/windykacja/pdf/[invoiceId]/route.ts
    - src/lib/pdf/windykacja-template.tsx
    - src/app/(b2b)/layout.tsx
    - src/app/(b2b)/portal/price-list/page.tsx
  modified: []

key-decisions:
  - "B2B layout omits html/body tags — root layout.tsx already provides them; adding html/body in a nested Next.js layout would create invalid HTML nesting"
  - "CaseDetailActions extracted as separate client component — case detail page is a Server Component; status update needs useState + useTransition, so extracted to avoid mixing server/client"
  - "WindykacjaPdfTemplate: no @ts-nocheck needed; React.createElement in route handler sidesteps JSX typing issues as per Phase 04-02 pattern"
  - "getUserPriceList() used for B2B portal (requireAuth not requireAdmin) — already existed from Phase 07-01 RESEARCH; getPriceListById is admin-only"

patterns-established:
  - "Aging bucket UI: 4 GlassCard summary tiles + Recharts BarChart + TanStack Table in same page"
  - "B2B route group: (b2b)/layout.tsx with requireAuth() only, no sidebar, no Framer Motion"

requirements-completed: [WIND-01, WIND-02, WIND-03, WIND-04, CRM-05]

# Metrics
duration: 7min
completed: 2026-03-23
---

# Phase 7 Plan 03: Windykacja UI + B2B Portal Summary

**Windykacja aging dashboard (Recharts bucket chart + TanStack Table), case detail page with status updates and reminder history, react-pdf collection notice PDF Route Handler, and B2B portal (separate route group layout with requireAuth + computed price list view)**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-23T15:35:15Z
- **Completed:** 2026-03-23T15:42:19Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Windykacja aging dashboard at /windykacja: 4 bucket summary GlassCards (0–30/31–60/61–90/90+ dni), AgingChart Recharts BarChart with per-bar Cell coloring (amber/orange/red/dark red), OverdueTable with TanStack Table (sorted by daysOverdue desc, case open button, PDF link per row)
- Case detail page at /windykacja/[caseId]: invoice details, CaseStatusBadge, CaseDetailActions client component for status update via useTransition + updateCaseStatusAction, PDF download link, reminder history table with SendReminderDialog
- WindykacjaPdfTemplate: react-pdf Document with ALLBAG header, customer block, invoice details, overdue message, payment demand (7-day ultimatum), signature block — no @ts-nocheck
- PDF Route Handler: async params (Next.js 15), requireAdmin(), renderToBuffer + Buffer.from() wrapping, Content-Disposition attachment header
- B2B portal (b2b) route group: minimal layout (no sidebar/topbar/Framer Motion) with requireAuth(), user name in header; /portal/price-list computes sale prices from getUserPriceList() margin matrix, hides purchase prices and margins

## Task Commits

Each task was committed atomically:

1. **Task 1: Windykacja pages + PDF Route Handler + PDF template** - `7663b8d` (feat)
2. **Task 2: B2B portal layout + price list page** - `0fe108d` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/app/(dashboard)/windykacja/page.tsx` — Aging dashboard: requireAdmin, getAgingData, bucket cards, AgingChart, OverdueTable
- `src/app/(dashboard)/windykacja/[caseId]/page.tsx` — Case detail: getWindykacjaCase, invoice/case/reminder sections, SendReminderDialog, PDF link
- `src/app/(dashboard)/windykacja/[caseId]/_components/case-detail-actions.tsx` — Client component for status update select + updateCaseStatusAction
- `src/app/(dashboard)/windykacja/_components/aging-chart.tsx` — "use client" Recharts BarChart with Cell per bucket, ResponsiveContainer height=300
- `src/app/(dashboard)/windykacja/_components/overdue-table.tsx` — "use client" TanStack Table, createWindykacjaCaseAction on "Otwórz sprawę", PDF link per row
- `src/app/(dashboard)/windykacja/_components/send-reminder-dialog.tsx` — "use client" modal, useActionState + sendReminderAction, toast.success/error
- `src/app/(dashboard)/windykacja/_components/case-status-badge.tsx` — "use client" colored badge (sky/amber/orange/emerald/zinc)
- `src/app/api/windykacja/pdf/[invoiceId]/route.ts` — GET handler, await params, requireAdmin, getInvoiceById, renderToBuffer, Buffer.from()
- `src/lib/pdf/windykacja-template.tsx` — WindykacjaPdfTemplate with StyleSheet, no @ts-nocheck, Helvetica built-in font
- `src/app/(b2b)/layout.tsx` — B2B portal layout, requireAuth(), no html/body, header with user name
- `src/app/(b2b)/portal/price-list/page.tsx` — getUserPriceList, calculateSalePrice per product group, hides purchase prices

## Decisions Made

- B2B layout does NOT include `<html>` and `<body>` tags — the plan spec showed them but this would create invalid nested HTML since root `layout.tsx` already provides them. The B2B layout is a segment layout (div wrapper only), which is the correct Next.js App Router pattern. [Rule 1 - Bug]
- Extracted `CaseDetailActions` as a separate client component for the case detail page. The case detail page is a Server Component (data fetching, requireAdmin); the status update form needs useState + useTransition, requiring a client boundary. Extracting it follows the established Server Component + Client Content pattern from Phase 07-02.
- Used `getUserPriceList(user.id)` (requireAuth) instead of `getPriceListById(id)` (requireAdmin) for the B2B portal — the latter would reject non-admin B2B users. `getUserPriceList` was already built in Phase 07-01 specifically for this purpose.
- `WindykacjaPdfTemplate`: no @ts-nocheck needed (Phase 04-03 decision); React.createElement in the route handler with `as any` cast on component and element handles @react-pdf type strictness as established in Phase 04-02.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed html/body from B2B layout**
- **Found during:** Task 2 (B2B portal layout)
- **Issue:** Plan spec showed `<html lang="pl"><body>` in (b2b)/layout.tsx, but the root app/layout.tsx already provides html and body. Nesting html inside html would create invalid HTML.
- **Fix:** B2B layout is a div-based segment layout (standard Next.js nested layout pattern) — no html/body tags.
- **Files modified:** `src/app/(b2b)/layout.tsx`
- **Verification:** `npx tsc --noEmit` exits 0. `npx next build` exits 0. /portal/price-list route confirmed in build output.
- **Committed in:** `0fe108d` (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added CaseDetailActions as separate client component**
- **Found during:** Task 1 (case detail page)
- **Issue:** Case detail page spec called for status update select + button; these need useState + useTransition (client-only). Putting them directly in a Server Component would cause a "useState cannot be used in Server Components" build error.
- **Fix:** Extracted `CaseDetailActions` client component with status select + updateCaseStatusAction + toast feedback.
- **Files modified:** `src/app/(dashboard)/windykacja/[caseId]/_components/case-detail-actions.tsx`
- **Verification:** `npx tsc --noEmit` exits 0.
- **Committed in:** `7663b8d` (Task 1 commit)

**3. [Rule 1 - Bug] Fixed Recharts Tooltip formatter TypeScript incompatibility**
- **Found during:** Task 1 (AgingChart)
- **Issue:** `formatter` prop typed as `Formatter<ValueType, NameType>` where value is `ValueType | undefined` — passing `(value: number, ...)` caused TS2322 type error.
- **Fix:** Changed parameter types to `(value: unknown, _name: unknown, props: TooltipPayload)` with `Number(value)` cast inside formatter body.
- **Files modified:** `src/app/(dashboard)/windykacja/_components/aging-chart.tsx`
- **Verification:** `npx tsc --noEmit` exits 0.
- **Committed in:** `7663b8d` (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 bug fix, 1 missing critical component extraction, 1 TypeScript bug fix)
**Impact on plan:** All three necessary for build correctness and correct HTML structure. No scope creep.

## Issues Encountered

None — `npx tsc --noEmit` exits 0. `npx next build` exits 0. All 4 target routes confirmed in build output: /windykacja, /windykacja/[caseId], /portal/price-list, /api/windykacja/pdf/[invoiceId].

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 7 is complete: CRM data layer (07-01) + CRM UI (07-02) + Windykacja UI + B2B portal (07-03) all delivered
- Requirements CRM-01 through CRM-06 and WIND-01 through WIND-04 fully implemented
- DB tables from 07-DB-MIGRATION.sql must be created before the app can serve live CRM/Windykacja data

## Self-Check: PASSED

All 11 files confirmed on disk. Commits 7663b8d and 0fe108d verified in git log. `npx tsc --noEmit` exits 0. `npx next build` exits 0 with /windykacja, /windykacja/[caseId], /portal/price-list, /api/windykacja/pdf/[invoiceId] confirmed in build output.

---
*Phase: 07-crm-and-accounts-receivable*
*Completed: 2026-03-23*
