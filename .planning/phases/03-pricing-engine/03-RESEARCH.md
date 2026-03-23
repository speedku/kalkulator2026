# Phase 3: Pricing Engine - Research

**Researched:** 2026-03-23
**Domain:** Prisma schema extension, margin-based price calculation, React inline grid editor, user-price-list assignment
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PRICE-01 | Admin can create price lists (price lists) for different customer groups | DB schema confirmed in kalkulator2025 + Prisma model design documented |
| PRICE-02 | Admin can set margins in price list x product group matrix | `price_list_margins` schema confirmed; UNIQUE KEY on (price_list_id, product_group_id); upsert pattern from PHP documented |
| PRICE-03 | System automatically calculates sale prices from purchase price and margin | Formula confirmed: `salePrice = cost / (1 - marginPercent/100)`; `Product.price` is the purchase/cost field |
| PRICE-04 | User can view their assigned price list | `users` table has NO `price_list_id` in kalkulator2025 — new column + Prisma relation needed |
| PRICE-05 | Admin can clone price lists and bulk-edit them | Clone = copy `price_lists` row + copy all `price_list_margins` rows; Server Action + Prisma transaction pattern |
</phase_requirements>

---

## Summary

Phase 3 introduces three interconnected DB tables (`price_lists`, `product_groups` supplement, `price_list_margins`) onto an existing Prisma schema, plus a `price_list_id` FK on the `users` table. The kalkulator2025 legacy system provides the exact schema and the canonical pricing formula: `salePrice = cost / (1 - margin/100)` — no ambiguity there. The `ProductGroup` Prisma model already exists from Phase 2, which means the matrix junction table can be added without any new entity modelling for groups.

The main UI challenge is the margin matrix editor: a 2D grid where rows are price lists and columns are product groups (or vice-versa), with each cell being an inline-editable percentage. The legacy admin-price-lists.php achieves this with vanilla JS, but the 2026 implementation should use React controlled state (Zustand for local edit buffer) + a single batch Server Action to persist all changes atomically. URL state is NOT needed for this editor — local Zustand state is sufficient since the grid is session-only edit state, not shareable state.

The user-to-price-list assignment is a new capability not present in kalkulator2025 (quotations carried priceListId directly, users did not have a price_list_id column). Phase 3 must add `price_list_id INT NULL` to the `users` table in the database (migration-free since we use `prisma db pull` pattern on shared MySQL) AND add the Prisma relation in schema.prisma. The "view assigned price list" page for users requires a read-only DAL function that joins the user's priceList with its margins.

**Primary recommendation:** Add 2 new Prisma models (`PriceList`, `PriceListMargin`) + extend `User` with optional `priceListId` relation; build the matrix editor as a client component with Zustand local state + one batch upsert Server Action; derive all displayed sale prices in-memory from the formula rather than storing computed values.

---

## Standard Stack

### Core (all already installed — zero new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.19.2 | ORM for price_lists/margins schema | Already in use; `prisma db pull` + manual model approach established |
| Zod | 4.3.6 | Validation for price list + margin Server Actions | Already in use; `result.error.issues[0]` pattern established |
| React Hook Form | 7.72.0 | Price list create/edit form | Already in use; `zodResolver` + `z.input<Schema>` pattern established |
| Zustand | 5.0.12 | Client-side margin matrix edit buffer | Already installed; perfect for local edit state without URL pollution |
| TanStack Table | 8.21.3 | Price list admin table | Already in use; `DataTable<T>` generic pattern established |
| Sonner | 2.0.7 | Toast notifications for save/clone actions | Already in use across Phase 1-2 |

### No new packages required

