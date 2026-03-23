---
phase: 04-quotations-and-invoicing
plan: "03"
subsystem: ui
tags: [react, nextjs, react-pdf, invoices, labels, tailwind, pdf]

# Dependency graph
requires:
  - phase: 04-quotations-and-invoicing
    provides: Plan 01 — Invoice DAL, Server Actions, types; Plan 02 — UI patterns, component structure
  - phase: 03-pricing-engine
    provides: getProductsForBuilder() DAL function with BuilderProduct type

provides:
  - InvoicePdfTemplate — @react-pdf/renderer A4 VAT invoice template with net/VAT/gross breakdown
  - GET /api/invoices/[id]/pdf — PDF download Route Handler
  - Invoice list page /invoices with status + date URL-state filters
  - Invoice create page /invoices/new with product search, dynamic line items, VAT preview
  - Invoice detail page /invoices/[id] with VAT breakdown and actions bar
  - InvoiceActionsBar — PDF download (basePath-aware), delete with confirmation
  - Shipping labels print page /labels — Server Component + Client generateLabelHtml + window.print()

affects:
  - 07-crm (Phase 7 will wire real order data to labels page)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Invoice PDF template: no @ts-nocheck needed — direct JSX in .tsx works with react-pdf types"
    - "Labels page split: Server Component for requireAdmin() + Client Component for window APIs"
    - "basePath PDF link: /kalkulator2026/api/invoices/{id}/pdf in plain <a download> tags"
    - "Dynamic line items managed as local React state array (no Zustand — single-page form)"

key-files:
  created:
    - src/lib/pdf/invoice-template.tsx
    - src/app/api/invoices/[id]/pdf/route.ts
    - src/app/(dashboard)/invoices/page.tsx
    - src/app/(dashboard)/invoices/_components/invoices-table.tsx
    - src/app/(dashboard)/invoices/new/page.tsx
    - src/app/(dashboard)/invoices/new/_components/invoice-form.tsx
    - src/app/(dashboard)/invoices/[id]/page.tsx
    - src/app/(dashboard)/invoices/[id]/_components/invoice-detail.tsx
    - src/app/(dashboard)/invoices/[id]/_components/invoice-actions-bar.tsx
    - src/app/(dashboard)/labels/page.tsx
    - src/app/(dashboard)/labels/_components/labels-client.tsx
  modified:
    - src/types/invoices.ts (added notes field to InvoiceRow)
    - src/lib/dal/invoices.ts (added notes to select + mapping in getInvoices/getInvoiceById)
    - src/lib/pdf/quotation-template.tsx (removed @ts-nocheck + unused eslint-disable)

key-decisions:
  - "@ts-nocheck not needed in .tsx PDF templates — TypeScript handles react-pdf JSX without pragma workarounds"
  - "Labels page uses Server Component shell (requireAdmin) + Client Component (window.print) split — consistent with all admin pages"
  - "Invoice form uses local React state for line items (not Zustand) — single-page form, no wizard pattern needed"

patterns-established:
  - "Admin page pattern: Server Component calls requireAdmin(), passes data to Client Component"
  - "Labels print pattern: generateLabelHtml() produces full HTML doc string, window.open() + window.print() for native print dialog"

requirements-completed: [FACT-01, FACT-05, FACT-06, FACT-07]

# Metrics
duration: 8min
completed: 2026-03-23
---

# Phase 4 Plan 03: Invoice UI and Shipping Labels Summary

**Full invoice CRUD UI with VAT PDF export and browser-native shipping labels print using @react-pdf/renderer and window.print()**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-23T13:11:34Z
- **Completed:** 2026-03-23T13:20:19Z
- **Tasks:** 2
- **Files modified:** 13 (11 created, 2 modified, 1 pre-existing fix)

## Accomplishments

- InvoicePdfTemplate with full VAT breakdown (Wartość netto / VAT / Do zapłaty), no React hooks, all data as props
- GET /api/invoices/[id]/pdf Route Handler using React.createElement + Buffer.from() pattern from Plan 02
- Invoice list page with status badges (draft/issued/paid/cancelled) and URL-state filters
- Invoice create form with product search dropdown, dynamic line items, VAT preview, useTransition submit
- Invoice detail page showing customer info, items table, VAT summary, actions bar
- InvoiceActionsBar: PDF download with basePath-prefixed href, delete with confirmation dialog
- Shipping labels: Server Component for auth + Client Component for generateLabelHtml + window.print()
- Phase 4 complete: all QUOT-* and FACT-* requirements addressed

## Task Commits

Each task was committed atomically:

