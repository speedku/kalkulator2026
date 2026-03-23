# Phase 4: Quotations & Invoicing — Research

**Researched:** 2026-03-23
**Domain:** PDF generation, document numbering, email attachments, quotation builder UX, invoice data model
**Confidence:** HIGH (core stack), MEDIUM (PDF library decision due to known Next.js 15 issues)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUOT-01 | Użytkownik może tworzyć wyceny z produktami i cenami z cennika | QuotationBuilder 3-step UX from kalkulator2025; `calculateSalePrice` + `getUserPriceList` DAL ready from Phase 3 |
| QUOT-02 | Wyceny mają unikalną numerację WYC-YYYY-##### | MySQL AUTO_INCREMENT + Prisma `$transaction` atomic pattern; safe sequence derivation documented |
| QUOT-03 | Użytkownik może eksportować wycenę do PDF | `@react-pdf/renderer@4.3.2` via Route Handler with `serverExternalPackages` config; `renderToBuffer` → NextResponse pattern confirmed |
| QUOT-04 | Użytkownik może wysłać wycenę emailem do klienta | Nodemailer (already in `src/lib/email.ts`) + `content: Buffer` attachment; `sendQuotationEmail` Server Action |
| QUOT-05 | Użytkownik może przeglądać historię wycen z filtrowaniem | TanStack Table + URL state pattern established in Phase 2; DAL `getQuotations` with `where` filters |
| QUOT-06 | Użytkownik może duplikować istniejącą wycenę | `duplicateQuotation` DAL: copy header + items in `$transaction`; generate new WYC number; redirect |
| FACT-01 | Admin może tworzyć faktury VAT | New `Invoice` Prisma model; separate from quotations; FAK-YYYY-##### numbering; RBAC admin-only |
| FACT-05 | Admin może eksportować faktury do PDF | Same Route Handler pattern as quotations; different PDF template |
| FACT-06 | Admin może przeglądać historię faktur z filtrowaniem | Same TanStack Table + URL state pattern; DAL `getInvoices` |
| FACT-07 | System obsługuje etykiety (label printing) dla zamówień | HTML-to-print labels (A4 sheet of A6 labels); `window.print()` client-side; no library needed |
</phase_requirements>

---

## Summary

Phase 4 introduces two closely related but distinct features: quotation management (QUOT-01..06, user-facing) and basic invoicing (FACT-01/05/06/07, admin-facing). The technical core is PDF generation, atomic document numbering, and email dispatch with PDF attachment.