All necessary libraries are already installed. Phase 3 is purely additive Prisma schema + UI work.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── dal/
│   │   └── price-lists.ts       # Server-only DAL: getPriceLists, getPriceListById,
│   │                            #   createPriceList, updatePriceList, deletePriceList,
│   │                            #   upsertMargins, clonePriceList, getUserPriceList
│   └── actions/
│       └── price-lists.ts       # "use server": createPriceListAction, updatePriceListAction,
│                                #   deletePriceListAction, batchUpsertMarginsAction,
│                                #   clonePriceListAction, assignPriceListAction
│   └── validations/
│       └── price-lists.ts       # Zod schemas: createPriceListSchema, marginSchema,
│                                #   batchMarginsSchema, assignPriceListSchema
├── app/(dashboard)/
│   └── price-lists/
│       ├── page.tsx             # Server Component: list all price lists (admin view)
│       ├── new/
│       │   └── page.tsx         # Server Component + create form
│       ├── [id]/
│       │   ├── page.tsx         # Server Component: price list detail + matrix editor
│       │   └── _components/
│       │       ├── price-list-form.tsx       # RHF edit form (name, code, description)
│       │       └── margin-matrix-editor.tsx  # Client: Zustand edit buffer + batch save
│       └── my-price-list/
│           └── page.tsx         # Server Component: user view (requireAuth, no admin)
└── types/
    └── price-lists.ts           # TypeScript types for PriceList, PriceListWithMargins, etc.
```

### Pattern 1: Prisma Models to Add

The `ProductGroup` model already exists in `prisma/schema.prisma` from Phase 2. Only `PriceList`, `PriceListMargin`, and the `User.priceListId` relation need to be added.

**What to add to schema.prisma:**

```typescript
// Add AFTER Phase 2 models in prisma/schema.prisma
// Source: kalkulator2025/migrate-create-price-system.php (confirmed schema)

model PriceList {
  id           Int               @id @default(autoincrement())
  code         String            @unique @db.VarChar(50)
  name         String            @db.VarChar(100)
  description  String?           @db.Text
  isActive     Boolean           @default(true) @map("is_active")
  displayOrder Int               @default(0) @map("display_order")
  createdAt    DateTime          @default(now()) @map("created_at")
  updatedAt    DateTime          @updatedAt @map("updated_at")
  margins      PriceListMargin[]
  users        User[]

  @@map("price_lists")
}

model PriceListMargin {
  id             Int          @id @default(autoincrement())
  priceListId    Int          @map("price_list_id")
  productGroupId Int          @map("product_group_id")
  marginPercent  Decimal      @map("margin_percent") @db.Decimal(5, 2)
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")
  priceList      PriceList    @relation(fields: [priceListId], references: [id], onDelete: Cascade)
  productGroup   ProductGroup @relation(fields: [productGroupId], references: [id], onDelete: Cascade)

  @@unique([priceListId, productGroupId])
  @@map("price_list_margins")
}
```

**Changes to existing models:**

```typescript
// In model User — add after existing fields:
priceListId  Int?       @map("price_list_id")
priceList    PriceList? @relation(fields: [priceListId], references: [id])

// In model ProductGroup — add relation back:
margins  PriceListMargin[]
```

**CRITICAL — database changes required (NOT prisma migrate):**
Since we never run `prisma migrate` on the shared production MySQL, the executor must run these raw SQL statements on the actual database before running `prisma db pull`:

```sql
-- Run on allbag_kalkulator database:
CREATE TABLE IF NOT EXISTS price_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS price_list_margins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  price_list_id INT NOT NULL,
  product_group_id INT NOT NULL,
  margin_percent DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_margin (price_list_id, product_group_id),
  FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (product_group_id) REFERENCES product_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE users ADD COLUMN IF NOT EXISTS price_list_id INT NULL,
  ADD CONSTRAINT fk_users_price_list FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE SET NULL;
```

**HOWEVER**: Since DATABASE_URL is still using placeholder credentials (confirmed in STATE.md), the executor will continue the established Phase 2 pattern of defining models manually in schema.prisma without running `prisma db pull`. Models have been accurately derived from the legacy PHP schema.

### Pattern 2: Pricing Formula (confirmed from kalkulator2025 source)

```typescript
// Source: kalkulator2025/api/price-lists.php lines 266-269
// Formula: salePrice = cost / (1 - marginPercent/100)

export function calculateSalePrice(
  purchasePrice: number,
  marginPercent: number
): number {
  if (marginPercent >= 100) throw new Error("Margin cannot be 100% or higher");
  const marginDecimal = marginPercent / 100;
  return purchasePrice / (1 - marginDecimal);
}

