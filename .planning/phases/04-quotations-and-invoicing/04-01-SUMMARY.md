---
phase: 04-quotations-and-invoicing
plan: "01"
subsystem: database
tags: [prisma, mysql, zod, dal, server-actions, nodemailer, react-pdf, quotations, invoices]

# Dependency graph
requires:
  - phase: 03-pricing-engine
    provides: PriceList model and requireAuth/requireAdmin DAL helpers used in quotation/invoice DAL
provides:
  - Quotation, QuotationItem, Invoice, InvoiceItem Prisma models in schema.prisma
  - getQuotations, getQuotationById, createQuotation, duplicateQuotation, updateQuotationStatus, deleteQuotation DAL functions
  - getInvoices, getInvoiceById, createInvoice, deleteInvoice DAL functions
  - createQuotationAction, duplicateQuotationAction, sendQuotationEmailAction, deleteQuotationAction Server Actions
  - createInvoiceAction, deleteInvoiceAction Server Actions
  - sendQuotationEmail function in src/lib/email.ts with PDF buffer attachment
  - 04-DB-MIGRATION.sql for new invoices + invoice_items tables
  - WYC-YYYY-##### and FAK-YYYY-##### atomic numbering via $transaction
affects:
  - 04-quotations-and-invoicing (plans 02, 03 depend on these DAL/Action exports)

# Tech tracking
tech-stack:
  added:
    - "@react-pdf/renderer@4.3.2 — server-side PDF generation"
  patterns:
    - "Atomic document numbering: INSERT with PENDING placeholder, get AUTO_INCREMENT id, compute WYC/FAK number, UPDATE in same $transaction"
    - "Server-only DAL with requireAuth() on quotation functions, requireAdmin() on invoice mutations"
    - "Decimal to number coercion with Number() for all Prisma Decimal fields"

key-files:
  created:
    - prisma/schema.prisma (modified — 4 new models + User/PriceList back-relations)
    - .planning/phases/04-quotations-and-invoicing/04-DB-MIGRATION.sql
    - src/types/quotations.ts
    - src/types/invoices.ts
    - src/lib/validations/quotations.ts
    - src/lib/validations/invoices.ts
    - src/lib/dal/quotations.ts
    - src/lib/dal/invoices.ts
    - src/lib/actions/quotations.ts
    - src/lib/actions/invoices.ts
    - src/lib/pdf/quotation-template.tsx (placeholder — full impl in Plan 04-02)
  modified:
    - src/lib/email.ts (sendQuotationEmail appended)
    - next.config.ts (@react-pdf/renderer added to serverExternalPackages)
    - package.json / package-lock.json (@react-pdf/renderer@4.3.2 installed)

key-decisions:
  - "WYC/FAK atomic numbering uses MySQL AUTO_INCREMENT as sequence source inside Prisma $transaction — eliminates race conditions vs old COUNT(*)+1 approach"
  - "quotations + quotation_items tables skipped from migration SQL (already in production MySQL) — only invoices tables created"
  - "QuotationPdfTemplate placeholder created in src/lib/pdf/ to unblock TypeScript compilation — full implementation deferred to Plan 04-02"
  - "@react-pdf/renderer cast via 'as any' in Server Action to satisfy renderToBuffer's DocumentProps type constraint — safe, will be refined in Plan 04-02"
  - "QuotationWithItems extended with notes field (plan omitted it from type but DAL duplicateQuotation reads source.notes)"

patterns-established:
  - "PENDING placeholder pattern: all document-numbered entities use INSERT PENDING → UPDATE with formatted number in $transaction"
  - "Quotation DAL: requireAuth() on all functions (all users can manage quotations)"
  - "Invoice DAL: requireAdmin() on all functions (admin-only)"

requirements-completed: [QUOT-01, QUOT-02, QUOT-04, QUOT-05, QUOT-06, FACT-01, FACT-05, FACT-06]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 4 Plan 01: Quotations & Invoicing Data Layer Summary

**Prisma models for Quotation/Invoice with atomic WYC/FAK numbering, full DAL/Actions/email layer, @react-pdf/renderer@4.3.2 installed and configured**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-23T12:53:36Z
- **Completed:** 2026-03-23T12:58:05Z
- **Tasks:** 2
- **Files modified:** 13 (11 created, 2 modified)

## Accomplishments

