---
phase: 02-product-management
plan: "02"
subsystem: ui
tags: [tanstack-table, react-hook-form, zod, next-js-15, server-actions, server-components, url-state, pagination, bulk-ops]

# Dependency graph
requires:
  - phase: 02-product-management
    plan: "01"
    provides: "getProducts, getProductById, createProduct, updateProduct, deleteProduct, bulkDeleteProducts, createProductAction, updateProductAction, deleteProductAction, bulkDeleteProductsAction, getCategories, getProductGroups, ProductListItem, ProductWithRelations, createProductSchema"

provides:
  - "Product list page (/products) — Server Component with TanStack Table v8, URL-state pagination/search/filter"
  - "BulkActionBar — floating fixed bar shown on row selection, calls bulkDeleteProductsAction"
  - "Product create page (/products/new) — react-hook-form + zodResolver + createProductAction"
  - "Product detail/edit page (/products/[id]) — react-hook-form pre-populated, updateProductAction + deleteProductAction"
  - "Categories/groups management page (/products/categories) — useActionState inline create forms"
  - "createCategoryAction and createProductGroupAction Server Actions"
  - "CreateProductFormInput type (z.input<>) for react-hook-form type compatibility"

affects:
  - "02-03 (product image upload — imageUrl handling already in forms)"
  - "price-lists phase (product list/detail UI already established)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TanStack Table v8 with manualPagination=true + URL state: Server Component fetches data, Client Component handles pagination via useRouter().push with ?page= ?q= ?category= ?group="
    - "zodResolver + useForm<z.input<Schema>> pattern: use z.input<> (not z.infer<>) as form type to avoid TypeScript errors with .default() fields"
    - "Inline Server Action forms with useActionState (React 19): simple create forms without react-hook-form overhead"
    - "GlowButton has no asChild prop — use styled Link component directly for navigation buttons"

key-files:
  created:
    - "src/app/(dashboard)/products/page.tsx - Product list Server Component with await searchParams, parallel fetches"
    - "src/app/(dashboard)/products/_components/products-table.tsx - TanStack Table v8 client component"
    - "src/app/(dashboard)/products/_components/bulk-action-bar.tsx - Fixed floating bulk delete bar"
    - "src/app/(dashboard)/products/new/page.tsx - Product create Server Component with requireAdmin"
    - "src/app/(dashboard)/products/new/_components/product-form.tsx - react-hook-form create form"
    - "src/app/(dashboard)/products/[id]/page.tsx - Product detail Server Component with await params"
    - "src/app/(dashboard)/products/[id]/_components/product-detail-form.tsx - react-hook-form edit form with delete"
    - "src/app/(dashboard)/products/categories/page.tsx - Categories/groups management Server Component"
    - "src/app/(dashboard)/products/categories/_components/categories-table.tsx - Inline create forms with useActionState"
    - "src/lib/actions/product-categories.ts - createCategoryAction, createProductGroupAction"
  modified:
    - "src/lib/validations/products.ts - Added CreateProductFormInput (z.input<>) export"

key-decisions:
  - "Used z.input<typeof createProductSchema> as useForm generic type (not z.infer<>) — zodResolver requires input type to avoid TypeScript errors with .default() fields"
  - "GlowButton has no asChild prop — used styled Link with matching Aether CSS classes for navigation buttons"
  - "BulkActionBar variant is 'danger' not 'destructive' — matched existing GlowButtonVariant union type"
  - "Used useActionState (React 19) for categories/groups inline forms — simpler than react-hook-form for quick single-field forms"

patterns-established:
  - "URL state pagination: push ?page=&q=&category=&group= to URL, Server Component reads via await searchParams"
  - "TanStack Table with manualPagination: table.previousPage()/nextPage() trigger onPaginationChange which updates URL"
  - "zodResolver type: use z.input<Schema> for useForm<T> generic to avoid incompatibility with .default() fields"

requirements-completed: [PROD-01, PROD-02, PROD-03, PROD-07]

# Metrics
duration: 6min
completed: "2026-03-23"
---

# Phase 2 Plan 02: Product Catalog UI Summary

**TanStack Table v8 product list with URL-state pagination/search/filter, react-hook-form create/edit forms, floating bulk-delete bar, and categories/groups management page — 5 routes, 10 components, all admin-guarded**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-23T11:43:39Z
- **Completed:** 2026-03-23T11:49:26Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Product list page at /products with TanStack Table v8 using `manualPagination: true`, `enableRowSelection: true`, and URL state for pagination/search/category/group filters — all driven by `await searchParams` in the Server Component
- Floating BulkActionBar component that renders when rows are selected and calls `bulkDeleteProductsAction` with selected IDs
- Product create form at /products/new using react-hook-form + zodResolver with 15+ fields, slug auto-generation, all wrapped in Aether GlassCard sections
- Product detail/edit form at /products/[id] with pre-populated fields from product data, `updateProductAction`, and delete with `window.confirm()` dialog calling `deleteProductAction`
- Categories/groups management at /products/categories with dual inline create forms using `useActionState` (React 19) feeding `createCategoryAction` and `createProductGroupAction`

## Task Commits

Each task was committed atomically:

1. **Task 1: Product list page, ProductsTable, BulkActionBar** - `e510185` (feat)
2. **Task 2: Product create/edit forms, categories page, Server Actions** - `7ebbca2` (feat)

