---
phase: 07-crm-and-accounts-receivable
plan: "02"
subsystem: ui
tags: [react, tanstack-table, react-hook-form, zod, next-js, crm, server-actions, useTransition]

# Dependency graph
requires:
  - phase: 07-crm-and-accounts-receivable
    provides: "07-01 DAL: getCustomers, getCustomerById, getLeads, getDeals, getBrandWatchItems + all Server Actions"
  - phase: 03-pricing-engine
    provides: "getPriceLists() for CustomerForm price list selector"
  - phase: 01-foundation-auth-and-system-shell
    provides: "requireAdmin(), GlassCard, GlowButton, PageHeader Aether components"

provides:
  - Customer list page at /crm with TanStack Table (search, active/inactive toggle, deactivate row action)
  - Customer create page at /crm/new (CustomerForm in create mode)
  - Customer detail page at /crm/[id] with leads table, deals cards, inline edit form
  - Customer edit page at /crm/[id]/edit
  - Leads list page at /crm/leads with state-toggled create modal, status filter, edit/delete
  - Pipeline board at /crm/pipeline — 5 stage columns, deal cards, stage change via dropdown + updateDealAction
  - Brand protection watchlist at /crm/brand-protection with full CRUD

affects:
  - Phase 7 Plan 03 (Windykacja UI — same Aether patterns established here apply)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component + Client Content wrapper: page.tsx fetches data with requireAdmin(); *-content.tsx wraps PageHeader + modal state + table (avoids passing client-only state to server component)"
    - "Modal pattern: useState showCreateForm, fixed inset-0 z-50 flex overlay with backdrop-blur-sm, form in GlassCard"
    - "Pipeline board: useTransition for optimistic stage change, router.refresh() after updateDealAction, local state reverted on error"
    - "TanStack Table with manualPagination: CRM list uses getCoreRowModel() + URL state for search/filter via useRouter + useSearchParams"
    - "z.input<Schema> defaultValues cast: enum fields from DB data need 'as const enum type' cast to satisfy TypeScript in useForm defaultValues"

key-files:
  created:
    - src/app/(dashboard)/crm/page.tsx
    - src/app/(dashboard)/crm/new/page.tsx
    - src/app/(dashboard)/crm/[id]/page.tsx
    - src/app/(dashboard)/crm/[id]/edit/page.tsx
    - src/app/(dashboard)/crm/_components/customer-form.tsx
    - src/app/(dashboard)/crm/_components/customer-table.tsx
    - src/app/(dashboard)/crm/leads/page.tsx
    - src/app/(dashboard)/crm/leads/_components/leads-content.tsx
    - src/app/(dashboard)/crm/leads/_components/lead-form.tsx
    - src/app/(dashboard)/crm/leads/_components/lead-table.tsx
    - src/app/(dashboard)/crm/pipeline/page.tsx
    - src/app/(dashboard)/crm/pipeline/_components/pipeline-board.tsx
    - src/app/(dashboard)/crm/brand-protection/page.tsx
    - src/app/(dashboard)/crm/brand-protection/_components/brand-protection-content.tsx
    - src/app/(dashboard)/crm/brand-protection/_components/brand-watch-table.tsx
    - src/app/(dashboard)/crm/brand-protection/_components/brand-watch-form.tsx
  modified: []

key-decisions:
  - "Added /crm/[id]/edit as dedicated edit page (not in plan) for clean edit URL separate from detail view — the detail page /crm/[id] also embeds the form below the detail cards"
  - "Server Component + Client Content wrapper split: leads/page.tsx and brand-protection/page.tsx are pure Server Components; *-content.tsx Client Components hold modal state — enables requireAdmin() + getLeads() on server while keeping useState for modals on client"
  - "Brand watch form and lead form separated into dedicated components (not inline) — matches existing codebase pattern of _components/ per feature"
  - "z.input enum defaultValues cast: lead status and brandwatch status cast with 'as const enum type' to resolve TypeScript incompatibility between string DB values and Zod enum z.input types"

patterns-established:
  - "CRM page pattern: Server Component with requireAdmin + data fetch → passes to GlassCard-wrapped client table"
  - "Modal-with-form pattern: state-toggled fixed overlay, GlassCard form inside, onClose/onSuccess callbacks"

requirements-completed: [CRM-01, CRM-02, CRM-03, CRM-04, CRM-06]

# Metrics
duration: 7min
completed: 2026-03-23
---

# Phase 7 Plan 02: CRM UI Summary

**16 CRM UI files: customer list/create/edit/detail with TanStack Table, leads management with modal CRUD, 5-stage pipeline board with useTransition dropdown stage changes, and brand protection watchlist — all routes build cleanly with npx next build**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-23T15:23:51Z
- **Completed:** 2026-03-23T15:30:53Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- Customer list at /crm with TanStack Table (URL state search, active/inactive toggle, deactivate soft-delete row action linking to 07-01 deleteCustomerAction)
- Customer create/edit form using react-hook-form + zodResolver + z.input<CustomerSchema> + useActionState, with isActive checkbox for customer reactivation (CRM-03)
- Customer detail page at /crm/[id] with embedded leads table (status badges), deals cards (stage badges + value), and inline edit form
- Leads list at /crm/leads with TanStack Table, status filter URL state, state-toggled create/edit modals
- Pipeline board at /crm/pipeline: 5 stage columns (prospecting/proposal/negotiation/closed_won/closed_lost), deal cards with value in PLN, stage change via dropdown + updateDealAction in useTransition with router.refresh()
- Brand protection watchlist at /crm/brand-protection with simple HTML table, marketplace/status badges, full CRUD via state-toggled modals

