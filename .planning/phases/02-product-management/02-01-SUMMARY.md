---
phase: 02-product-management
plan: "01"
subsystem: database
tags: [prisma, mysql, minio, s3, mssql, subiekt-gt, server-actions, zod, dal, typescript]

# Dependency graph
requires:
  - phase: 01-foundation-auth-and-system-shell
    provides: "Auth.js v5 split config, DAL with requireAuth/requireAdmin, prisma singleton, server-only pattern, Server Actions pattern"

provides:
  - "Prisma schema with 5 product models (ProductCategory, ProductGroup, Product, ProductVariant, ProductPrice)"
  - "MinIO S3Client singleton at src/lib/minio.ts with forcePathStyle=true"
  - "Subiekt GT MSSQL ConnectionPool singleton at src/lib/dal/subiekt.ts with syncProductsFromSubiekt()"
  - "Product CRUD DAL: getProducts (pagination+search+filters), getProductById, createProduct, updateProduct, deleteProduct, bulkDeleteProducts"
  - "Category/group DAL: getCategories, getProductGroups, createCategory, createProductGroup"
  - "Server Actions: createProductAction, updateProductAction, deleteProductAction, bulkDeleteProductsAction"
  - "Zod v4 schemas: createProductSchema, updateProductSchema, bulkDeleteSchema"
  - "TypeScript types: ProductWithRelations, ProductListItem"

affects:
  - "02-02 (product list page uses getProducts + ProductListItem)"
  - "02-03 (product detail/edit uses getProductById + createProduct + updateProduct)"
  - "all subsequent Phase 2 plans (image upload uses minioClient, sync uses getSubiektConnection)"

# Tech tracking
tech-stack:
  added:
    - "@tanstack/react-table ^8.21.3"
    - "mssql ^12.2.1"
    - "@aws-sdk/client-s3 ^3.x"
    - "@aws-sdk/s3-request-presigner ^3.x"
    - "react-hook-form ^7.x"
    - "@hookform/resolvers ^5.x"
    - "xlsx 0.20.3 from CDN tgz (https://cdn.sheetjs.com)"
    - "@types/mssql ^9.x"
  patterns:
    - "MinIO S3Client globalThis singleton: same pattern as Prisma singleton, with forcePathStyle=true"
    - "MSSQL ConnectionPool globalThis singleton: prevents connection exhaustion on hot reload"
    - "Product DAL: requireAuth() for reads, requireAdmin() for writes (consistent with Phase 1 DAL)"
    - "Soft delete pattern: deleteProduct/bulkDeleteProducts set isActive=false, never hard delete"
    - "prisma import (not db): project uses `import { prisma } from '@/lib/db'` — matched throughout"

key-files:
  created:
    - "prisma/schema.prisma - Extended with ProductCategory, ProductGroup, Product, ProductVariant, ProductPrice"
    - "src/lib/minio.ts - MinIO S3Client singleton (server-only, forcePathStyle=true)"
    - "src/lib/dal/subiekt.ts - MSSQL pool singleton + syncProductsFromSubiekt()"
    - "src/types/products.ts - ProductWithRelations, ProductListItem TypeScript types"
    - "src/lib/validations/products.ts - createProductSchema, updateProductSchema, bulkDeleteSchema (Zod v4)"
    - "src/lib/dal/products.ts - Full product CRUD DAL with requireAuth/requireAdmin guards"
    - "src/lib/dal/product-categories.ts - Category and group lookups"
    - "src/lib/actions/products.ts - Server Actions for product CRUD + bulk delete"
  modified:
    - "next.config.ts - Added mssql to serverExternalPackages"
    - ".env.example - Added MINIO_* and SUBIEKT_* env vars"
    - "package.json - Added 7 new dependencies + 1 devDependency"

key-decisions:
  - "Used prisma import (not db) throughout new files to match existing codebase convention — plan used db but actual export is prisma"
  - "Zod v4 uses result.error.issues[0] not result.error.errors[0] — fixed to match v4 API used in project"
  - "prisma db pull skipped due to placeholder DATABASE_URL credentials — 5 models defined manually based on research"
  - "ActionState for products uses success?: string (not boolean) to carry count messages in bulkDelete"

patterns-established:
  - "Product soft delete: isActive=false only, never hard delete (FK safety for quotation_items etc.)"
  - "Server Action Zod error: result.error.issues[0]?.message for Zod v4 compatibility"

requirements-completed: [PROD-01, PROD-02, PROD-03, PROD-06]

# Metrics
duration: 22min
completed: "2026-03-23"
---

# Phase 2 Plan 01: Product Data Layer Summary

**Prisma schema extended with 5 product models, MinIO S3Client and Subiekt GT MSSQL singletons, full product CRUD DAL with pagination/search/filters, Server Actions with Zod v4 validation**

## Performance