## Files Created/Modified

- `src/app/(dashboard)/products/page.tsx` - Server Component with await searchParams, parallel fetches for products/categories/groups
- `src/app/(dashboard)/products/_components/products-table.tsx` - TanStack Table v8 with manualPagination, enableRowSelection, URL state
- `src/app/(dashboard)/products/_components/bulk-action-bar.tsx` - Fixed bottom floating bar, renders on selection, calls bulkDeleteProductsAction
- `src/app/(dashboard)/products/new/page.tsx` - Server Component, requireAdmin(), parallel fetch
- `src/app/(dashboard)/products/new/_components/product-form.tsx` - react-hook-form create form, slug auto-gen, all product fields
- `src/app/(dashboard)/products/[id]/page.tsx` - Server Component, await params (Next.js 15), notFound on missing product
- `src/app/(dashboard)/products/[id]/_components/product-detail-form.tsx` - react-hook-form edit form, pre-populated, delete with confirm dialog
- `src/app/(dashboard)/products/categories/page.tsx` - Server Component, requireAdmin()
- `src/app/(dashboard)/products/categories/_components/categories-table.tsx` - useActionState inline forms for both categories and groups
- `src/lib/actions/product-categories.ts` - New Server Actions with requireAdmin guards and revalidatePath
- `src/lib/validations/products.ts` - Added CreateProductFormInput (z.input<>) export

## Decisions Made

- Used `z.input<typeof createProductSchema>` as `useForm<T>` generic type instead of `z.infer<>` — the zodResolver expects the input type to correctly handle `.default()` fields (isActive/displayOrder), preventing TypeScript errors about incompatible `boolean | undefined` vs `boolean` types.
- GlowButton doesn't have `asChild` prop — used styled `<Link>` with matching Aether CSS classes for Cancel/navigation buttons throughout.
- BulkActionBar uses `variant="danger"` (not "destructive") matching the actual `GlowButtonVariant` union type in the component.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] GlowButton has no asChild prop — plan used `<GlowButton asChild>` pattern**
- **Found during:** Task 1 (products/page.tsx)
- **Issue:** Plan code used `<GlowButton asChild><Link href="/products/new">...</Link></GlowButton>` but GlowButton doesn't have an `asChild` prop (it extends `React.ButtonHTMLAttributes<HTMLButtonElement>`)
- **Fix:** Used styled `<Link>` with inline Aether CSS classes matching GlowButton primary variant
- **Files modified:** src/app/(dashboard)/products/page.tsx, product-form.tsx, product-detail-form.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** e510185 (Task 1 commit)

**2. [Rule 1 - Bug] GlowButton variant is 'danger' not 'destructive' as specified in plan**
- **Found during:** Task 1 (bulk-action-bar.tsx)
- **Issue:** Plan specified `variant="destructive"` but GlowButtonVariant union is `"primary" | "secondary" | "danger"`
- **Fix:** Used `variant="danger"` throughout
- **Files modified:** src/app/(dashboard)/products/_components/bulk-action-bar.tsx, product-detail-form.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** e510185, 7ebbca2

**3. [Rule 1 - Bug] zodResolver TypeScript incompatibility with z.default() fields in react-hook-form**
- **Found during:** Task 2 (product-form.tsx, product-detail-form.tsx)
- **Issue:** `useForm<CreateProductInput>` with `zodResolver(createProductSchema)` caused TS2322 error — `isActive: z.boolean().default(true)` makes the input type `boolean | undefined` but output type `boolean`, and zodResolver requires matching input type
- **Fix:** Added `CreateProductFormInput = z.input<typeof createProductSchema>` to validations.ts; used it as the `useForm<T>` generic type in both form components
- **Files modified:** src/lib/validations/products.ts, product-form.tsx, product-detail-form.tsx
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 7ebbca2 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 - Bug)
**Impact on plan:** All fixes required for TypeScript correctness. No scope creep — same functionality delivered as planned.

## Issues Encountered

None - all deviations were auto-fixed inline during implementation.

## User Setup Required

None - no new external service configuration required. All pages use data layer from Plan 02-01.

## Next Phase Readiness

- All 4 product routes (/products, /products/new, /products/[id], /products/categories) compile and appear in next build output
- Product image upload (Plan 02-03) can proceed — imageUrl field already in both create and edit forms
- BulkActionBar pattern established, can be extended with additional bulk operations (bulk edit pricing etc.)
- Categories/groups management ready — data is queryable for use in price list phase

## Self-Check: PASSED

- All 10 new files verified in git log (e510185, 7ebbca2)
- `npx tsc --noEmit` passes with zero errors
- `npx next build` passes with all 4 routes: /products, /products/[id], /products/categories, /products/new
- await searchParams in products/page.tsx: confirmed line 14
- await params in products/[id]/page.tsx: confirmed line 14
- manualPagination: true in products-table.tsx: confirmed line 190
- enableRowSelection: true in products-table.tsx: confirmed line 206
- bulkDeleteProductsAction called in bulk-action-bar.tsx: confirmed line 17
- requireAdmin() in all 3 admin pages: confirmed (new/page.tsx, [id]/page.tsx, categories/page.tsx)

---
*Phase: 02-product-management*
*Completed: 2026-03-23*