## Task Commits

Each task was committed atomically:

1. **Task 1: Customer pages (list, create, edit, detail) + form and table components** - `b5f678f` (feat)
2. **Task 2: Leads list + Pipeline board + Brand protection watchlist** - `9d6fcde` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/app/(dashboard)/crm/page.tsx` — Customer list page with requireAdmin, getCustomers, search/active searchParams
- `src/app/(dashboard)/crm/new/page.tsx` — New customer page with getPriceLists
- `src/app/(dashboard)/crm/[id]/page.tsx` — Customer detail with leads table, deals cards, embedded CustomerForm
- `src/app/(dashboard)/crm/[id]/edit/page.tsx` — Dedicated edit page for customer
- `src/app/(dashboard)/crm/_components/customer-form.tsx` — react-hook-form + zodResolver, z.input<CustomerSchema>, useActionState, isActive checkbox
- `src/app/(dashboard)/crm/_components/customer-table.tsx` — TanStack Table, URL state search/filter, deactivate row action
- `src/app/(dashboard)/crm/leads/page.tsx` — Leads page with getLeads, status/search searchParams
- `src/app/(dashboard)/crm/leads/_components/leads-content.tsx` — Client wrapper with create modal state
- `src/app/(dashboard)/crm/leads/_components/lead-table.tsx` — TanStack Table with status filter URL state and edit modal
- `src/app/(dashboard)/crm/leads/_components/lead-form.tsx` — react-hook-form + zodResolver, z.input<LeadSchema>
- `src/app/(dashboard)/crm/pipeline/page.tsx` — Groups deals by stage server-side, passes stageTotals
- `src/app/(dashboard)/crm/pipeline/_components/pipeline-board.tsx` — 5 stage columns, deal cards, dropdown stage change via useTransition + updateDealAction
- `src/app/(dashboard)/crm/brand-protection/page.tsx` — getBrandWatchItems with requireAdmin
- `src/app/(dashboard)/crm/brand-protection/_components/brand-protection-content.tsx` — Client wrapper with create modal state
- `src/app/(dashboard)/crm/brand-protection/_components/brand-watch-table.tsx` — Simple HTML table with edit/delete
- `src/app/(dashboard)/crm/brand-protection/_components/brand-watch-form.tsx` — react-hook-form + zodResolver for brand watch items

## Decisions Made

- Added `/crm/[id]/edit` as a dedicated edit page alongside the inline form on the detail page — the table row action navigates to `/crm/[id]/edit` per the plan spec
- Used Server Component + Client Content wrapper pattern for leads and brand-protection pages: page.tsx is a pure server component calling requireAdmin() + data fetch; the `*-content.tsx` client component holds modal state — this avoids "useState in Server Component" errors while keeping server-side auth/data
- Added `brand-watch-form.tsx` as a dedicated component (not inline) to follow the codebase pattern of separating form components into `_components/`
- Enum defaultValues cast (`as const type`) for lead status and brand watch status — required because `z.input<Schema>` with `.default()` produces a more specific type than string from DB values

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed invalid useTransition destructuring in DealCard**
- **Found during:** Task 2 (Pipeline board)
- **Issue:** `const [isPending, setIsPending] = React.useTransition()[1] ? false : false` was malformed — useTransition returns `[isPending, startTransition]`, not a value to conditionally destructure
- **Fix:** Removed the unused isPending variable; kept `const [, startTransition] = React.useTransition()`
- **Files modified:** `src/app/(dashboard)/crm/pipeline/_components/pipeline-board.tsx`
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `9d6fcde` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed TypeScript enum cast for z.input defaultValues**
- **Found during:** Task 2 (LeadForm, BrandWatchForm)
- **Issue:** `status: lead?.status ?? "new"` typed as `string` not assignable to Zod enum z.input type in useForm defaultValues
- **Fix:** Added `as "new" | "contacted" | ...` cast for status defaultValues in both forms
- **Files modified:** `lead-form.tsx`, `brand-watch-form.tsx`
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `9d6fcde` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes required for TypeScript correctness. No scope creep.

## Issues Encountered

None — `npx tsc --noEmit` exits 0. `npx next build` exits 0. All 7 CRM routes (/crm, /crm/new, /crm/[id], /crm/[id]/edit, /crm/leads, /crm/pipeline, /crm/brand-protection) confirmed in build output.

## User Setup Required

None - no external service configuration required. The CRM UI depends on the 6 MySQL tables from `07-DB-MIGRATION.sql` (created in plan 07-01).

## Next Phase Readiness

- Plan 07-03 (Windykacja UI + B2B portal) can begin immediately: aging dashboard depends on `getAgingData()` and `getWindykacjaCases()` from 07-01 DAL
- All CRM-01 through CRM-04 and CRM-06 requirements delivered

## Self-Check: PASSED

All 16 files confirmed on disk. Commits b5f678f and 9d6fcde verified in git log. `npx tsc --noEmit` exits 0. `npx next build` exits 0 with all 7 CRM routes (/crm, /crm/new, /crm/[id], /crm/[id]/edit, /crm/leads, /crm/pipeline, /crm/brand-protection) confirmed in build output.

---
*Phase: 07-crm-and-accounts-receivable*
*Completed: 2026-03-23*