The most critical discovery is PDF generation library compatibility. `@react-pdf/renderer@4.3.2` works with Next.js 15 + React 19 when configured with `serverExternalPackages: ['@react-pdf/renderer']` in `next.config.ts`. The Route Handler pattern (`renderToBuffer` → `new NextResponse(buffer, headers)`) is confirmed working. Do NOT use v4.3.0 — it has a text rendering regression (Issue #3131). The `__SECRET_INTERNALS` issue reported for Next.js 15 has been resolved since v4.1.0.

The kalkulator2025 quotations table is already in the production MySQL database (`allbag_kalkulator`). The schema uses camelCase column names (Prisma convention matches). The numbering pattern `WYC-YYYY-#####` was previously generated using `COUNT(*) + 1` — that is NOT race-condition safe. In kalkulator2026, use MySQL AUTO_INCREMENT as the sequence source, formatted at the application layer, inside a `$transaction` — this is atomic and collision-proof. Invoices (`FAK-YYYY-#####`) are new to kalkulator2026; no existing table in production, so a new `invoices` table needs to be defined in Prisma schema and created via `04-DB-MIGRATION.sql`.

For shipping labels (FACT-07), kalkulator2025 stores HTML labels to the filesystem and returns a URL. In kalkulator2026, generate an HTML/CSS print page with `@media print` styles and use the browser's native `window.print()`. This requires no library and produces correct A6-on-A4 output. This is the right approach for an internal B2B tool where users print from their own browsers.

**Primary recommendation:** Use `@react-pdf/renderer@4.3.2` via Route Handler for PDFs, Nodemailer `content: Buffer` for email attachment, MySQL AUTO_INCREMENT as sequence source for WYC/FAK numbering, and `window.print()` for shipping labels.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@react-pdf/renderer` | 4.3.2 | Server-side PDF generation in Route Handler | Only React-based PDF library; React 19 + Next.js 15 compatible since v4.1.0; v4.3.2 fixes text rendering bug from v4.3.0 |
| `nodemailer` | 7.0.13 (already installed) | Email dispatch with PDF attachment | Already in `src/lib/email.ts`; supports `content: Buffer` attachment natively |
| Prisma 6 | 6.19.2 (already installed) | Quotation/Invoice data layer | Established project ORM; `$transaction` for atomic operations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-hook-form` | 7.72.0 (already installed) | Quotation builder form state | Multi-step form with cart items |
| `zustand` 5 | 5.0.12 (already installed) | Cart item state in QuotationBuilder | Same page-scoped pattern as MarginMatrixEditor (Phase 3) |
| `zod` 4 | 4.3.6 (already installed) | Input validation for quotation/invoice creation | Same pattern as all other forms |
| `sonner` | 2.0.7 (already installed) | Toast notifications for PDF download, email send | Same toast pattern established in Phase 2 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@react-pdf/renderer` | `puppeteer` (headless Chrome) | Puppeteer produces pixel-perfect HTML→PDF but needs Chromium binary — too heavy for XAMPP/PM2 environment; @react-pdf/renderer is pure Node.js |
| `@react-pdf/renderer` | `pdfmake` | pdfmake is plain JS (no React), requires custom document DSL — more complex to maintain than React component |
| `@react-pdf/renderer` | `html-pdf` / `wkhtmltopdf` | Requires native binary, not available in production environment |
| `window.print()` for labels | Generating PDF labels | Labels are simple A4 sheets; browser print is sufficient for internal B2B use; no library cost |

**Installation:**
```bash
npm install @react-pdf/renderer@4.3.2
npm install --save-dev @types/react-pdf
```

Note: `@types/react-pdf` may not exist separately — `@react-pdf/renderer` ships its own TypeScript declarations since v3.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(dashboard)/
│   ├── quotations/
│   │   ├── page.tsx                    # List page (requireAuth)
│   │   ├── new/page.tsx                # QuotationBuilder shell
│   │   ├── [id]/
│   │   │   ├── page.tsx                # Detail + actions
│   │   │   └── _components/
│   │   │       ├── quotation-detail.tsx
│   │   │       ├── quotation-actions-bar.tsx  # Download PDF, Send Email, Duplicate, Delete
│   │   │       └── send-email-dialog.tsx
│   │   └── _components/
│   │       ├── quotations-table.tsx
│   │       └── quotation-builder/
│   │           ├── index.tsx           # 3-step wizard shell
│   │           ├── step-customer.tsx   # Customer name + email + price list
│   │           ├── step-products.tsx   # Product search + cart
│   │           └── step-summary.tsx    # Review + save
│   └── invoices/
│       ├── page.tsx                    # List page (requireAdmin)
│       ├── new/page.tsx                # Invoice create form
│       ├── [id]/
│       │   ├── page.tsx
│       │   └── _components/
│       │       ├── invoice-detail.tsx
│       │       └── invoice-actions-bar.tsx
│       └── _components/
│           ├── invoices-table.tsx
│           └── invoice-form.tsx
├── app/api/
│   ├── quotations/[id]/pdf/route.ts    # GET → renderToBuffer → PDF download
│   └── invoices/[id]/pdf/route.ts      # GET → renderToBuffer → PDF download
├── lib/
│   ├── dal/
│   │   ├── quotations.ts               # getQuotations, createQuotation, duplicateQuotation
│   │   └── invoices.ts                 # getInvoices, createInvoice
│   ├── actions/
│   │   ├── quotations.ts               # createQuotationAction, sendEmailAction, deleteQuotationAction
│   │   └── invoices.ts                 # createInvoiceAction, deleteInvoiceAction
│   ├── pdf/
│   │   ├── quotation-template.tsx      # @react-pdf/renderer Document component
│   │   └── invoice-template.tsx        # @react-pdf/renderer Document component
│   └── email.ts                        # Already exists; add sendQuotationEmail function
└── types/
    ├── quotations.ts
    └── invoices.ts
```

### Pattern 1: Atomic WYC/FAK Number Generation

**What:** Use MySQL AUTO_INCREMENT `id` as the sequence base, format the number at application layer inside `$transaction`. Never COUNT(*).

**When to use:** Any document number that must be unique, sequential, and collision-safe.

**Why COUNT(*) is wrong (kalkulator2025 bug):** Two concurrent inserts both read `COUNT=5`, both compute `WYC-2026-00006`, one gets unique constraint error. The correct approach: INSERT first (AUTO_INCREMENT assigns id atomically), then compute number from `id`.

**Example:**
```typescript
// Source: Prisma $transaction docs + MySQL AUTO_INCREMENT semantics
// src/lib/dal/quotations.ts

export async function createQuotation(data: CreateQuotationInput): Promise<{ id: number; quotationNumber: string }> {
  await requireAuth();
  return prisma.$transaction(async (tx) => {
    // Step 1: Insert with placeholder number (satisfies NOT NULL, will be overwritten)
    const quotation = await tx.quotation.create({
      data: {
        quotationNumber: 'PENDING', // temporary, overwritten in step 2
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        priceListId: data.priceListId,
        totalAmount: data.totalAmount,
        status: 'draft',
        notes: data.notes,
        createdBy: data.userId,
      },
      select: { id: true },
    });
    // Step 2: Compute WYC number from AUTO_INCREMENT id (atomic, collision-free)
    const year = new Date().getFullYear();
    const quotationNumber = `WYC-${year}-${String(quotation.id).padStart(5, '0')}`;
    // Step 3: Update to real number
    await tx.quotation.update({
      where: { id: quotation.id },
      data: { quotationNumber },
    });
    // Step 4: Insert items
    await tx.quotationItem.createMany({
      data: data.items.map((item) => ({
        quotationId: quotation.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    });
    return { id: quotation.id, quotationNumber };
  });
}
```

### Pattern 2: PDF Route Handler

**What:** Next.js Route Handler calls `renderToBuffer` from `@react-pdf/renderer`, returns PDF as `NextResponse`.

**When to use:** Any server-generated PDF download — quotations and invoices.

**Critical config:** Add `@react-pdf/renderer` to `serverExternalPackages` in `next.config.ts` (NOT inside `experimental` for Next.js 15).

**Example:**
```typescript
// Source: @react-pdf/renderer GitHub Issue #3074 + Next.js 15 docs
// src/app/api/quotations/[id]/pdf/route.ts

import { renderToBuffer } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';
import { getQuotationById } from '@/lib/dal/quotations';
import { QuotationPdfTemplate } from '@/lib/pdf/quotation-template';
import { requireAuth } from '@/lib/dal/auth';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();
  const { id } = await params;
  const quotation = await getQuotationById(Number(id));
  if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const buffer = await renderToBuffer(<QuotationPdfTemplate quotation={quotation} />);
  const headers = new Headers();
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', `attachment; filename="Wycena_${quotation.quotationNumber}.pdf"`);
  return new NextResponse(buffer, { headers });
}
```

**next.config.ts addition required:**
```typescript
const nextConfig: NextConfig = {
  // ... existing config ...
  serverExternalPackages: ['bcryptjs', 'mssql', '@react-pdf/renderer'], // ADD @react-pdf/renderer
};
```

### Pattern 3: Email with PDF Attachment

**What:** Server Action generates PDF buffer in-memory, sends via existing Nodemailer transport with `attachments` array.

**When to use:** "Send to email" action on quotation detail page.

**Example:**
```typescript
// Source: Nodemailer official docs (nodemailer.com/message/attachments)
// src/lib/actions/quotations.ts

export async function sendQuotationEmailAction(
  quotationId: number,
  recipientEmail: string
): Promise<ActionState> {
  await requireAuth();
  try {
    const quotation = await getQuotationById(quotationId);
    if (!quotation) return { error: 'Wycena nie istnieje' };

    const pdfBuffer = await renderToBuffer(<QuotationPdfTemplate quotation={quotation} />);

    await sendQuotationEmail({
      to: recipientEmail,
      quotationNumber: quotation.quotationNumber,
      customerName: quotation.customerName,
      pdfBuffer,
      pdfFilename: `Wycena_${quotation.quotationNumber}.pdf`,
    });

    // Update status to 'sent' after successful email
    await updateQuotationStatus(quotationId, 'sent');
    revalidatePath(`/quotations/${quotationId}`);
    return { success: 'Wycena wysłana emailem' };
  } catch {
    return { error: 'Błąd wysyłania emaila' };
  }
}
```

**email.ts addition:**
```typescript
export async function sendQuotationEmail(opts: {
  to: string;
  quotationNumber: string;
  customerName: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}): Promise<void> {
  const transport = createTransport();
  await transport.sendMail({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: `Wycena ${opts.quotationNumber} — ALLBAG`,
    html: emailTemplate('Wycena ALLBAG', `<p>Szanowny/a ${opts.customerName},<br>w załączeniu przesyłamy wycenę ${opts.quotationNumber}.</p>`),
    attachments: [{
      filename: opts.pdfFilename,
      content: opts.pdfBuffer,       // Buffer directly — Nodemailer v7 handles this natively
      contentType: 'application/pdf',
    }],
  });
}
```

### Pattern 4: Quotation Builder (Multi-Step Wizard)

**What:** 3-step client-side wizard: (1) customer details + price list, (2) product search + cart, (3) summary + save.

**When to use:** QUOT-01 — building new quotations.

**Key design decisions from kalkulator2025 study:**
- Step 1: `customerName` (string), `customerEmail` (string), `priceListId` (select from user's assigned price list, or any if admin). The user's assigned price list should be pre-selected.
- Step 2: Product search (server action or client fetch), display `calculateSalePrice(product.price, margin)` for each product row. Cart items stored in page-scoped Zustand store (same pattern as Phase 3 MarginMatrixEditor).
- Step 3: Review line items, edit quantities, see totals, notes field, submit.
- All prices computed client-side from `calculateSalePrice`. The server re-computes and stores `unitPrice` on create (never trust client prices for storage).

**Cart item interface:**
```typescript
interface CartItem {
  productId: number;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;      // calculateSalePrice result
  totalPrice: number;     // quantity × unitPrice
}
```

### Pattern 5: Shipping Labels (FACT-07)

**What:** Print-ready HTML page with A6-sized label boxes on an A4 sheet, printed via `window.print()`.

**When to use:** FACT-07 — label printing for orders.

**No library needed.** Generate label HTML in a Server Component or Server Action. Open in new tab or iframe with print CSS:

```typescript
// Pattern: Generate label HTML as a string, open window.open() and call print()
// Client component with server data
const printLabels = () => {
  const w = window.open('', '_blank');
  w?.document.write(generateLabelHtml(orderItems));
  w?.document.close();
  w?.print();
};
```

Label page CSS:
```css
@page { size: A4; margin: 0; }
@media print { .no-print { display: none; } }
.label { width: 105mm; height: 148mm; /* A6 */ border: 1px solid #000; page-break-inside: avoid; }
```

### Anti-Patterns to Avoid

- **COUNT(*) for sequence numbers:** Race condition under concurrent load. Always use AUTO_INCREMENT id as sequence source.
- **Generating PDF on client with PDFDownloadLink:** Works for small documents but leaks business logic to browser; prices should be server-validated before PDF.
- **Storing PDF files to disk:** Don't save PDFs to filesystem. Generate on-demand in Route Handler. Quotation data is in DB; PDF is a render artifact.
- **Context in PDF components:** `@react-pdf/renderer` does not support React Context on the server. All data must be passed as props to the Document component.
- **Importing PDF template component at route level without serverExternalPackages:** Will cause `PDFDocument is not a constructor` error. `@react-pdf/renderer` MUST be in `serverExternalPackages` array.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom HTML-to-PDF converter | `@react-pdf/renderer` | Font handling, multi-page, proper PDF spec compliance |
| PDF text alignment / tables | Manual position calculations | `@react-pdf/renderer` layout engine | Handles flex layout; automatic page breaks |
| Email MIME encoding | Raw SMTP socket code | Nodemailer (already installed) | RFC 2822 MIME multipart, encoding edge cases |
| Document number uniqueness | Application-level lock or SELECT MAX | MySQL AUTO_INCREMENT | Database guarantees uniqueness atomically |
| Label page layout | Custom canvas/SVG | CSS `@page` + `window.print()` | Zero dependencies; browser renders labels correctly |

**Key insight:** PDF generation appears simple but has many edge cases (encoding, page overflow, font loading, Unicode). `@react-pdf/renderer` handles all of them; any hand-rolled solution will fail on Polish characters, multi-page documents, or mixed number formats.

---

## Common Pitfalls

### Pitfall 1: @react-pdf/renderer Version v4.3.0 Text Rendering Bug
**What goes wrong:** No text renders in generated PDFs — blank pages with layout only.
**Why it happens:** Regression introduced in v4.3.0 (Issue #3131, filed March 21, 2025). Images and styled boxes render; Text elements do not.
**How to avoid:** Pin to `@react-pdf/renderer@4.3.2` or later. Do NOT use v4.3.0.
**Warning signs:** PDF generates without error but all text is invisible.

### Pitfall 2: Missing `serverExternalPackages` Config
**What goes wrong:** `TypeError: PDFDocument is not a constructor` or `ba.Component is not a constructor` when calling `renderToBuffer` in a Route Handler.
**Why it happens:** Next.js 15 bundles server-side code by default; `@react-pdf/renderer` must be excluded from bundling.
**How to avoid:** Add `'@react-pdf/renderer'` to `serverExternalPackages` in `next.config.ts` (NOT inside `experimental`).
**Warning signs:** Error appears at runtime in Route Handler, not at build time.

### Pitfall 3: React Context in PDF Components
**What goes wrong:** PDF renders blank or throws "Cannot read properties of undefined" when PDF component uses any React Context hook.
**Why it happens:** `renderToBuffer` runs outside the React rendering tree; no Context provider exists.
**How to avoid:** Pass ALL data as props to the PDF Document component. No `useSession()`, no `useStore()`, no `useContext()` inside PDF templates.
**Warning signs:** Works in browser preview but fails in Route Handler.

### Pitfall 4: WYC Number Race Condition (COUNT(*) approach)
**What goes wrong:** Two users create quotations simultaneously; both get `WYC-2026-00047`; one creation fails with unique constraint.
**Why it happens:** kalkulator2025 used `SELECT COUNT(*) + 1` — not atomic. Another row can INSERT between the SELECT and INSERT.
**How to avoid:** INSERT first (AUTO_INCREMENT assigns id), then compute number from id, then UPDATE. Done atomically inside `$transaction`.
**Warning signs:** Unique constraint violations on `quotationNumber` under load.

### Pitfall 5: Prisma Decimal in Price Calculations
**What goes wrong:** `TypeError: Cannot read properties of undefined` or NaN prices in line items.
**Why it happens:** `product.price` is `Decimal | null` in Prisma schema. Direct arithmetic on Prisma Decimal throws.
**How to avoid:** Use `calculateSalePrice` from Phase 3 — it already handles `number | { toNumber(): number }` union. Always coerce: `Number(product.price)` before passing to arithmetic. Check for null price.
**Warning signs:** Prices display as `NaN` or `undefined`.

### Pitfall 6: Params Async in Next.js 15
**What goes wrong:** `params.id` is undefined — TypeScript error or runtime error in PDF Route Handler.
**Why it happens:** Next.js 15 changed route params to be async: `{ params: Promise<{ id: string }> }`.
**How to avoid:** Always destructure params with `await`: `const { id } = await params;`.
**Warning signs:** Established pattern from Phase 2/3 — all existing Route Handlers use this.

### Pitfall 7: Sending Email Before PDF Generation Completes
**What goes wrong:** Empty or corrupted PDF attachment.
**Why it happens:** `renderToBuffer` is async; if not awaited before `sendMail`, buffer is empty.
**How to avoid:** Always `await renderToBuffer(...)` before passing buffer to `sendMail`.
**Warning signs:** Recipient receives email but PDF attachment is 0 bytes or invalid.

---

## Code Examples

### @react-pdf/renderer Document Template
```typescript
// Source: @react-pdf/renderer official docs (react-pdf.org)
// src/lib/pdf/quotation-template.tsx
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// IMPORTANT: Don't use React Context, hooks, or component state — props only
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { marginBottom: 20, borderBottom: '2px solid #6366f1', paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#6366f1' },
  table: { display: 'flex', flexDirection: 'column', marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #e5e7eb', padding: '6 0' },
  tableHeader: { backgroundColor: '#6366f1', color: 'white' },
  col: { flex: 1, padding: '0 4' },
  total: { fontSize: 12, fontWeight: 'bold', marginTop: 10, textAlign: 'right' },
});

interface QuotationPdfProps {
  quotation: QuotationWithItems;  // passed as plain data — no Context
}

export function QuotationPdfTemplate({ quotation }: QuotationPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>ALLBAG — Wycena</Text>
          <Text>{quotation.quotationNumber} | {new Date(quotation.createdAt).toLocaleDateString('pl-PL')}</Text>
        </View>
        <View>
          <Text>Klient: {quotation.customerName}</Text>
          <Text>Email: {quotation.customerEmail}</Text>
        </View>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.col}>SKU</Text>
            <Text style={styles.col}>Nazwa</Text>
            <Text style={styles.col}>Ilość</Text>
            <Text style={styles.col}>Cena jedn.</Text>
            <Text style={styles.col}>Wartość</Text>
          </View>
          {quotation.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col}>{item.product.sku}</Text>
              <Text style={styles.col}>{item.product.name}</Text>
              <Text style={styles.col}>{item.quantity}</Text>
              <Text style={styles.col}>{Number(item.unitPrice).toFixed(2)} zł</Text>
              <Text style={styles.col}>{Number(item.totalPrice).toFixed(2)} zł</Text>
            </View>
          ))}
        </View>
        <Text style={styles.total}>RAZEM: {Number(quotation.totalAmount).toFixed(2)} zł</Text>
        {quotation.notes && <Text style={{ marginTop: 20, color: '#666' }}>Uwagi: {quotation.notes}</Text>}
      </Page>
    </Document>
  );
}
```

### Quotation Duplication (QUOT-06)
```typescript
// Source: Prisma $transaction docs
// src/lib/dal/quotations.ts

export async function duplicateQuotation(sourceId: number): Promise<{ id: number; quotationNumber: string }> {
  await requireAuth();
  const source = await prisma.quotation.findUniqueOrThrow({
    where: { id: sourceId },
    include: { items: true },
  });
  return prisma.$transaction(async (tx) => {
    const dup = await tx.quotation.create({
      data: {
        quotationNumber: 'PENDING',
        customerName: source.customerName,
        customerEmail: source.customerEmail,
        priceListId: source.priceListId,
        totalAmount: source.totalAmount,
        status: 'draft',  // always draft on duplicate
        notes: source.notes,
        createdBy: source.createdBy,
      },
      select: { id: true },
    });
    const year = new Date().getFullYear();
    const quotationNumber = `WYC-${year}-${String(dup.id).padStart(5, '0')}`;
    await tx.quotation.update({ where: { id: dup.id }, data: { quotationNumber } });
    if (source.items.length > 0) {
      await tx.quotationItem.createMany({
        data: source.items.map((item) => ({
          quotationId: dup.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      });
    }
    return { id: dup.id, quotationNumber };
  });
}
```

---

## Database Schema

### Confirmed existing tables in `allbag_kalkulator` (from kalkulator2025 backup)

**`quotations` table** (already exists in production — must NOT alter, use `db pull` pattern):
```sql
CREATE TABLE `quotations` (
  `id`              int(11)       NOT NULL AUTO_INCREMENT,
  `quotationNumber` varchar(191)  NOT NULL UNIQUE,
  `customerName`    varchar(191)  NOT NULL,
  `customerEmail`   varchar(191)  NOT NULL,
  `priceListId`     int(11)       NOT NULL,
  `totalAmount`     decimal(10,2) NOT NULL,
  `status`          varchar(191)  NOT NULL DEFAULT 'draft',
  `notes`           text          DEFAULT NULL,
  `createdAt`       datetime(3)   NOT NULL DEFAULT current_timestamp(3),
  `updatedAt`       datetime(3)   NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**`quotation_items` table** (already exists in production):
```sql
CREATE TABLE `quotation_items` (
  `id`          int(11)       NOT NULL AUTO_INCREMENT,
  `quotationId` int(11)       NOT NULL,
  `productId`   int(11)       NOT NULL,
  `quantity`    int(11)       NOT NULL,
  `unitPrice`   decimal(10,2) NOT NULL,
  `totalPrice`  decimal(10,2) NOT NULL,
  `createdAt`   datetime(3)   NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### New tables for kalkulator2026 (added via 04-DB-MIGRATION.sql)

**`quotations` table enhancement** (add `createdBy` column — nullable to not break kalkulator2025):
```sql
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS created_by INT NULL,
  ADD CONSTRAINT fk_quotations_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
```

**`invoices` table** (new in kalkulator2026 — FACT-01):
```sql
CREATE TABLE IF NOT EXISTS invoices (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number  VARCHAR(191) NOT NULL UNIQUE,
  customer_name   VARCHAR(191) NOT NULL,
  customer_email  VARCHAR(191) NOT NULL,
  customer_nip    VARCHAR(20)  NULL,
  customer_address TEXT        NULL,
  total_netto     DECIMAL(10,2) NOT NULL,
  vat_rate        DECIMAL(5,2)  NOT NULL DEFAULT 23.00,
  total_vat       DECIMAL(10,2) NOT NULL,
  total_brutto    DECIMAL(10,2) NOT NULL,
  status          VARCHAR(50)   NOT NULL DEFAULT 'draft',
  notes           TEXT          NULL,
  issue_date      DATE          NOT NULL,
  due_date        DATE          NULL,
  created_by      INT           NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoice_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id  INT           NOT NULL,
  product_id  INT           NULL,
  description VARCHAR(255)  NOT NULL,
  quantity    INT           NOT NULL,
  unit        VARCHAR(20)   NOT NULL DEFAULT 'szt',
  unit_price  DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Prisma Models to Add (Phase 4 Prisma schema additions)

```prisma
// Phase 4: Quotations & Invoicing models

model Quotation {
  id              Int      @id @default(autoincrement())
  quotationNumber String   @unique @map("quotationNumber") @db.VarChar(191)
  customerName    String   @map("customerName") @db.VarChar(191)
  customerEmail   String   @map("customerEmail") @db.VarChar(191)
  priceListId     Int      @map("priceListId")
  totalAmount     Decimal  @map("totalAmount") @db.Decimal(10, 2)
  status          String   @default("draft")
  notes           String?  @db.Text
  createdBy       Int?     @map("created_by")
  createdAt       DateTime @default(now()) @map("createdAt")
  updatedAt       DateTime @updatedAt @map("updatedAt")

  priceList PriceList       @relation(fields: [priceListId], references: [id])
  items     QuotationItem[]
  creator   User?           @relation(fields: [createdBy], references: [id])

  @@map("quotations")
}

model QuotationItem {
  id          Int      @id @default(autoincrement())
  quotationId Int      @map("quotationId")
  productId   Int      @map("productId")
  quantity    Int
  unitPrice   Decimal  @map("unitPrice") @db.Decimal(10, 2)
  totalPrice  Decimal  @map("totalPrice") @db.Decimal(10, 2)
  createdAt   DateTime @default(now()) @map("createdAt")

  quotation Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  product   Product   @relation(fields: [productId], references: [id])

  @@map("quotation_items")
}

model Invoice {
  id             Int      @id @default(autoincrement())
  invoiceNumber  String   @unique @map("invoice_number") @db.VarChar(191)
  customerName   String   @map("customer_name") @db.VarChar(191)
  customerEmail  String   @map("customer_email") @db.VarChar(191)
  customerNip    String?  @map("customer_nip") @db.VarChar(20)
  customerAddress String? @map("customer_address") @db.Text
  totalNetto     Decimal  @map("total_netto") @db.Decimal(10, 2)
  vatRate        Decimal  @map("vat_rate") @db.Decimal(5, 2)
  totalVat       Decimal  @map("total_vat") @db.Decimal(10, 2)
  totalBrutto    Decimal  @map("total_brutto") @db.Decimal(10, 2)
  status         String   @default("draft")
  notes          String?  @db.Text
  issueDate      DateTime @map("issue_date") @db.Date
  dueDate        DateTime? @map("due_date") @db.Date
  createdBy      Int?     @map("created_by")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  items   InvoiceItem[]
  creator User?         @relation("invoice_creator", fields: [createdBy], references: [id])

  @@map("invoices")
}

model InvoiceItem {
  id          Int      @id @default(autoincrement())
  invoiceId   Int      @map("invoice_id")
  productId   Int?     @map("product_id")
  description String   @db.VarChar(255)
  quantity    Int
  unit        String   @default("szt") @db.VarChar(20)
  unitPrice   Decimal  @map("unit_price") @db.Decimal(10, 2)
  totalPrice  Decimal  @map("total_price") @db.Decimal(10, 2)
  createdAt   DateTime @default(now()) @map("created_at")

  invoice Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id], onDelete: SetNull)

  @@map("invoice_items")
}
```

**Note on Prisma model mapping:** The `quotations` table uses camelCase column names in MySQL (e.g., `quotationNumber`, `priceListId`) because it was originally created by Prisma Migrate in kalkulator2025. The mapping must preserve this.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| kalkulator2025: `COUNT(*) + 1` for WYC number | AUTO_INCREMENT id as sequence source | Phase 4 (kalkulator2026) | Eliminates race condition entirely |
| kalkulator2025: HTML string → return to client for browser print | `@react-pdf/renderer` Route Handler → binary PDF | Phase 4 (kalkulator2026) | True PDF with ALLBAG branding, downloadable file |
| kalkulator2025: No email integration (separate form) | Server Action → Nodemailer → send with PDF attachment | Phase 4 (kalkulator2026) | Single-click send from quotation detail page |
| Next.js 14: `experimental.serverComponentsExternalPackages` | Next.js 15: `serverExternalPackages` (top-level) | Next.js 15 | Config path changed; old path silently ignored |
| `@react-pdf/renderer` v4.3.0 | v4.3.2 | March 2025 | Text rendering regression fixed |

**Deprecated/outdated:**
- `experimental.serverComponentsExternalPackages`: Still accepted by Next.js 15 for compatibility but should use `serverExternalPackages` at top level — both arrays are merged internally in Next.js 15.5.x.
- kalkulator2025 quotation builder used `discount_percent` per item and global discount — kalkulator2026 schema does NOT include this. Simpler model: `unitPrice` is the already-discounted price from price list margin.

---

## Open Questions

1. **Does `quotations` table already exist on the production allbag_kalkulator database?**
   - What we know: It exists in the 2026-01-19 backup (confirmed schema above). kalkulator2025 cenniki app uses it.
   - What's unclear: Whether any rows exist that would conflict with kalkulator2026 `createdBy` column addition.
   - Recommendation: The `ALTER TABLE ... ADD COLUMN IF NOT EXISTS created_by INT NULL` is safe (nullable, no default required for existing rows).

2. **Should quotation builder use product `price` field or variant prices?**
   - What we know: `Product.price` is the wholesale purchase price. `calculateSalePrice(product.price, margin)` gives the sale price for the user's price list.
   - What's unclear: kalkulator2025 QuotationBuilder used `ProductVariant` + `ProductPrice` (with color_type: standard/color/pastel). The Phase 2 `products` table has `price` but Phase 2 `ProductVariant.prices` has the per-color pricing.
   - Recommendation: For Phase 4, use `Product.price` (the master purchase price) as the base for `calculateSalePrice`. Variant-level pricing can be added later. This matches the simpler kalkulator2025 `api/quotations.php` approach which also used product-level `costPrice`.

3. **Labels format for FACT-07 — what information do labels show?**
   - What we know: kalkulator2025 `save-labels.php` accepted an HTML string with two label types: `jednostkowe` (individual) and `kartony` (carton). Labels were printed from a separate `/etykiety/` page.
   - What's unclear: Whether labels are tied to quotations, invoices, or standalone order data.
   - Recommendation: Implement as a simple standalone "Labels" page accessible to admins. Accept a list of products + quantities + customer name. Generate A4 print sheet with A6 label grid. Future phases can link from orders/invoices.

---

## Sources

### Primary (HIGH confidence)
- kalkulator2025 database backup `backups/2026-01-19_03-00-01/database.sql` — confirmed `quotations` and `quotation_items` table schemas
- `C:/xampp/htdocs/kalkulator2025/api/quotations.php` — quotation creation business logic, WYC numbering pattern (COUNT approach — replaced)
- `C:/xampp/htdocs/kalkulator2026/src/lib/email.ts` — existing Nodemailer transport configuration
- `C:/xampp/htdocs/kalkulator2026/src/lib/dal/price-lists.ts` — `calculateSalePrice` function signature confirmed
- `C:/xampp/htdocs/kalkulator2026/next.config.ts` — `serverExternalPackages` array location (already used for `bcryptjs`, `mssql`)
- `C:/xampp/htdocs/kalkulator2026/package.json` — confirmed nodemailer@7.0.13, zustand@5, react-hook-form@7 already installed
- [Nodemailer attachments docs](https://nodemailer.com/message/attachments) — `content: Buffer` attachment format

### Secondary (MEDIUM confidence)
- [@react-pdf/renderer Issue #3074](https://github.com/diegomura/react-pdf/issues/3074) — renderToBuffer not working with Next.js 15 → fixed with `serverExternalPackages`
- [@react-pdf/renderer Issue #3131](https://github.com/diegomura/react-pdf/issues/3131) — text rendering regression in v4.3.0; fixed in v4.3.2
- [@react-pdf/renderer compatibility](https://react-pdf.org/compatibility) — React 19 supported since v4.1.0
- [Prisma transactions docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) — `$transaction` ACID semantics

### Tertiary (LOW confidence)
- WebSearch finding: `@react-pdf/renderer` on Railway/Vercel may need additional config — not verified for local XAMPP/PM2 environment; LOCAL deployment is assumed stable.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against actual installed packages, existing email.ts, confirmed DB schema
- Architecture patterns: HIGH — directly derived from established Phase 2/3 patterns (Server Actions, DAL, Route Handlers, page-scoped Zustand)
- PDF library: MEDIUM — Next.js 15 compatibility confirmed but has known issues; v4.3.2 pinned to avoid v4.3.0 regression
- Database schema: HIGH — quotations table confirmed from production backup; invoices schema is new (reasonable design)
- Pitfalls: HIGH — all verified via GitHub Issues or direct code inspection

**Research date:** 2026-03-23
**Valid until:** 2026-04-22 (stable stack; `@react-pdf/renderer` actively maintained — check for new releases before implementation)