1. **Task 1: Invoice PDF template, Route Handler, list page, create form** - `ec4c010` (feat)
2. **Task 2: Invoice detail page, actions bar, shipping labels** - `9488b89` (feat)
3. **Build fixes: ESLint errors in PDF templates and invoice form** - `4b3cd4d` (fix)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/lib/pdf/invoice-template.tsx` — @react-pdf/renderer A4 template, VAT breakdown, no React hooks
- `src/app/api/invoices/[id]/pdf/route.ts` — GET Route Handler, React.createElement + Buffer.from()
- `src/app/(dashboard)/invoices/page.tsx` — Server Component, requireAdmin(), status+date URL filters
- `src/app/(dashboard)/invoices/_components/invoices-table.tsx` — Client table, status badges, filter bar
- `src/app/(dashboard)/invoices/new/page.tsx` — Server shell, getProductsForBuilder()
- `src/app/(dashboard)/invoices/new/_components/invoice-form.tsx` — Client form, dynamic line items, VAT preview
- `src/app/(dashboard)/invoices/[id]/page.tsx` — Server Component, notFound() guard, await params
- `src/app/(dashboard)/invoices/[id]/_components/invoice-detail.tsx` — Client detail view with VAT breakdown
- `src/app/(dashboard)/invoices/[id]/_components/invoice-actions-bar.tsx` — PDF download + delete actions
- `src/app/(dashboard)/labels/page.tsx` — Server Component calling requireAdmin()
- `src/app/(dashboard)/labels/_components/labels-client.tsx` — generateLabelHtml + window.print()
- `src/types/invoices.ts` — Added missing `notes` field to InvoiceRow
- `src/lib/dal/invoices.ts` — Added `notes` to getInvoices select + getInvoiceById mapping
- `src/lib/pdf/quotation-template.tsx` — Removed @ts-nocheck (pre-existing build failure)

## Decisions Made

- Discovered `@ts-nocheck` was not actually needed in PDF templates (Plan 02 decision was incorrect). The `.tsx` extension with react-pdf's own types works without the pragma. Removed from both templates. The `React.createElement` approach in Route Handlers still uses `any` casts at those specific lines.
- Labels page split into Server Component (`page.tsx`) + Client Component (`labels-client.tsx`) so `requireAdmin()` runs server-side while `window.print()` stays in the client component. Consistent with all other admin pages.
- Invoice form uses local React state array for line items (not Zustand). The form is single-page, not a wizard, so page-scoped Zustand would be over-engineering.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing `notes` field in InvoiceRow type and DAL**
- **Found during:** Task 2 (InvoiceDetail component)
- **Issue:** `InvoiceRow` type and `getInvoices`/`getInvoiceById` DAL functions didn't include `notes` field, but `createInvoice` stores it and InvoiceDetail tries to render it — TypeScript error TS2339
- **Fix:** Added `notes: string | null` to `InvoiceRow`, added `notes: true` to `getInvoices` select, added explicit mapping in both getInvoices and getInvoiceById
- **Files modified:** src/types/invoices.ts, src/lib/dal/invoices.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 9488b89 (Task 2 commit)

**2. [Rule 1 - Bug] @ts-nocheck banned by ESLint `ban-ts-comment` rule**
- **Found during:** Build verification (npx next build)
- **Issue:** Both PDF templates had `// @ts-nocheck` which violates `@typescript-eslint/ban-ts-comment`. Blocked production build.
- **Fix:** Removed `@ts-nocheck` from both templates — TypeScript compiles them cleanly without it
- **Files modified:** src/lib/pdf/invoice-template.tsx, src/lib/pdf/quotation-template.tsx
- **Verification:** `npx next build` passes
- **Committed in:** 4b3cd4d (fix commit)

**3. [Rule 1 - Bug] useActionState unused import + `<a>` used for navigation**
- **Found during:** Build verification (npx next build)
- **Issue:** `useActionState` imported but unused; `<a href="/invoices">` triggers `no-html-link-for-pages` ESLint error. Both blocked production build.
- **Fix:** Removed `useActionState` import; replaced `<a>` with Next.js `<Link>`
- **Files modified:** src/app/(dashboard)/invoices/new/_components/invoice-form.tsx
- **Verification:** `npx next build` passes
- **Committed in:** 4b3cd4d (fix commit)

---

**Total deviations:** 3 auto-fixed (3 bugs)
**Impact on plan:** All fixes necessary for correct types and passing build. The @ts-nocheck removal is actually an improvement — it means the PDF templates compile correctly without type suppression. No scope creep.

## Issues Encountered

None — all issues resolved via deviation rules above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 complete: quotation UI (Plan 02) + invoice UI + labels (Plan 03) all built
- All QUOT-01 through QUOT-06 and FACT-01, FACT-05, FACT-06, FACT-07 requirements addressed
- PDF templates for both quotations and invoices now compile cleanly without type suppressions
- Labels page infrastructure ready — Phase 7 CRM will wire real order data to replace demo labels

## Self-Check: PASSED

All 11 key files found on disk. Task commits ec4c010, 9488b89, and 4b3cd4d verified in git log. npx tsc --noEmit and npx next build both pass with no errors.

---
*Phase: 04-quotations-and-invoicing*
*Completed: 2026-03-23*
