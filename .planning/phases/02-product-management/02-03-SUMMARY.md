---
phase: 02-product-management
plan: "03"
subsystem: ui
tags: [minio, s3, presigned-url, sheetjs, xlsx, excel-import, subiekt-gt, server-actions, route-handlers, next-js-15]

# Dependency graph
requires:
  - phase: 02-product-management
    plan: "01"
    provides: "minioClient singleton (src/lib/minio.ts), syncProductsFromSubiekt (src/lib/dal/subiekt.ts), updateProduct DAL, ActionState type"
  - phase: 02-product-management
    plan: "02"
    provides: "product-detail-form.tsx (wires ImageUploader into image section), Aether GlassCard/GlowButton/PageHeader component patterns"

provides:
  - "GET /api/products/upload — presigned PUT URL generation for direct browser-to-MinIO uploads"
  - "ImageUploader React component — two-step: fetch presigned URL, PUT directly to MinIO, call updateProductImageAction"
  - "updateProductImageAction — Server Action updating product.imageUrl via updateProduct DAL"
  - "POST /api/products/import — SheetJS Excel file parsing, upsert by SKU or name, bilingual column headers, returns {imported, updated, skipped, errors}"
  - "/products/import page with ImportForm client component"
  - "/products/sync page with SyncPanel client component"
  - "syncProductsFromSubiektAction — Server Action bridge wrapping syncProductsFromSubiekt (server-only isolation)"

affects:
  - "price-lists phase (image upload pattern established for other entity images)"
  - "containers phase (Excel import pattern reusable for container data)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Presigned URL upload: GET Route Handler (admin-guarded) generates presigned PUT URL -> client PUT directly to MinIO -> Server Action saves publicUrl — file bytes never pass through Next.js"
    - "Server Action bridge: client components call server action (products-sync.ts) which wraps server-only DAL — prevents 'server-only' module errors in client boundaries"
    - "SheetJS XLSX.read(new Uint8Array(buffer), { type: 'array' }) — correct usage for arrayBuffer from formData in Next.js Route Handler"

key-files:
  created:
    - "src/app/api/products/upload/route.ts - GET route: generatepresigned PUT URL with 5-min expiry, admin-guarded"
    - "src/app/api/products/import/route.ts - POST route: SheetJS Excel parse, upsert products, bilingual headers"
    - "src/app/(dashboard)/products/[id]/_components/image-uploader.tsx - Client component: presigned URL flow + updateProductImageAction"
    - "src/app/(dashboard)/products/import/page.tsx - Import page (Server Component, requireAdmin)"
    - "src/app/(dashboard)/products/import/_components/import-form.tsx - Import form client component with results grid"
    - "src/app/(dashboard)/products/sync/page.tsx - Sync page (Server Component, requireAdmin)"
    - "src/app/(dashboard)/products/sync/_components/sync-panel.tsx - Sync panel client component"
    - "src/lib/actions/products-sync.ts - Server Action bridge for Subiekt GT sync"
  modified:
    - "src/lib/actions/products.ts - Added updateProductImageAction"
    - "src/app/(dashboard)/products/[id]/_components/product-detail-form.tsx - Replaced static image preview with ImageUploader component"

key-decisions:
  - "Used prisma (not db) import in import route handler — matching established convention from Plan 02-01"
  - "Added padding wrapper div (px-6 py-6) inside GlassCard for import-form and sync-panel — matching existing form component patterns from Plan 02-02"
  - "Removed unused Image import from product-detail-form.tsx after refactoring image section to use ImageUploader"

patterns-established:
  - "Presigned URL pattern: GET /api/products/upload -> PutObjectCommand -> getSignedUrl(minioClient, cmd, { expiresIn: 300 }) -> { presignedUrl, publicUrl }"
  - "Server Action bridge pattern: 'use server' file wraps server-only DAL functions for client component consumption"
  - "Excel import bilingual headers: support both English (name, sku, price) and Polish (nazwa, cena) column names in same route handler"

requirements-completed: [PROD-04, PROD-05, PROD-06, PROD-07]

# Metrics
duration: 4min
completed: "2026-03-23"
---

# Phase 2 Plan 03: Product Upload, Import & Sync Summary

**MinIO presigned PUT URL image upload, SheetJS Excel import Route Handler with bilingual column support, and Subiekt GT sync page — 4 new routes, ImageUploader component wired into product detail form**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-23T11:52:52Z
- **Completed:** 2026-03-23T11:56:52Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Image upload: two-step presigned URL flow — GET /api/products/upload generates presigned PUT URL (5 min expiry) -> client PUT directly to MinIO (file bytes never hit Next.js) -> `updateProductImageAction` saves publicUrl to product record; ImageUploader wired into product-detail-form.tsx replacing the static image preview
- Excel import: POST /api/products/import uses `XLSX.read(new Uint8Array(buffer), { type: "array" })` (correct SheetJS App Router pattern), supports both English and Polish column headers for backward compatibility with kalkulator2025 exports, upserts by SKU (preferred) or by exact name match, returns `{imported, updated, skipped, errors, total}` summary
- Subiekt GT sync: `syncProductsFromSubiektAction` server action bridge in `products-sync.ts` wraps the server-only `syncProductsFromSubiekt()` DAL — SyncPanel client component never imports server-only modules directly
- Build passes with all 4 new routes: `/api/products/upload`, `/api/products/import`, `/products/import`, `/products/sync`

