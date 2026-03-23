---
phase: 05-containers-and-deliveries
plan: "02"
subsystem: ui
tags: [react, next.js, tanstack-table, react-hook-form, zod, minio, containers, presigned-upload]

# Dependency graph
requires:
  - phase: 05-containers-and-deliveries
    provides: "05-01: Container DAL, Server Actions, Zod schemas, TypeScript types"
  - phase: 04-quotations-and-invoicing
    provides: "GlassCard, PageHeader, InvoicesTable, InvoiceDetail patterns used as templates"
  - phase: 02-product-management
    provides: "getProductsForBuilder DAL function, presigned upload pattern from /api/products/upload"

provides:
  - /containers list page (Server Component, requireAdmin, getContainers, URL-state filtered table)
  - /containers/new create form (RHF + zodResolver + z.input<ContainerSchema>, createContainerAction)
  - /containers/[id] detail page with ETA countdown (setInterval 60_000), status pipeline
  - ContainerItemsEditor (local React state, product search, add/remove items)
  - ContainerDocuments (presigned PUT 3-step: GET presigned URL -> PUT MinIO -> addContainerDocumentAction)
  - ContainerLabelsBtn (generateChineseLabelHtml, 100x70mm thermal, window.print())
  - ContainerNotifyDialog (state-toggled modal, notifyContainerAction)
  - /api/containers/[id]/upload Route Handler (GET, presigned PUT, containers/{id}/ key scoping)

affects:
  - 05-03 (domestic deliveries UI — uses same Aether patterns)
  - 06+ (any phase referencing container or delivery list pages)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ContainerForm uses z.input<typeof ContainerSchema> with zodResolver — consistent with Phase 02-02 decision"
    - "useEtaCountdown: pure useEffect + setInterval(60_000) hook, no library dependency"
    - "Chinese label generator: generateChineseLabelHtml + window.open() + window.print() — @page { size: 100mm 70mm; margin: 0 }"
    - "Document upload: 3-step pattern (GET presigned URL -> PUT file to MinIO -> Server Action saves record)"
    - "ContainerNotifyDialog: state-toggled modal (not Base UI Dialog) — per Phase 03-02 decision"
    - "Status pipeline UI: flex row with step indicators, advance/revert buttons via updateContainerStatusAction"

key-files:
  created:
    - src/app/(dashboard)/containers/page.tsx
    - src/app/(dashboard)/containers/_components/containers-table.tsx
    - src/app/(dashboard)/containers/_components/container-status-badge.tsx
    - src/app/(dashboard)/containers/new/page.tsx
    - src/app/(dashboard)/containers/new/_components/container-form.tsx
    - src/app/(dashboard)/containers/[id]/page.tsx
    - src/app/(dashboard)/containers/[id]/_components/container-detail.tsx
    - src/app/(dashboard)/containers/[id]/_components/container-items-editor.tsx
    - src/app/(dashboard)/containers/[id]/_components/container-documents.tsx
    - src/app/(dashboard)/containers/[id]/_components/container-labels-btn.tsx
    - src/app/(dashboard)/containers/[id]/_components/container-notify-dialog.tsx
    - src/app/api/containers/[id]/upload/route.ts
  modified: []

key-decisions:
  - "Container create form does not include items section — items are added post-creation on the detail page (cleaner UX, avoids complex nested form on creation)"
  - "useEtaCountdown implemented inline in container-detail.tsx as a local hook (not exported) — single-use hook, no reuse needed"
  - "containers-table.tsx uses client-side filtering from the full containers array (not additional server queries) — consistent with invoices-table pattern"
  - "Upload route returns documentType, originalFilename, storedFilename in response so client can pass them directly to addContainerDocumentAction"

patterns-established:
  - "Chinese label print: generateChineseLabelHtml() + window.open('', '_blank') + window.print() with @page { size: 100mm 70mm; margin: 0 }"
  - "ETA countdown: useEffect + setInterval(60_000) + clearInterval cleanup — no library"
  - "Presigned upload route: GET /api/{resource}/[id]/upload?filename=&contentType=&documentType= returns presignedUrl + publicUrl + metadata"

requirements-completed: [CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-08]

# Metrics
duration: 9min
completed: 2026-03-23
---

# Phase 5 Plan 02: Container UI Summary

**Full container lifecycle UI: list page with URL-state filters, create form, and detail page with ETA countdown, items editor, presigned document upload, 100x70mm Chinese thermal labels, and status notification dialog**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-23T13:47:28Z
- **Completed:** 2026-03-23T13:56:19Z
- **Tasks:** 2
- **Files modified:** 12 (all created)

## Accomplishments

- Container list page at `/containers` with URL-state status/carrier filters and link navigation
- Container create page at `/containers/new` using RHF + zodResolver + z.input<ContainerSchema>
- Container detail page at `/containers/[id]` with full lifecycle management
- `useEtaCountdown` hook using pure `setInterval(60_000)` — no library
- `generateChineseLabelHtml` for 100x70mm thermal labels with window.open/print
- Document upload via presigned PUT (3-step: GET URL -> PUT MinIO -> Server Action)
- Status pipeline UI with advance/revert buttons calling `updateContainerStatusAction`
- State-toggled notification modal calling `notifyContainerAction`
- `/api/containers/[id]/upload` Route Handler with containers/{id}/ key scoping

