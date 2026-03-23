# Phase 2: Product Management - Research

**Researched:** 2026-03-23
**Domain:** Product catalog management — Prisma + MySQL, MinIO S3 image uploads, SheetJS Excel import, Subiekt GT MSSQL sync, TanStack Table pagination/bulk ops
**Confidence:** HIGH (stack verified from codebase + Context7/official docs)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROD-01 | Użytkownik może przeglądać listę produktów z wyszukiwaniem i filtrami | TanStack Table v8 server-side pagination/filtering; existing DataTable<T> component from Phase 1 |
| PROD-02 | Admin może tworzyć, edytować i usuwać produkty (nazwa, SKU, opis, cena zakupu) | Prisma product/variant/category models + Server Actions pattern from Phase 1 |
| PROD-03 | Admin może przypisywać produkty do kategorii/grup produktowych | product_categories + product_groups MySQL tables confirmed in kalkulator2025 schema |
| PROD-04 | Admin może uploadować zdjęcia produktów | AWS SDK v3 S3Client with MinIO endpoint + presigned PUT URL — domain `minio.allbag.pl` already in next.config.ts remotePatterns |
| PROD-05 | Admin może importować produkty z pliku Excel | SheetJS xlsx 0.20.3 from CDN tgz, multipart Route Handler in Next.js App Router |
| PROD-06 | System może synchronizować produkty z Subiekt GT (import) | Subiekt GT uses MSSQL (SQL Server 2019) on 10.0.0.115\INSERTGT; connect via `mssql` npm package with globalThis singleton |
| PROD-07 | Admin może wykonywać operacje masowe na produktach (edycja, usunięcie) | shadcn/ui bulk actions pattern: DataTable row selection + fixed floating action bar + Server Actions |
</phase_requirements>

---

## Summary

Phase 2 builds the full product catalog on top of the Phase 1 foundation (Auth.js v5, Prisma 6 + MySQL 8, Aether design system, DataTable/StatCard components, Server Actions pattern). The existing MySQL database (shared with kalkulator2025 PHP) already has product tables: `products`, `product_variants`, `product_prices`, `product_categories`, and `product_groups`. The Prisma schema must be extended — no migrations, only `db pull` to sync, then manually add models. All PHP image references use `image_url` as a plain URL string pointing to MinIO.

The key technical unknowns going into this phase were: (1) Subiekt GT connection type (confirmed: MSSQL via `sqlsrv`/`mssql` npm, NOT COM object), (2) MinIO integration pattern (confirmed: AWS SDK v3 S3Client with `forcePathStyle: true`, `endpoint` override, `minio.allbag.pl` already in remotePatterns), and (3) Excel import (confirmed: SheetJS from CDN tgz only — npm registry version is 2+ years stale with high severity CVE). The Phase 1 DataTable component and Server Action pattern carry directly into Phase 2 with no architectural changes needed.

**Primary recommendation:** Extend the Prisma schema with 5 product models (db pull first), implement image upload via presigned PUT URL route, Excel import via multipart Route Handler with SheetJS, Subiekt GT via globalThis-singleton `mssql` pool, and reuse the existing DataTable with TanStack Table server-side mode for the product list page.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | ^8.21.x | Headless table with server-side pagination/sorting/filtering | Already implied by DataTable usage in Phase 1; official headless solution for Next.js 15 |
| mssql | ^11.x | Subiekt GT (MSSQL) connection pool | Official Node.js SQL Server client; connects to `10.0.0.115\INSERTGT` |
| @aws-sdk/client-s3 | ^3.x | MinIO image upload via S3-compatible API | AWS SDK v3 works with MinIO via `forcePathStyle: true` + `endpoint` override |
| @aws-sdk/s3-request-presigner | ^3.x | Presigned PUT URL generation | Same package family as client-s3; server-only usage |
| xlsx (SheetJS) | 0.20.3 from CDN | Excel file import server-side | Must install from CDN tgz (npm registry has old vulnerable version) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | ^7.x | Product create/edit form with validation | Complex multi-field forms (PROD-02) |
| @hookform/resolvers | ^3.x | Zod resolver for react-hook-form | Consistent with Zod v4 already in project |
| sharp | ^0.33.x | Server-side image resize/optimize before MinIO upload | Optional: compress before upload |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @aws-sdk/client-s3 | minio npm client | AWS SDK v3 is more maintained; already proven pattern with MinIO |
| react-hook-form | useActionState (Server Action) | For complex product form with image + variants, RHF provides better client-side UX |
| mssql | tedious (raw driver) | `mssql` wraps tedious with connection pooling already; less boilerplate |