## Task Commits

Each task was committed atomically:

1. **Task 1: MinIO presigned URL Route Handler, ImageUploader, updateProductImageAction** - `e415cd1` (feat)
2. **Task 2: SheetJS import route, import page, sync page, server action bridge** - `ca957a8` (feat)

## Files Created/Modified

- `src/app/api/products/upload/route.ts` - GET route: admin-guarded presigned PUT URL, 5-min expiry, sanitized filename with timestamp+random suffix
- `src/app/api/products/import/route.ts` - POST route: SheetJS xlsx.read, 100-row upsert loop, bilingual column headers, error collection per row
- `src/app/(dashboard)/products/[id]/_components/image-uploader.tsx` - Client component: file validation (image type, 5MB), presigned URL fetch, PUT to MinIO, Server Action call
- `src/app/(dashboard)/products/import/page.tsx` - Server Component with requireAdmin() and PageHeader
- `src/app/(dashboard)/products/import/_components/import-form.tsx` - Client component: file picker, POST to /api/products/import, result stats grid with error details
- `src/app/(dashboard)/products/sync/page.tsx` - Server Component with requireAdmin() and PageHeader
- `src/app/(dashboard)/products/sync/_components/sync-panel.tsx` - Client component: sync button, result stats grid, error accordion
- `src/lib/actions/products-sync.ts` - "use server" bridge wrapping syncProductsFromSubiekt()
- `src/lib/actions/products.ts` - Added updateProductImageAction (updateProduct DAL + revalidatePath)
- `src/app/(dashboard)/products/[id]/_components/product-detail-form.tsx` - Replaced static image section with `<ImageUploader productId={product.id} currentImageUrl={product.imageUrl ?? null} />`

## Decisions Made

- Removed unused `Image` import from `product-detail-form.tsx` after delegating image rendering to `ImageUploader` — keeping the file clean.
- Added `px-6 py-6` wrapper div inside `GlassCard` in import-form and sync-panel to match the established Aether padding convention from Plan 02-02 form components.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added px-6 py-6 padding wrapper inside GlassCard for form components**
- **Found during:** Task 2 (import-form.tsx, sync-panel.tsx)
- **Issue:** Plan code placed content directly inside `<GlassCard>` without padding wrapper div. `GlassCard` component renders children directly (no auto-padding), so content would touch card edges.
- **Fix:** Added `<div className="px-6 py-6 space-y-4">` wrapper matching the pattern established in all Plan 02-02 form components
- **Files modified:** import-form.tsx, sync-panel.tsx
- **Verification:** `npx tsc --noEmit` passes, visual padding consistent with other product pages
- **Committed in:** ca957a8 (Task 2 commit)

**2. [Rule 1 - Bug] Removed unused Image import from product-detail-form.tsx**
- **Found during:** Task 1 (product-detail-form.tsx refactor)
- **Issue:** After replacing the static `<Image>` element with `<ImageUploader>`, the `import Image from "next/image"` at the top became an unused import — would cause TypeScript lint warnings
- **Fix:** Removed the unused `Image` import
- **Files modified:** product-detail-form.tsx
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** e415cd1 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both fixes improve code quality and visual correctness. No scope creep.

## Issues Encountered

None - both tasks completed cleanly. `npx tsc --noEmit` passes and `npx next build` succeeds with all 4 new routes.

## User Setup Required

None - no new external service configuration required. However, to use the new features:
- Ensure `MINIO_BUCKET`, `MINIO_PUBLIC_URL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_ENDPOINT` are set in `.env` for image upload to work
- Ensure `SUBIEKT_SERVER`, `SUBIEKT_DATABASE`, `SUBIEKT_USER`, `SUBIEKT_PASSWORD` are set in `.env` for Subiekt GT sync
- Optionally add `NEXT_PUBLIC_SUBIEKT_SERVER` to show server address in the sync panel UI

## Next Phase Readiness

- Phase 2 (Product Management) is now fully complete — all 7 PROD requirements delivered
- PROD-04 (image upload): ImageUploader + /api/products/upload route complete
- PROD-05 (Excel import): /api/products/import + /products/import page complete
- PROD-06 (Subiekt GT sync): /products/sync + syncProductsFromSubiektAction complete
- PROD-07 (bulk ops): BulkActionBar calling bulkDeleteProductsAction (delivered in Plan 02-02)
- Phase 3 (Price Lists) can proceed — product catalog foundation is complete

---
*Phase: 02-product-management*
*Completed: 2026-03-23*