- Prisma schema extended with Quotation, QuotationItem, Invoice, InvoiceItem models — all mapping to correct MySQL column names via @map()
- Atomic document numbering implemented: INSERT with "PENDING" → compute WYC/FAK number from AUTO_INCREMENT id → UPDATE, all in Prisma $transaction
- Full DAL layer: quotations (requireAuth) and invoices (requireAdmin) with filters, CRUD, and duplication
- Server Actions for both quotations and invoices wired to DAL + auth session checks
- sendQuotationEmail added to email.ts with Nodemailer PDF buffer attachment support
- @react-pdf/renderer@4.3.2 installed and added to serverExternalPackages (correct Next.js 15 config location)
- 04-DB-MIGRATION.sql creates only invoices + invoice_items tables (quotations tables already in production MySQL)

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma models, types, Zod schemas, next.config.ts** - `c675b92` (feat)
2. **Task 2: DAL, Server Actions, email.ts extension, npm install** - `e3a437b` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `prisma/schema.prisma` — 4 new models (Quotation, QuotationItem, Invoice, InvoiceItem) + User/PriceList back-relations
- `.planning/phases/04-quotations-and-invoicing/04-DB-MIGRATION.sql` — CREATE TABLE IF NOT EXISTS for invoices + invoice_items only
- `src/types/quotations.ts` — QuotationRow, QuotationWithItems, QuotationItemRow, CartItem interfaces
- `src/types/invoices.ts` — InvoiceRow, InvoiceWithItems, InvoiceItemRow interfaces
- `src/lib/validations/quotations.ts` — createQuotationSchema, quotationItemSchema, sendEmailSchema
- `src/lib/validations/invoices.ts` — createInvoiceSchema, invoiceItemSchema
- `src/lib/dal/quotations.ts` — server-only DAL with 6 functions using requireAuth()
- `src/lib/dal/invoices.ts` — server-only DAL with 4 functions using requireAdmin()
- `src/lib/actions/quotations.ts` — 4 Server Actions for quotation CRUD + email
- `src/lib/actions/invoices.ts` — 2 Server Actions for invoice CRUD
- `src/lib/pdf/quotation-template.tsx` — placeholder PDF template (unblocks TypeScript, full impl in Plan 04-02)
- `src/lib/email.ts` — sendQuotationEmail function appended
- `next.config.ts` — @react-pdf/renderer added to serverExternalPackages
- `package.json` / `package-lock.json` — @react-pdf/renderer@4.3.2 added

## Decisions Made

- Used MySQL AUTO_INCREMENT as sequence source for WYC/FAK numbering inside Prisma $transaction. The old kalkulator2025 approach used COUNT(*)+1 which is not race-condition safe. The new approach is atomic and collision-proof.
- Wrote 04-DB-MIGRATION.sql with only the new invoices tables. The quotations/quotation_items tables already exist in production MySQL — no CREATE statements for those to avoid errors.
- Created a placeholder PDF template (`src/lib/pdf/quotation-template.tsx`) to allow TypeScript to compile cleanly. The full template with proper PDF layout is deferred to Plan 04-02.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] QuotationWithItems missing notes field**
- **Found during:** Task 2 (DAL quotations.ts)
- **Issue:** The plan's type definition for QuotationWithItems (extending QuotationRow) did not include a `notes` field, but `duplicateQuotation` accesses `source.notes`. Without the field, TypeScript would error and the duplicate function would silently pass `undefined` as notes.
- **Fix:** Added `notes: string | null` to `QuotationWithItems` interface in `src/types/quotations.ts`
- **Files modified:** src/types/quotations.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** c675b92 (Task 1 commit)

**2. [Rule 3 - Blocking] Created placeholder PDF template to unblock TypeScript**
- **Found during:** Task 2 (Server Actions quotations.ts)
- **Issue:** The Server Action imports `QuotationPdfTemplate` from `@/lib/pdf/quotation-template` which doesn't exist — the full PDF template is planned for 04-02. Without the file, `tsc --noEmit` would fail with module-not-found error.
- **Fix:** Created minimal `src/lib/pdf/quotation-template.tsx` with correct function signature and placeholder Document/Page/Text rendering
- **Files modified:** src/lib/pdf/quotation-template.tsx (new file)
- **Verification:** `npx tsc --noEmit` passes, file exports `QuotationPdfTemplate` with correct `QuotationWithItems` prop type
- **Committed in:** e3a437b (Task 2 commit)

**3. [Rule 1 - Bug] renderToBuffer type mismatch — cast to any**
- **Found during:** Task 2 (Server Actions quotations.ts)
- **Issue:** `renderToBuffer` expects `ReactElement<DocumentProps>` but calling the function component directly returns `FunctionComponentElement<QuotationPdfTemplateProps>`. TypeScript error TS2345.
- **Fix:** Cast to `any` at the call site with an eslint-disable comment. This is safe because the runtime value is a `<Document>` element; the type mismatch is a TypeScript/react-pdf typing limitation.
- **Files modified:** src/lib/actions/quotations.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** e3a437b (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** All fixes necessary for TypeScript compilation. Notes field omission was a plan oversight. PDF placeholder is intentional scaffolding for Plan 04-02. No scope creep.

## Issues Encountered

None — all issues resolved via deviation rules above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DAL/Actions/types foundation complete — Plans 04-02 and 04-03 (UI) can import directly from these files
- Database migration SQL ready — run `04-DB-MIGRATION.sql` against production MySQL before deploying Plan 04-02
- PDF template placeholder at `src/lib/pdf/quotation-template.tsx` must be replaced with full implementation in Plan 04-02
- `npx tsc --noEmit` passes clean — no TypeScript debt

## Self-Check: PASSED

All 12 key files found on disk. Task commits c675b92 and e3a437b verified in git log.

---
*Phase: 04-quotations-and-invoicing*
*Completed: 2026-03-23*