**Installation:**
```bash
npm install @tanstack/react-table mssql @aws-sdk/client-s3 @aws-sdk/s3-request-presigner react-hook-form @hookform/resolvers
npm install --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

**Types for mssql:**
```bash
npm install --save-dev @types/mssql
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(dashboard)/products/           # PROD-01: product list page (Server Component)
│   ├── page.tsx                        # requireAuth() + server fetch + DataTable
│   └── _components/
│       ├── products-table.tsx          # Client: DataTable with row selection
│       └── bulk-action-bar.tsx         # Client: fixed floating bar on selection
├── app/(dashboard)/products/[id]/      # PROD-02: product detail/edit
│   ├── page.tsx
│   └── _components/
│       ├── product-form.tsx            # react-hook-form + Zod
│       └── image-uploader.tsx          # presigned URL upload client
├── app/(dashboard)/products/new/       # PROD-02: create product
│   └── page.tsx
├── app/(dashboard)/products/import/   # PROD-05: Excel import UI
│   └── page.tsx
├── app/(dashboard)/products/sync/     # PROD-06: Subiekt GT sync UI
│   └── page.tsx
├── app/api/products/
│   ├── upload/route.ts                 # GET: generate presigned PUT URL (PROD-04)
│   └── import/route.ts                 # POST: multipart Excel upload + SheetJS parse (PROD-05)
├── lib/
│   ├── dal/products.ts                 # getProducts, getProductById, createProduct, updateProduct, deleteProduct
│   ├── dal/product-categories.ts       # getCategories, getProductGroups
│   ├── dal/subiekt.ts                  # getSubiektConnection() singleton + syncProductsFromSubiekt()
│   ├── actions/products.ts             # createProductAction, updateProductAction, deleteProductAction, bulkDeleteAction
│   ├── actions/products-import.ts      # importProductsAction (calls Route Handler)
│   ├── validations/products.ts         # createProductSchema, updateProductSchema (Zod v4)
│   └── minio.ts                        # S3Client singleton with MinIO config
├── types/
│   └── products.ts                     # Product, ProductVariant, ProductCategory types
```

### Pattern 1: Server-Side Pagination with URL State
**What:** TanStack Table with `manualPagination: true`, reading `?page=` and `?q=` from URL via `searchParams` in the Server Component, passing pre-fetched data to Client Component.
**When to use:** All list pages — URL state means shareable links, Back button works, no flicker.

```typescript
// Source: https://tanstack.com/table/v8/docs/guide/pagination
// app/(dashboard)/products/page.tsx (Server Component)
export default async function ProductsPage({ searchParams }) {
  const { page = "1", q = "", category = "" } = await searchParams;
  await requireAuth();
  const { products, total } = await getProducts({
    page: parseInt(page),
    pageSize: 20,
    search: q,
    categoryId: category ? parseInt(category) : undefined,
  });
  return <ProductsTable data={products} total={total} />;
}

// app/(dashboard)/products/_components/products-table.tsx (Client Component)
"use client";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const table = useReactTable({
  data,
  columns,
  manualPagination: true,
  rowCount: total,
  state: { pagination: { pageIndex: page - 1, pageSize: 20 }, rowSelection },
  onPaginationChange: (updater) => {
    // push new ?page= to URL
  },
  getCoreRowModel: getCoreRowModel(),
  enableRowSelection: true,
  onRowSelectionChange: setRowSelection,
});
```

### Pattern 2: Presigned URL Image Upload
**What:** Server-side API route generates a presigned PUT URL, client uploads directly to MinIO, stores resulting URL in product record.
**When to use:** PROD-04 image uploads — keeps file bytes off Next.js server, works with standalone output.

```typescript
// Source: https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
// src/lib/minio.ts
import { S3Client } from "@aws-sdk/client-s3";