// Example: cost=10.00, margin=80% → salePrice = 10 / (1 - 0.80) = 50.00
// Example: cost=10.00, margin=50% → salePrice = 10 / (1 - 0.50) = 20.00
// The multiplier = 1 / (1 - margin) — so 80% margin = 5x multiplier
```

This is a GROSS MARGIN formula (not markup). `margin_percent` represents the percentage of the selling price that is profit. Different from markup where margin is calculated on cost.

### Pattern 3: Margin Matrix Editor (Zustand local state)

```typescript
// Client component pattern — margin-matrix-editor.tsx
"use client";

import { create } from "zustand";

// Local store for the edit buffer — NOT in global app store
// because this is page-scoped state only
type MatrixStore = {
  edits: Record<string, number>; // key: `${priceListId}-${groupId}`
  setMargin: (priceListId: number, groupId: number, value: number) => void;
  reset: () => void;
};

// Use React.useMemo + useRef pattern for page-scoped Zustand store
// to avoid global state pollution across navigation
```

The grid layout: `<table>` or CSS grid where rows = price lists, columns = product groups (following kalkulator2025 admin-price-lists.php approach). Each cell is an `<input type="number">` that updates the Zustand buffer on change. A single "Save all" button calls `batchUpsertMarginsAction` with the full edit buffer.

### Pattern 4: Clone Price List (Prisma transaction)

```typescript
// Source: established Prisma transaction pattern from Phase 2 products.ts
// Confirmed needed fields from migrate-create-price-system.php