## Task Commits

Each task was committed atomically:

1. **Task 1: Container list page, create form, presigned upload route** - `3b6b0ee` (feat)
2. **Task 2: Container detail page — items editor, documents, labels, ETA countdown, notify dialog** - `d5eca44` (feat)
3. **Fix: ESLint no-html-link-for-pages and unused var** - `4198430` (fix)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/app/(dashboard)/containers/page.tsx` — Server Component, requireAdmin + getContainers, PageHeader + GlassCard
- `src/app/(dashboard)/containers/_components/containers-table.tsx` — Client, URL-state filters, row links to /containers/[id]
- `src/app/(dashboard)/containers/_components/container-status-badge.tsx` — STATUS_CONFIG map for in_transit/at_port/unloaded/completed
- `src/app/(dashboard)/containers/new/page.tsx` — Server Component, requireAdmin, renders ContainerForm
- `src/app/(dashboard)/containers/new/_components/container-form.tsx` — Client, RHF + zodResolver + z.input<ContainerSchema>
- `src/app/(dashboard)/containers/[id]/page.tsx` — Server Component, requireAdmin + getContainerById + notFound, await params
- `src/app/(dashboard)/containers/[id]/_components/container-detail.tsx` — Client, useEtaCountdown (setInterval 60_000), status pipeline
- `src/app/(dashboard)/containers/[id]/_components/container-items-editor.tsx` — Client, local React state, product search, add/remove
- `src/app/(dashboard)/containers/[id]/_components/container-documents.tsx` — Client, presigned PUT 3-step upload
- `src/app/(dashboard)/containers/[id]/_components/container-labels-btn.tsx` — Client, generateChineseLabelHtml, 100x70mm thermal
- `src/app/(dashboard)/containers/[id]/_components/container-notify-dialog.tsx` — Client, state-toggled modal, notifyContainerAction
- `src/app/api/containers/[id]/upload/route.ts` — GET Route Handler, presigned PUT, containers/{id}/ key scoping

## Decisions Made

- Container create form does not include an items section — items are added post-creation via the items editor on the detail page. This avoids a complex nested form state on creation and matches the expected workflow (create container first, then populate items).
- `useEtaCountdown` is implemented inline in `container-detail.tsx` as a local function rather than a shared hook export — it is single-use.
- Client-side filtering in `containers-table.tsx` (filtering the full `containers` array) rather than server-side query parameters, consistent with `invoices-table.tsx` pattern.
- Upload route returns `documentType`, `originalFilename`, `storedFilename` in the response so the client can pass them directly to `addContainerDocumentAction` without re-parsing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced `<a>` with `<Link>` in container-form.tsx Cancel button**
- **Found during:** Verification build (`npx next build`)
- **Issue:** Next.js ESLint rule `@next/next/no-html-link-for-pages` requires `<Link>` for internal navigation; `<a href="/containers">` triggered build failure
- **Fix:** Replaced with `<Link href="/containers">` from `next/link`
- **Files modified:** `src/app/(dashboard)/containers/new/_components/container-form.tsx`
- **Verification:** `npx next build` passes with 0 errors
- **Committed in:** `4198430` (fix commit)

**2. [Rule 1 - Bug] Removed unused `_products` prop from ContainerForm**
- **Found during:** Verification build (`npx next build`)
- **Issue:** ESLint `@typescript-eslint/no-unused-vars` warning on `_products` parameter — build warning
- **Fix:** Removed the `products` prop entirely from `ContainerForm` (items are added post-creation on detail page, not on create form); updated `new/page.tsx` to not import `getProductsForBuilder`
- **Files modified:** `src/app/(dashboard)/containers/new/_components/container-form.tsx`, `src/app/(dashboard)/containers/new/page.tsx`
- **Verification:** `npx tsc --noEmit` and `npx next build` both pass cleanly
- **Committed in:** `4198430` (fix commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs found during build verification)
**Impact on plan:** Both fixes were minor code quality issues discovered at build time. No scope changes. All 12 planned artifacts delivered.

## Issues Encountered

None — all planned functionality implemented. Build passes with only pre-existing warnings in unrelated files (audit-log-table.tsx, quotations builder).

## User Setup Required

None - no external service configuration required. The presigned upload route requires `MINIO_BUCKET` and `MINIO_PUBLIC_URL` env vars which are already configured from Phase 2.

## Next Phase Readiness

- Container UI is complete: list, create, and full detail workflow
- Phase 05-03 (domestic deliveries + calendar UI) can proceed immediately
- All container pages follow Aether design system patterns established in prior phases
- DB migration (prisma/05-DB-MIGRATION.sql) must be executed on production MySQL before container pages function with real data

## Self-Check: PASSED

All 12 key files found on disk. Task commits 3b6b0ee, d5eca44, 4198430 verified in git log. npx tsc --noEmit exits 0. npx next build exits 0 with /containers, /containers/[id], /containers/new all listed in route output.

---
*Phase: 05-containers-and-deliveries*
*Completed: 2026-03-23*