const globalForMinio = globalThis as unknown as { minioClient?: S3Client };

export const minioClient = globalForMinio.minioClient ?? new S3Client({
  region: process.env.MINIO_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  endpoint: process.env.MINIO_ENDPOINT, // e.g. https://minio.allbag.pl
  forcePathStyle: true,                  // REQUIRED for MinIO
});

if (process.env.NODE_ENV !== "production") globalForMinio.minioClient = minioClient;

// src/app/api/products/upload/route.ts
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { minioClient } from "@/lib/minio";
import { requireAdmin } from "@/lib/dal/auth";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const filename = request.nextUrl.searchParams.get("filename")!;
  const key = `products/${Date.now()}-${filename}`;
  const command = new PutObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
    ContentType: request.nextUrl.searchParams.get("contentType") ?? "image/jpeg",
  });
  const url = await getSignedUrl(minioClient, command, { expiresIn: 300 });
  const publicUrl = `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET}/${key}`;
  return Response.json({ presignedUrl: url, publicUrl });
}
```

### Pattern 3: SheetJS Excel Import Route Handler
**What:** POST route handler accepts multipart FormData with Excel file, parses with SheetJS `XLSX.read()`, upserts products in a DB transaction.
**When to use:** PROD-05 — server handles parsing, returns {imported, updated, skipped, errors}.

```typescript
// Source: https://docs.sheetjs.com/docs/demos/net/server/
// src/app/api/products/import/route.ts
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  await requireAdmin();
  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  // upsert logic — see Code Examples section
  return Response.json({ imported, updated, skipped, errors });
}
```

### Pattern 4: Subiekt GT MSSQL Singleton
**What:** globalThis singleton for mssql ConnectionPool, same pattern as Prisma singleton.
**When to use:** PROD-06 sync — reuse connection across requests in dev hot reload.

```typescript
// Source: https://tediousjs.github.io/node-mssql/
// src/lib/dal/subiekt.ts — server-only
import "server-only";
import * as sql from "mssql";

const globalForSubiekt = globalThis as unknown as { subiektPool?: sql.ConnectionPool };

const subiektConfig: sql.config = {
  server: process.env.SUBIEKT_SERVER!,   // "10.0.0.115\\INSERTGT"
  database: process.env.SUBIEKT_DATABASE!, // "Allbagspzoo"
  user: process.env.SUBIEKT_USER!,
  password: process.env.SUBIEKT_PASSWORD!,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
};

export async function getSubiektConnection(): Promise<sql.ConnectionPool> {
  if (!globalForSubiekt.subiektPool) {
    globalForSubiekt.subiektPool = await new sql.ConnectionPool(subiektConfig).connect();
  }
  return globalForSubiekt.subiektPool;
}
```

**Key Subiekt GT table names** (confirmed from kalkulator2025 queries):
- `tw__Towar` — products (tw_Id, tw_Symbol=SKU, tw_Nazwa=name, tw_Cena=price)
- `dok__Dokument` — documents (PZ=purchase, FS=invoice, MM=warehouse transfer)
- `dok_Pozycja` — document line items (ob_TowId, ob_Ilosc, ob_CenaNetto)
- `sl_Magazyn` — warehouses

### Pattern 5: Bulk Operations with Floating Action Bar
**What:** Row selection state in TanStack Table triggers a `position: fixed` action bar at bottom of screen with delete/edit options.
**When to use:** PROD-07 — DataTable already has `enableRowSelection`, just add the bar.

```typescript
// Client component pattern (no external library needed)
// bulk-action-bar.tsx
const selectedCount = Object.keys(rowSelection).length;
if (selectedCount === 0) return null;