export async function clonePriceList(sourceId: number, newCode: string, newName: string) {
  await requireAdmin();
  return prisma.$transaction(async (tx) => {
    const source = await tx.priceList.findUniqueOrThrow({
      where: { id: sourceId },
      include: { margins: true },
    });
    const cloned = await tx.priceList.create({
      data: {
        code: newCode,
        name: newName,
        description: source.description,
        displayOrder: source.displayOrder + 1,
      },
    });
    if (source.margins.length > 0) {
      await tx.priceListMargin.createMany({
        data: source.margins.map((m) => ({
          priceListId: cloned.id,
          productGroupId: m.productGroupId,
          marginPercent: m.marginPercent,
        })),
      });
    }
    return cloned;
  });
}
```

### Pattern 5: Batch Upsert Margins (MySQL INSERT ... ON DUPLICATE KEY UPDATE)

Prisma 6 supports `upsert` but not batch upsert with unique composite keys directly. Use `createMany` + individual `upsert` loop, or raw SQL for performance:

```typescript
// Option A: Loop upsert (safe, readable — recommended for <= 20 price lists)
export async function batchUpsertMargins(
  priceListId: number,
  entries: { productGroupId: number; marginPercent: number }[]
) {
  await requireAdmin();
  return prisma.$transaction(
    entries.map((entry) =>
      prisma.priceListMargin.upsert({
        where: {
          priceListId_productGroupId: {
            priceListId,
            productGroupId: entry.productGroupId,
          },
        },
        update: { marginPercent: entry.marginPercent },
        create: {
          priceListId,
          productGroupId: entry.productGroupId,
          marginPercent: entry.marginPercent,
        },
      })
    )
  );
}
// IMPORTANT: Prisma's @@unique([priceListId, productGroupId]) auto-generates
// the compound unique name as `priceListId_productGroupId` for use in upsert `where`
```

### Pattern 6: User Price List View (PRICE-04)

The "my price list" page needs: fetch current user's `priceListId` from session, load the full `PriceList` with margins + product group names, compute sale prices from product catalog prices.

```typescript
// DAL function
export async function getUserPriceList(userId: number) {
  await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      priceList: {
        include: {
          margins: {
            include: { productGroup: true },
            orderBy: { productGroup: { displayOrder: "asc" } },
          },
        },
      },
    },
  });
  return user?.priceList ?? null;
}
```

### Anti-Patterns to Avoid

- **Storing computed salePrice in DB:** Never store `sale_price` — always compute it on-the-fly from `purchase_price * (1 / (1 - margin/100))`. Storing it creates stale-data bugs when margins change.
- **Global Zustand store for matrix edits:** Use a page-scoped store (via `useRef` + `create`) not the global app store — prevents state leaking between navigation.
- **Running `prisma migrate`:** Confirmed from STATE.md blockers — shared MySQL DB, NEVER run `prisma migrate`. Manual schema definition + SQL creation script approach only.
- **Fetching all products for price preview in one query:** The user price list view should show margin percentages and product groups, not every product's computed price — that's Phase 4 (quotations) territory.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upsert on composite unique key | Custom SQL with INSERT ON DUPLICATE KEY | Prisma `upsert` with `@@unique` composite name | Prisma handles the unique constraint naming correctly |
| Decimal precision for margin_percent | JavaScript float arithmetic | Prisma `Decimal` type + `@db.Decimal(5,2)` | Avoids floating-point errors in financial calculations |
| Form state for matrix cells | useState array of objects | Zustand local store with Record key | Simpler to update single cells without array immutability overhead |
| Toast on Server Action result | Custom toast system | Sonner (already installed) | Established pattern in Phase 1-2 |
| Table display for price lists | Custom HTML table | TanStack Table `DataTable<T>` generic | Established pattern with sorting/pagination from Phase 2 |

**Key insight:** The margin matrix is at most ~20 price lists × ~20 product groups = 400 cells. No virtualization needed. A simple controlled table with Zustand state is sufficient.

---

## Common Pitfalls

### Pitfall 1: Prisma `@@unique` Compound Name in Upsert
**What goes wrong:** `prisma.priceListMargin.upsert({ where: { priceListId_productGroupId: ... } })` fails with "Unknown field" error.
**Why it happens:** Prisma generates the compound unique index name by concatenating field names with underscore. If the field mapping uses `@map`, the Prisma-side name (not DB column name) is used.
**How to avoid:** Use `@@unique([priceListId, productGroupId])` (Prisma field names, NOT snake_case) — Prisma generates `priceListId_productGroupId` as the where clause key.
**Warning signs:** TypeScript error on the `where` clause of `.upsert()`.

### Pitfall 2: Prisma `Decimal` vs JavaScript `number` for marginPercent
**What goes wrong:** `margin.marginPercent / 100` returns a Prisma `Decimal` object, not a JavaScript `number`, causing NaN in arithmetic.
**Why it happens:** Prisma 6 returns `Decimal` type for `@db.Decimal` columns — it's not auto-coerced to `number`.
**How to avoid:** Convert explicitly: `Number(margin.marginPercent)` or `margin.marginPercent.toNumber()` before arithmetic.
**Warning signs:** `NaN` in sale price calculations; TypeScript type error on `marginPercent * 2`.

### Pitfall 3: zodResolver Requires `z.input<Schema>` Not `z.infer<Schema>`
**What goes wrong:** TypeScript error on `useForm<T>` generic when Zod schema has `.default()` fields.
**Why it happens:** `z.infer` resolves `.default()` fields as non-optional, but form inputs are always initially `string | undefined`. `z.input` resolves the raw input type.
**How to avoid:** Always use `z.input<typeof mySchema>` as the `useForm<T>` generic — confirmed from Phase 02-02 decision log.
**Warning signs:** TS error: "Type 'string | undefined' is not assignable to type 'string'".

### Pitfall 4: User Price List Assignment — No `price_list_id` Column in Legacy DB
**What goes wrong:** Trying to `prisma db pull` reveals no `price_list_id` on the `users` table.
**Why it happens:** kalkulator2025 never stored `price_list_id` on users — quotations carried it directly. This is a new field for 2026.
**How to avoid:** Run the `ALTER TABLE users ADD COLUMN price_list_id INT NULL` SQL before attempting to use the relation. Or, since placeholder creds are still in use, define the Prisma model manually (established Phase 2 pattern) and run the SQL when real DB creds are available.
**Warning signs:** Prisma client throws "Unknown field priceListId on model User" at runtime.

### Pitfall 5: GlassCard Auto-Padding
**What goes wrong:** Content in matrix editor touches card edges.
**Why it happens:** `GlassCard` component does NOT auto-pad children (confirmed Phase 02-02 and 02-03 decisions).
**How to avoid:** Always wrap content inside `<div className="px-6 py-6">` inside `GlassCard`.
**Warning signs:** Visual content flush against card border.

### Pitfall 6: `prisma import` Convention
**What goes wrong:** Using `import { db } from "@/lib/db"` fails with "db is not exported".
**Why it happens:** The db.ts file exports the singleton as `prisma`, not `db`.
**How to avoid:** Always `import { prisma } from "@/lib/db"` — confirmed Phase 02-01 decision.

---

## Code Examples

### Pricing Formula (verified from kalkulator2025 source)

```typescript
// Source: kalkulator2025/api/price-lists.php lines 264-269
// This is the ONLY formula used across the entire kalkulator2025 system