- **Duration:** 22 min
- **Started:** 2026-03-23T11:18:00Z
- **Completed:** 2026-03-23T11:40:23Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Extended Prisma schema with 5 product models (ProductCategory, ProductGroup, Product, ProductVariant, ProductPrice) with correct @map annotations, relations, and Decimal fields; `npx prisma generate` succeeds
- Created MinIO S3Client singleton with `forcePathStyle: true` (prevents 403 on presigned URLs) and Subiekt GT MSSQL ConnectionPool singleton using globalThis pattern
- Built complete product CRUD DAL with pagination + search + categoryId/groupId filtering, all guarded with `requireAuth()` (reads) or `requireAdmin()` (writes); soft delete pattern throughout
- Server Actions for all CRUD operations following Phase 1 ActionState pattern with Zod v4 validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema extension, package installs, env vars, next.config.ts** - `1474390` (chore)
2. **Task 2: MinIO client, Subiekt GT client, product types, DAL, Server Actions, Zod schemas** - `462ebfb` (feat)

## Files Created/Modified

- `prisma/schema.prisma` - Added ProductCategory, ProductGroup, Product, ProductVariant, ProductPrice models
- `next.config.ts` - Added mssql to serverExternalPackages (prevents Edge runtime crash)
- `.env.example` - Added MINIO_* and SUBIEKT_* env var placeholders
- `package.json` - Added @tanstack/react-table, mssql, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, react-hook-form, @hookform/resolvers, xlsx (CDN), @types/mssql
- `src/lib/minio.ts` - S3Client singleton with forcePathStyle=true
- `src/lib/dal/subiekt.ts` - MSSQL ConnectionPool singleton + syncProductsFromSubiekt()
- `src/types/products.ts` - ProductWithRelations and ProductListItem types
- `src/lib/validations/products.ts` - createProductSchema, updateProductSchema, bulkDeleteSchema
- `src/lib/dal/products.ts` - getProducts, getProductById, createProduct, updateProduct, deleteProduct, bulkDeleteProducts
- `src/lib/dal/product-categories.ts` - getCategories, getProductGroups, createCategory, createProductGroup
- `src/lib/actions/products.ts` - createProductAction, updateProductAction, deleteProductAction, bulkDeleteProductsAction

## Decisions Made

- Used `prisma` import (not `db`) throughout new files — the plan called for `import { db } from "@/lib/db"` but the actual export from db.ts is `prisma`, and all existing Phase 1 DAL files use `prisma`. Matched existing convention.
- `prisma db pull` skipped: DATABASE_URL has placeholder credentials (noted in STATE.md blockers). All 5 product models were defined manually based on confirmed research from kalkulator2025 MySQL schema.
- `ActionState.success` uses `string` type (not `boolean`) for products actions to carry useful messages like "Usunięto 5 produktów".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Import name mismatch: plan used `db`, codebase exports `prisma`**
- **Found during:** Task 2 (creating DAL files)
- **Issue:** Plan code used `import { db } from "@/lib/db"` but `src/lib/db.ts` exports `prisma`, not `db`. All Phase 1 DAL files use `import { prisma } from "@/lib/db"`. Using `db` would cause TypeScript errors and runtime failures.
- **Fix:** Used `import { prisma } from "@/lib/db"` throughout all new DAL files and subiekt.ts
- **Files modified:** src/lib/dal/products.ts, src/lib/dal/product-categories.ts, src/lib/dal/subiekt.ts
- **Verification:** `npx tsc --noEmit` passes, `npx next build` succeeds
- **Committed in:** 462ebfb (Task 2 commit)

**2. [Rule 1 - Bug] Zod v4 `.errors` property doesn't exist — use `.issues`**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** Plan used `result.error.errors[0].message` but Zod v4 uses `result.error.issues` not `.errors`. TypeScript error TS2339: "Property 'errors' does not exist on type 'ZodError'". Existing Phase 1 actions use `flatten().fieldErrors`.
- **Fix:** Changed to `result.error.issues[0]?.message ?? "Nieprawidłowe dane"` in all 3 safeParse call sites
- **Files modified:** src/lib/actions/products.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 462ebfb (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes required for TypeScript correctness and runtime correctness. No scope creep.

## Issues Encountered

- `prisma db pull` failed with P1000 (authentication) as expected — DATABASE_URL still has placeholder credentials from initial setup. All 5 product models defined manually from research. No data risk; models match confirmed kalkulator2025 MySQL schema.

## User Setup Required

None - no new external service configuration required for this plan. However, to use the new features:
- Update `DATABASE_URL` in `.env` with real MySQL credentials to run `prisma db pull` and verify schema alignment
- Add `MINIO_*` and `SUBIEKT_*` env vars to `.env` (see `.env.example`)

## Next Phase Readiness

- Product data layer is complete and fully typed
- Plan 02-02 (product list page) can immediately use `getProducts()` + `ProductListItem` type + `DataTable` component from Phase 1
- Plan 02-03 (product create/edit) can use `createProductAction`/`updateProductAction` with react-hook-form + Zod schemas
- MinIO and Subiekt singletons ready but will only work once real env vars are set

## Self-Check: PASSED

- All 8 new files verified on disk
- Task commits 1474390 and 462ebfb exist in git log
- `npx prisma generate` passes (5 product models in schema)
- `npx tsc --noEmit` passes (zero TypeScript errors)
- `npx next build` passes (all routes compiled successfully)

---
*Phase: 02-product-management*
*Completed: 2026-03-23*