return (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass rounded-xl px-6 py-3 flex items-center gap-4">
    <span className="text-sm text-aether-text">{selectedCount} zaznaczonych</span>
    <GlowButton variant="destructive" onClick={() => handleBulkDelete(selectedIds)}>
      Usuń zaznaczone
    </GlowButton>
    <button onClick={() => setRowSelection({})}>Anuluj</button>
  </div>
);
```

### Anti-Patterns to Avoid
- **Calling XLSX.read on the client:** SheetJS in the browser means exposing parsing to untrusted environments; parse server-side only.
- **Using `npm install xlsx`:** The npm registry version is 18.5 (2+ years old, high severity CVE). Always install from `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`.
- **Storing MinIO credentials in client components:** `minioClient` and presigned URL generation must be in Route Handlers or Server Actions only.
- **Running `prisma migrate`:** Shared MySQL DB with PHP. Use only `prisma db pull` then manually extend schema with new product models. Never migrate.
- **Storing the full file in Next.js for image uploads:** With `output: "standalone"`, the filesystem is ephemeral. Always upload directly to MinIO via presigned URL.
- **Using `sql.connect()` global pool with multiple configs:** `mssql` global pool only supports one config. Use `new sql.ConnectionPool(config).connect()` with globalThis singleton for the Subiekt connection.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excel parsing | Custom xlsx byte parser | SheetJS xlsx 0.20.3 | Handles .xls + .xlsx, BOM, merged cells, type coercion |
| SQL Server connection | Direct tedious TCP socket | `mssql` npm package | Connection pooling, parameterized queries, transactions built-in |
| S3 presigned URL crypto | Manual HMAC-SHA256 signing | @aws-sdk/s3-request-presigner | Auth SigV4 is complex; library handles expiry, headers |
| Table pagination logic | Custom cursor/offset logic | TanStack Table v8 `manualPagination` | Row count, page count, direction all handled |
| Image file validation | MIME type check in JS | Content-Type + file size check in Route Handler + accept attribute | Browser accept + server content-type check is sufficient |

**Key insight:** Excel parsing looks simple but has dozens of edge cases (merged cells, date serial numbers, encoding, formula cells). SheetJS handles all of them; any custom parser will fail in production.

---

## Common Pitfalls

### Pitfall 1: SheetJS npm registry version
**What goes wrong:** `npm install xlsx` installs version 0.18.5 from npm which has a high severity vulnerability (prototype pollution).
**Why it happens:** SheetJS moved off npm registry after 0.18.5.
**How to avoid:** Install `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` directly.
**Warning signs:** `npm audit` shows high severity on xlsx package.

### Pitfall 2: MinIO `forcePathStyle` missing
**What goes wrong:** Presigned URL returns 403 or `SignatureDoesNotMatch` even with correct credentials.
**Why it happens:** AWS SDK v3 defaults to virtual-hosted-style URLs (`bucket.endpoint`) but MinIO requires path-style (`endpoint/bucket`).
**How to avoid:** Always set `forcePathStyle: true` in `S3Client` config when using MinIO.
**Warning signs:** Upload returns 403 SignatureDoesNotMatch despite correct keys.

### Pitfall 3: mssql Edge runtime crash
**What goes wrong:** Importing `mssql` in middleware or Edge runtime causes build failure.
**Why it happens:** `mssql` uses Node.js APIs (net, tls) not available in Edge.
**How to avoid:** Add `mssql` to `serverExternalPackages` in next.config.ts, and put all Subiekt code in `server-only` files.
**Warning signs:** Build error "The edge runtime does not support Node.js 'net' module".

**Fix:**
```typescript
// next.config.ts
serverExternalPackages: ["bcryptjs", "mssql"],
```

### Pitfall 4: Prisma schema out of sync with MySQL
**What goes wrong:** Prisma generates wrong TypeScript types because schema doesn't match actual DB columns.
**Why it happens:** The DB was last modified by PHP scripts; `prisma db pull` has NOT been run yet (noted as a blocker in STATE.md).
**How to avoid:** Run `npx prisma db pull` as Wave 0 task #1 before any product models are used. Do NOT run `prisma migrate`.
**Warning signs:** Prisma throws "Unknown column" at runtime; TypeScript shows unknown fields.

### Pitfall 5: Next.js Image component with MinIO path
**What goes wrong:** Product images don't load — `next/image` throws "hostname not configured".
**Why it happens:** `next.config.ts` only has `minio.allbag.pl` but images may use path `/products/bucket/...`.
**How to avoid:** `next.config.ts` already has `{ protocol: "https", hostname: "minio.allbag.pl" }` — this is sufficient. Ensure `publicUrl` returned from presigned URL endpoint uses this hostname.
**Warning signs:** `Error: Invalid src prop (https://minio.allbag.pl/...) on next/image`.

### Pitfall 6: React 19 `useActionState` in product forms
**What goes wrong:** Using `useFormState` from react-dom causes deprecation warning or type error.
**Why it happens:** React 19 moved `useFormState` → `useActionState`. Phase 1 already handles this but easy to regress when copy-pasting from old examples.
**How to avoid:** Always use `useActionState` from `react` (not react-dom) per Phase 1 patterns.
**Warning signs:** TypeScript error TS2339 on `useFormState`, or deprecation console warning.

### Pitfall 7: File size limit for Excel import
**What goes wrong:** Large Excel files (>4MB) fail with 413 or timeout.
**Why it happens:** Next.js Route Handler default body size limit.
**How to avoid:** Add `export const config = { api: { bodyParser: false } }` (Pages Router) or handle streaming in App Router. For App Router: `request.formData()` has no limit by default, but be aware of memory.
**Warning signs:** 413 Payload Too Large on import route.

---

## Code Examples

Verified patterns from official sources and project codebase:

### Prisma Product Models (to add after db pull)
```typescript
// prisma/schema.prisma additions (after running prisma db pull)
// Source: inferred from kalkulator2025 MySQL table DDL

model ProductCategory {
  id           Int       @id @default(autoincrement())
  name         String    @db.VarChar(255)
  slug         String    @unique @db.VarChar(255)
  description  String?   @db.Text
  displayOrder Int       @default(0) @map("display_order")
  isActive     Boolean   @default(true) @map("is_active")
  createdAt    DateTime  @default(now()) @map("created_at")
  products     Product[]
  @@map("product_categories")
}

model ProductGroup {
  id              Int      @id @default(autoincrement())
  name            String   @db.VarChar(100)
  displayOrder    Int      @default(0) @map("display_order")
  backgroundColor String   @default("white") @map("background_color") @db.VarChar(20)
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  products        Product[]
  @@map("product_groups")
}

model Product {
  id             Int              @id @default(autoincrement())
  categoryId     Int?             @map("category_id")
  productGroupId Int?             @map("product_group_id")
  name           String           @db.VarChar(255)
  slug           String           @unique @db.VarChar(255)
  sku            String?          @unique @db.VarChar(100)
  description    String?          @db.Text
  imageUrl       String?          @map("image_url") @db.VarChar(500)
  shopUrl        String?          @map("shop_url") @db.VarChar(500)
  price          Decimal?         @db.Decimal(10, 4)  // purchase price
  paperType      String?          @map("paper_type") @db.VarChar(100)
  grammage       Int?
  boxQuantity    Int?             @map("box_quantity")
  palletQuantity Int?             @map("pallet_quantity")
  boxDimensions  String?          @map("box_dimensions") @db.VarChar(50)
  boxWeight      Decimal?         @map("box_weight") @db.Decimal(8, 2)
  isActive       Boolean          @default(true) @map("is_active")
  displayOrder   Int              @default(0) @map("display_order")
  createdAt      DateTime         @default(now()) @map("created_at")
  updatedAt      DateTime         @updatedAt @map("updated_at")
  category       ProductCategory? @relation(fields: [categoryId], references: [id])
  group          ProductGroup?    @relation(fields: [productGroupId], references: [id])
  variants       ProductVariant[]
  @@map("products")
}

model ProductVariant {
  id                Int            @id @default(autoincrement())
  productId         Int            @map("product_id")
  sku               String?        @unique @db.VarChar(100)
  width             Int?
  depth             Int?
  height            Int?
  dimensionsDisplay String?        @map("dimensions_display") @db.VarChar(50)
  isActive          Boolean        @default(true) @map("is_active")
  displayOrder      Int            @default(0) @map("display_order")
  createdAt         DateTime       @default(now()) @map("created_at")
  updatedAt         DateTime       @updatedAt @map("updated_at")
  product           Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  prices            ProductPrice[]
  @@map("product_variants")
}

model ProductPrice {
  id             Int            @id @default(autoincrement())
  variantId      Int            @map("variant_id")
  colorType      String         @map("color_type") // "standard" | "color" | "pastel"
  colorName      String?        @map("color_name") @db.VarChar(50)
  priceWholesale Decimal?       @map("price_wholesale") @db.Decimal(10, 4)
  priceWhite     Decimal?       @map("price_white") @db.Decimal(10, 4)
  priceColor     Decimal?       @map("price_color") @db.Decimal(10, 4)
  priceNetto     Decimal?       @map("price_netto") @db.Decimal(10, 4)
  isActive       Boolean        @default(true) @map("is_active")
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")
  variant        ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  @@map("product_prices")
}
```

### DAL: getProducts with pagination + search
```typescript
// Source: Phase 1 DAL pattern (src/lib/dal/users.ts)
// src/lib/dal/products.ts
import "server-only";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/dal/auth";

export async function getProducts(params: {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: number;
}) {
  await requireAuth();
  const { page, pageSize, search, categoryId } = params;
  const skip = (page - 1) * pageSize;

  const where = {
    isActive: true,
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } },
      ],
    } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const [products, total] = await db.$transaction([
    db.product.findMany({ where, skip, take: pageSize, orderBy: { name: "asc" }, include: { category: true } }),
    db.product.count({ where }),
  ]);

  return { products, total };
}
```

### Excel Import — row mapping
```typescript
// Source: kalkulator2025/api/admin/products-import.php field mapping (translated)
// Expected Excel columns (matching kalkulator2025 export format):
// name | sku | description | image_url | category_name | paper_type | grammage |
// box_quantity | pallet_quantity | price (purchase) | is_active

interface ExcelProductRow {
  name?: string;
  sku?: string;
  description?: string;
  image_url?: string;
  category_name?: string;
  price?: number;
  is_active?: string;
}
```

### Environment Variables to Add
```bash
# .env additions for Phase 2
MINIO_ENDPOINT="https://minio.allbag.pl"
MINIO_ACCESS_KEY="..."
MINIO_SECRET_KEY="..."
MINIO_BUCKET="crm-storage"           # from kalkulator2025 config.php
MINIO_REGION="us-east-1"
MINIO_PUBLIC_URL="https://minio.allbag.pl"

SUBIEKT_SERVER="10.0.0.115\\INSERTGT"
SUBIEKT_DATABASE="Allbagspzoo"
SUBIEKT_USER="kevin"
SUBIEKT_PASSWORD="..."               # from kalkulator2025 subiekt/config.json
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSV-only import (kalkulator2025) | Excel (.xlsx) import via SheetJS | Phase 2 | Matches actual ALLBAG workflow which uses Excel |
| Local filesystem image storage (`/assets/images/products/`) | MinIO S3 presigned URL upload | Phase 2 | Compatible with standalone Next.js output, no ephemeral disk |
| PHP sqlsrv extension for Subiekt | `mssql` npm package with Node.js | Phase 2 | Same SQL Server 2019 backend, different driver |
| Client-side table rendering | TanStack Table v8 + URL-state pagination | Phase 2 | Scales to 3000+ product catalog |

**Deprecated/outdated:**
- `xlsx` from npm registry (0.18.5): replaced by CDN tgz 0.20.3 — high severity CVE in npm version
- `useFormState` from react-dom: replaced by `useActionState` from react (React 19, already in project)
- `next/image` `domains` config: replaced by `remotePatterns` (already migrated in next.config.ts)

---

## Open Questions

1. **Does `product_group_id` column exist on the `products` table in the live MySQL DB?**
   - What we know: `product_groups` table exists (confirmed). `products.category_id` is referenced. Product group foreign key is in pricing system but may not be on `products` table yet.
   - What's unclear: Exact current MySQL schema — `prisma db pull` must be run first.
   - Recommendation: Run `prisma db pull` in Wave 0 task before writing any product DAL. If `product_group_id` column doesn't exist, create it via raw MySQL ALTER (no Prisma migrate).

2. **Is MinIO accessible from the dev machine (localhost)?**
   - What we know: `MINIO_ENDPOINT` in kalkulator2025 is `http://127.0.0.1:9000` (local) but `minio.allbag.pl` is the public domain in next.config.ts.
   - What's unclear: Whether `minio.allbag.pl` resolves on `mail.allbag.pl` server where the app runs.
   - Recommendation: Use `process.env.MINIO_ENDPOINT` for the S3Client config (works in both dev/prod). Add `MINIO_ENDPOINT=http://127.0.0.1:9000` for local dev.

3. **Subiekt GT access from the Next.js server (mail.allbag.pl)**
   - What we know: Subiekt is on `10.0.0.115\INSERTGT` (local network). kalkulator2025 connects from the same server.
   - What's unclear: Whether the Next.js PM2 process on mail.allbag.pl can reach 10.0.0.115 (same LAN — likely yes).
   - Recommendation: Test connection in a Route Handler `/api/subiekt/test` as Wave 0 before implementing full sync.

---

## Sources

### Primary (HIGH confidence)
- **kalkulator2025 codebase** — `api/admin/products.php`, `api/reports/subiekt-deliveries-v2.php`, `subiekt/config.json`, `config.php` — MySQL table schemas, Subiekt GT MSSQL connection confirmed (sqlsrv → mssql npm), MinIO config constants
- **kalkulator2026 codebase** — `next.config.ts` (MinIO remotePatterns already set), `prisma/schema.prisma` (10 models, product models not yet added), `package.json` (Phase 1 deps)
- **Phase 1 SUMMARY files** — DataTable<T> component, Server Action pattern, DAL pattern, globalThis singleton all established

### Secondary (MEDIUM confidence)
- [TanStack Table v8 Pagination Guide](https://tanstack.com/table/v8/docs/guide/pagination) — `manualPagination`, `rowCount`, `onPaginationChange` API
- [SheetJS Official Docs — HTTP Server](https://docs.sheetjs.com/docs/demos/net/server/) — `XLSX.read(buffer, {type: "array"})` server-side pattern
- [SheetJS Official Docs — HTTP Uploads](https://docs.sheetjs.com/docs/demos/net/upload/) — FormData upload pattern
- [AWS Official Docs — Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html) — `PutObjectCommand` + `getSignedUrl`
- [node-mssql Official Docs](https://tediousjs.github.io/node-mssql/) — connection pool config, singleton pattern
- [MinIO GitHub Discussion #14709](https://github.com/minio/minio/discussions/14709) — AWS SDK v3 `forcePathStyle: true` required for MinIO

### Tertiary (LOW confidence)
- shadcn/ui bulk actions table block pattern — no direct URL; pattern inferred from shadcn.io/blocks/tables-bulk-actions description

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against official docs and existing kalkulator2025 codebase
- Architecture: HIGH — follows established Phase 1 patterns (DAL, Server Actions, DataTable)
- Subiekt GT connection: HIGH — confirmed MSSQL via sqlsrv in live PHP code; `mssql` npm is direct equivalent
- MinIO/S3 pattern: HIGH — `forcePathStyle` confirmed via official MinIO GitHub discussion; config already in next.config.ts
- SheetJS version: HIGH — CDN-only install confirmed by official SheetJS docs
- Prisma schema for products: MEDIUM — inferred from PHP DDL scripts; exact live schema needs `prisma db pull` to confirm

**Research date:** 2026-03-23
**Valid until:** 2026-05-23 (stable stack; mssql + SheetJS + TanStack Table are mature)