export function calculateSalePrice(
  purchasePrice: Decimal | number,
  marginPercent: Decimal | number
): number {
  const cost = Number(purchasePrice);
  const margin = Number(marginPercent);
  if (margin >= 100) throw new Error("Marża nie może być >= 100%");
  if (cost <= 0) throw new Error("Cena zakupu musi być > 0");
  return Math.round((cost / (1 - margin / 100)) * 100) / 100; // round to 2dp
}

// Usage: calculateSalePrice(10.00, 80) → 50.00
// Usage: calculateSalePrice(10.00, 50) → 20.00
// Usage: calculateSalePrice(10.00, 65) → 28.57
```

### Server Action Pattern (following established Phase 2 convention)

```typescript
// Source: src/lib/actions/products.ts (established pattern)
"use server";

import { revalidatePath } from "next/cache";
import { createPriceListSchema } from "@/lib/validations/price-lists";
import { createPriceList } from "@/lib/dal/price-lists";
import type { ActionState } from "@/lib/actions/products"; // reuse existing type

export async function createPriceListAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    displayOrder: Number(formData.get("displayOrder") ?? 0),
  };
  const result = createPriceListSchema.safeParse(raw);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  try {
    await createPriceList(result.data);
    revalidatePath("/price-lists");
    return { success: "Cennik został utworzony" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Błąd podczas tworzenia cennika" };
  }
}
```

### Batch Margins Server Action

```typescript
// Batch upsert called from matrix editor "Save all changes" button
export async function batchUpsertMarginsAction(
  priceListId: number,
  margins: { productGroupId: number; marginPercent: number }[]
): Promise<ActionState> {
  if (!priceListId || margins.length === 0)
    return { error: "Nieprawidłowe dane" };
  try {
    await batchUpsertMargins(priceListId, margins);
    revalidatePath(`/price-lists/${priceListId}`);
    return { success: `Zapisano ${margins.length} marż` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Błąd zapisu marż" };
  }
}
```

### Zod Validation Schema

```typescript
// src/lib/validations/price-lists.ts
import { z } from "zod";

export const createPriceListSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_]+$/, "Kod: tylko wielkie litery, cyfry, podkreślnik"),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  displayOrder: z.number().int().default(0),
});

export const marginSchema = z.object({
  productGroupId: z.number().int().positive(),
  marginPercent: z.number().min(0).max(99.99),
});

export const batchMarginsSchema = z.object({
  priceListId: z.number().int().positive(),
  margins: z.array(marginSchema),
});

export type CreatePriceListInput = z.infer<typeof createPriceListSchema>;
export type CreatePriceListFormInput = z.input<typeof createPriceListSchema>;
```

---

## State of the Art

| Old Approach (kalkulator2025) | Current Approach (kalkulator2026) | Impact |
|-------------------------------|-----------------------------------|--------|
| PHP `$pdo->query()` SQL for margins | Prisma `upsert` with `$transaction` | Type-safe, no SQL injection risk |
| jQuery inline cell editing | React controlled `<input>` + Zustand local state | Predictable re-renders, no DOM mutations |
| PHP session for user's price list | JWT + Prisma `User.priceListId` relation | Stateless, works with Auth.js v5 |
| `margin_percent` as float in JS | Prisma `Decimal` type + `Number()` coercion | Avoids IEEE 754 errors in price calculation |

**Key observation:** kalkulator2025 quotations store `priceListId` directly on the quotation record, NOT on the user. Phase 3's PRICE-04 ("user can view their assigned price list") requires adding `price_list_id` to `users` — this is a NET NEW feature beyond what the legacy system had.

---

## Open Questions

1. **Does the production MySQL DB already have `price_lists` and `price_list_margins` tables?**
   - What we know: `migrate-create-price-system.php` exists in kalkulator2025 root and creates these tables if they don't exist. It was presumably run on production.
   - What's unclear: Whether the tables exist on `mail.allbag.pl` MySQL with actual data.
   - Recommendation: When DB creds are available, run `SHOW TABLES LIKE 'price_lists'` before creating. The SQL in Pattern 1 uses `CREATE TABLE IF NOT EXISTS` — safe either way. For the Prisma schema, define models manually regardless (Phase 2 precedent).

2. **Does `product_groups` in production already have data matching Phase 2's Phase 2 definition?**
   - What we know: Phase 2 defined `ProductGroup` in Prisma schema (id, name, displayOrder, backgroundColor, isActive). The legacy `product_groups` has additional columns `category_filter`, `product_filter`, `description` not in the Prisma model.
   - What's unclear: Whether Phase 3 needs `category_filter` / `description` fields on `ProductGroup`.
   - Recommendation: For Phase 3, the matrix editor only needs `id` and `name` from product groups — no need to extend the model now. Leave `category_filter` out of scope.

3. **How many product groups and price lists will there be in production?**
   - What we know: Legacy seed data shows 4 price lists (BASIC, SPECIAL, DISTRIBUTOR, DISTRIBUTOR_PLUS) and 1 product group initially. Real data may have more.
   - What's unclear: Maximum matrix size for UI considerations.
   - Recommendation: The matrix editor should handle up to 10×20 gracefully with a responsive scroll container; no virtualization needed.

---

## Sources

### Primary (HIGH confidence)
- `C:/xampp/htdocs/kalkulator2025/migrate-create-price-system.php` — Exact DB schema for price_lists, product_groups, price_list_margins
- `C:/xampp/htdocs/kalkulator2025/api/price-lists.php` — Canonical pricing formula: `salePrice = cost / (1 - margin/100)`, confirmed POST handler
- `C:/xampp/htdocs/kalkulator2025/api/admin/price-margins.php` — Full CRUD pattern for margins, upsert logic
- `C:/xampp/htdocs/kalkulator2026/prisma/schema.prisma` — Current Prisma models; `ProductGroup` confirmed present from Phase 2
- `C:/xampp/htdocs/kalkulator2026/package.json` — Exact library versions (Prisma 6.19.2, Zustand 5.0.12, Zod 4.3.6)
- `C:/xampp/htdocs/kalkulator2026/.planning/STATE.md` — Confirmed decisions: `prisma` import convention, `zodResolver` + `z.input<>` pattern, `GlassCard` padding requirement, placeholder DB creds, never-migrate policy

### Secondary (MEDIUM confidence)
- `C:/xampp/htdocs/kalkulator2025/api/quotations.php` — Confirmed users table has NO `price_list_id` column (quotations carry `priceListId` directly); user assignment is new in Phase 3
- `C:/xampp/htdocs/kalkulator2026/src/lib/dal/products.ts` — Established DAL pattern: `import "server-only"`, `requireAuth`/`requireAdmin` guards, `prisma.$transaction`
- `C:/xampp/htdocs/kalkulator2026/src/lib/actions/products.ts` — Established Server Action pattern: `ActionState` type, Zod v4 `.issues[0]`, `revalidatePath`

### Tertiary (LOW confidence / Not needed)
- None — all research domains resolved from first-party sources.

---

## Metadata

**Confidence breakdown:**
- DB Schema: HIGH — exact schema from migrate-create-price-system.php; ProductGroup already in Prisma from Phase 2
- Pricing formula: HIGH — confirmed directly from kalkulator2025/api/price-lists.php PHP source
- Architecture patterns: HIGH — all patterns follow established Phase 1/2 conventions confirmed in STATE.md decisions
- User-to-price-list assignment: HIGH (new feature confirmed) — verified quotations.php shows users table has no price_list_id
- Matrix editor UI: MEDIUM — Zustand local state pattern is sound; exact grid CSS layout is implementation detail left to planner

**Research date:** 2026-03-23
**Valid until:** 2026-04-22 (30 days — stable domain)
