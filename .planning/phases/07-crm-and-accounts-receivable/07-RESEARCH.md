# Phase 7: CRM & Accounts Receivable - Research

**Researched:** 2026-03-23
**Domain:** CRM data layer (customers, leads, pipeline), Accounts Receivable / Windykacja (aging, reminders, PDF docs, case tracking)
**Confidence:** HIGH (schema confirmed from live codebase; kalkulator2025 windykacja dissected; all libraries verified in package.json)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CRM-01 | Admin może zarządzać bazą klientów (CRUD) | New `Customer` Prisma model; standard CRUD pattern established in Phases 1-6 |
| CRM-02 | System wspiera lead generation (nowi potencjalni klienci) | `Lead` model with status pipeline; same CRUD pattern |
| CRM-03 | Admin może reaktywować nieaktywnych klientów | `Customer.isActive` + `lastContactAt` date; reactivation = toggle + email (Nodemailer already set up) |
| CRM-04 | Admin widzi pipeline sprzedażowy (etapy, wartości) | `PipelineStage` + `Deal` models; Kanban-style UI with drag or dropdown stage selector |
| CRM-05 | System oferuje portal B2B dla klientów z cennikiem | Separate Next.js route group `(b2b)` with its own Auth.js session; links to PriceList already on User model |
| CRM-06 | Admin widzi monitoring ochrony marki (brand protection) | kalkulator2025 has no live brand-protection feature; implement as a manual URL/marketplace watchlist table |
| WIND-01 | Admin widzi dashboard przeterminowanych płatności (aging buckets) | Query `invoices` table by `dueAt`; compute daysOverdue = today - dueAt; bucket into 0-30/31-60/61-90/90+ |
| WIND-02 | Admin może tworzyć i wysyłać przypomnienia płatności (email) | Nodemailer `src/lib/email.ts` already established; add `sendPaymentReminderEmail()`; log to new `ReminderLog` model |
| WIND-03 | System generuje dokumenty windykacyjne (PDF) | `@react-pdf/renderer` already installed; add `WindykacjaPdfTemplate` to `src/lib/pdf/`; Route Handler `/api/windykacja/pdf/[invoiceId]` |
| WIND-04 | Admin może śledzić status spraw windykacyjnych | New `WindykacjaCase` model with status enum: open / reminded / in_dispute / settled / written_off |
</phase_requirements>

---

## Summary

Phase 7 is a greenfield build on top of the established infrastructure. No CRM or windykacja models exist in `prisma/schema.prisma` yet — the entire data layer must be added in Wave 1. The good news is that every library required is already installed: `@react-pdf/renderer` (Phase 4), `nodemailer` (Phase 1), and date calculation utilities (`date-fns`) are all present. The pattern for all three — PDF generation, email sending, and Prisma CRUD — is proven across multiple earlier phases.

The accounts receivable (windykacja) module can leverage the existing `Invoice` model introduced in Phase 4. The `invoices` table has `dueAt` and `status` fields, so aging-bucket computation is a pure Prisma query with `DATEDIFF`-equivalent logic done in TypeScript using `date-fns/differenceInDays`. No new invoice infrastructure is required — Phase 7 only adds the AR *overlay* (cases, reminder logs, PDF documents) on top of existing invoices.

CRM-05 (B2B portal) is the most architecturally novel requirement. It needs a separate Next.js route group `(b2b)` with its own layout, page-level auth guard, and a read-only price-list view. Because `User.priceListId` is already on the schema (Phase 3), the B2B portal simply reads the assigned price list for the current user. No separate auth system is needed — the same Auth.js v5 session works; the difference is in the route guard and the layout. CRM-06 (brand protection) does not exist in kalkulator2025 in any meaningful form (the admin-windykacja.php was an iframe wrapper for a separate React app); implement it as a simple watchlist table with URL + marketplace + notes fields.

**Primary recommendation:** Split Phase 7 into 3 plans: (1) DB migration + DAL (all new Prisma models + DAL functions), (2) CRM UI (customers, leads, pipeline, brand protection), (3) Windykacja UI (aging dashboard, reminder send, PDF, case tracking) + B2B portal.

---

## Standard Stack

### Core (already installed — no new installs required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.19.2 | ORM — new CRM + windykacja models | Project standard; never `prisma migrate`, use `db pull` or raw SQL migration |
| `@react-pdf/renderer` | 4.3.2 | Windykacja PDF documents | Already used for quotation + invoice PDFs (Phase 4); `@ts-nocheck` NOT needed in `.tsx` (Phase 04-03 decision) |
| nodemailer | 7.0.13 | Payment reminder emails | Already set up in `src/lib/email.ts`; SMTP to mail.allbag.pl |
| date-fns | 4.1.0 | Aging bucket calculation | Already installed; `differenceInDays(today, dueAt)` is the core computation |
| react-hook-form + zod | 7.72.0 / 4.3.6 | CRM forms | Project standard; `zodResolver` with `z.input<Schema>` (Phase 02-02 decision) |
| TanStack Table | 8.21.3 | Customer/lead/invoice lists | Project standard; URL state pattern established (Phase 02-02) |
| Recharts | 3.8.0 | Aging bucket bar chart on dashboard | Already used in analytics pages |
| lucide-react | 0.577.0 | Icons | Project standard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 | Toast notifications | Already used; for reminder send success/error feedback |
| motion (Framer Motion 12) | 12.38.0 | Kanban pipeline animations | For drag or transition effects on deal stage changes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom aging query | Raw `prisma.$queryRaw` | Only if ORM cannot express `DATEDIFF` — prefer `differenceInDays` in TypeScript on small result sets |
| B2B as separate Next.js app | Route group `(b2b)` in same app | Same app simpler; shares Prisma, auth, styles; no separate deployment |

**Installation:**
```bash
# No new packages needed — all libraries already installed
```

---

## Architecture Patterns

### Recommended Project Structure

New files for Phase 7:

```
prisma/
└── schema.prisma                      # Add 6 new models (see below)

src/
├── app/
│   ├── (dashboard)/
│   │   ├── crm/
│   │   │   ├── page.tsx               # Customer list (CRM-01)
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── leads/page.tsx         # Lead list (CRM-02)
│   │   │   ├── leads/new/page.tsx
│   │   │   ├── pipeline/page.tsx      # Sales pipeline (CRM-04)
│   │   │   └── brand-protection/page.tsx  # CRM-06
│   │   └── windykacja/
│   │       ├── page.tsx               # Aging dashboard (WIND-01)
│   │       ├── [invoiceId]/page.tsx   # Case detail + send reminder (WIND-02/04)
│   │       └── _components/           # AgingChart, OverdueTable, CaseStatusBadge
│   └── (b2b)/
│       ├── layout.tsx                 # B2B portal layout (separate from (dashboard))
│       └── portal/
│           └── price-list/page.tsx    # Customer price list view (CRM-05)
│
├── app/api/
│   └── windykacja/
│       └── pdf/[invoiceId]/route.ts   # PDF generation Route Handler (WIND-03)
│
├── lib/
│   ├── dal/
│   │   ├── crm.ts                     # Customer, Lead, Deal DAL
│   │   └── windykacja.ts              # Aging, ReminderLog, Case DAL
│   ├── pdf/
│   │   └── windykacja-template.tsx    # @react-pdf/renderer template
│   └── email.ts                       # Add sendPaymentReminderEmail()
│
└── lib/
    ├── actions/
    │   ├── crm.ts                     # createCustomer, updateCustomer, etc.
    │   └── windykacja.ts              # sendReminder, updateCaseStatus
    └── validations/
        ├── crm.ts                     # Zod schemas
        └── windykacja.ts
```

### Pattern 1: New Prisma Models (Wave 1)

**What:** Add 6 new Prisma models to `prisma/schema.prisma`; write raw SQL migration file (never `prisma migrate`).

**Critical rule from STATE.md:** NEVER run `prisma migrate` — shared MySQL DB with PHP. Write `07-DB-MIGRATION.sql` and apply manually or via `prisma db execute`.

```prisma
// Phase 7: CRM models

model Customer {
  id            Int       @id @default(autoincrement())
  name          String    @db.VarChar(255)
  symbol        String?   @unique @db.VarChar(50)     // maps to kh_Symbol in Subiekt
  email         String?   @db.VarChar(255)
  phone         String?   @db.VarChar(50)
  nip           String?   @db.VarChar(20)
  address       String?   @db.Text
  priceListId   Int?      @map("price_list_id")
  accountManager String?  @map("account_manager") @db.VarChar(255)
  isActive      Boolean   @default(true) @map("is_active")
  lastContactAt DateTime? @map("last_contact_at")
  notes         String?   @db.Text
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  priceList     PriceList?    @relation(fields: [priceListId], references: [id], onDelete: SetNull)
  leads         Lead[]
  deals         Deal[]
  windykacjaCases WindykacjaCase[]

  @@index([isActive])
  @@map("customers")
}

model Lead {
  id          Int       @id @default(autoincrement())
  customerId  Int?      @map("customer_id")
  name        String    @db.VarChar(255)
  email       String?   @db.VarChar(255)
  phone       String?   @db.VarChar(50)
  company     String?   @db.VarChar(255)
  source      String?   @db.VarChar(100)   // e.g. website, referral, trade_show
  status      String    @default("new")    // new | contacted | qualified | converted | lost
  notes       String?   @db.Text
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  customer    Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)

  @@index([status])
  @@map("leads")
}

model Deal {
  id          Int       @id @default(autoincrement())
  customerId  Int       @map("customer_id")
  title       String    @db.VarChar(255)
  stage       String    @default("prospecting")  // prospecting | proposal | negotiation | closed_won | closed_lost
  value       Decimal?  @db.Decimal(12, 2)
  notes       String?   @db.Text
  closedAt    DateTime? @map("closed_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  customer    Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([stage])
  @@map("deals")
}

model BrandWatchItem {
  id          Int       @id @default(autoincrement())
  url         String    @db.VarChar(500)
  marketplace String    @db.VarChar(100)   // e.g. allegro, amazon, olx
  productSku  String?   @map("product_sku") @db.VarChar(100)
  notes       String?   @db.Text
  lastChecked DateTime? @map("last_checked")
  status      String    @default("active") // active | resolved | flagged
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("brand_watch_items")
}

// Phase 7: Windykacja / AR models

model WindykacjaCase {
  id             Int       @id @default(autoincrement())
  invoiceId      Int       @map("invoice_id")
  customerId     Int?      @map("customer_id")
  status         String    @default("open")   // open | reminded | in_dispute | settled | written_off
  priority       String    @default("normal") // low | normal | high | critical
  notes          String?   @db.Text
  assignedTo     Int?      @map("assigned_to")
  resolvedAt     DateTime? @map("resolved_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  invoice        Invoice        @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  customer       Customer?      @relation(fields: [customerId], references: [id], onDelete: SetNull)
  reminderLogs   ReminderLog[]

  @@unique([invoiceId])
  @@index([status])
  @@map("windykacja_cases")
}

model ReminderLog {
  id             Int       @id @default(autoincrement())
  caseId         Int       @map("case_id")
  level          Int       // 1 | 2 | 3 | 4 (escalation level)
  recipientEmail String    @map("recipient_email") @db.VarChar(255)
  subject        String    @db.VarChar(255)
  bodyHtml       String?   @map("body_html") @db.LongText
  sentBy         Int?      @map("sent_by")
  sentAt         DateTime  @default(now()) @map("sent_at")
  status         String    @default("sent")  // sent | failed
  errorMessage   String?   @map("error_message") @db.Text

  case           WindykacjaCase @relation(fields: [caseId], references: [id], onDelete: Cascade)

  @@index([caseId])
  @@map("reminder_logs")
}
```

Also add `invoiceCase WindykacjaCase?` relation to the existing `Invoice` model.

### Pattern 2: Aging Bucket Computation

**What:** Compute days overdue in TypeScript, not SQL, by fetching unpaid invoices and calculating `differenceInDays`.

**When to use:** WIND-01 aging dashboard. Do NOT use `prisma.$queryRaw` for this unless performance requires it.

```typescript
// Source: date-fns docs + project pattern (Phase 05-03 date-fns usage)
import { differenceInDays } from "date-fns";

type AgingBucket = "current" | "0-30" | "31-60" | "61-90" | "90+";

function getAgingBucket(dueAt: Date | null): AgingBucket {
  if (!dueAt) return "current";
  const today = new Date();
  const days = differenceInDays(today, dueAt);
  if (days <= 0) return "current";
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

// DAL: fetch overdue invoices
export async function getAgingData(): Promise<AgingRow[]> {
  await requireAdmin();
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["issued", "draft"] },  // not paid / cancelled
      dueAt: { not: null },
    },
    select: {
      id: true,
      invoiceNumber: true,
      customerName: true,
      customerNip: true,
      totalGross: true,
      dueAt: true,
      status: true,
      invoiceCase: { select: { id: true, status: true, priority: true } },
    },
    orderBy: { dueAt: "asc" },
  });

  return invoices.map((inv) => ({
    ...inv,
    totalGross: Number(inv.totalGross),
    daysOverdue: inv.dueAt ? differenceInDays(new Date(), inv.dueAt) : 0,
    bucket: getAgingBucket(inv.dueAt),
  }));
}
```

### Pattern 3: Payment Reminder Email

**What:** Extend `src/lib/email.ts` with `sendPaymentReminderEmail()`, log to `ReminderLog`.

```typescript
// Source: existing email.ts pattern (established Phase 1)
export async function sendPaymentReminderEmail(opts: {
  to: string;
  invoiceNumber: string;
  customerName: string;
  daysOverdue: number;
  amountDue: number;
  level: number;  // 1 | 2 | 3 | 4
  dueAt: Date;
}): Promise<void> {
  const levelLabels = ["", "Pierwsze przypomnienie", "Drugie przypomnienie", "Pilne przypomnienie", "Ostateczne wezwanie"];
  const bodyHtml = `
    <h2 ...>${levelLabels[opts.level]} — Faktura ${opts.invoiceNumber}</h2>
    <p>Szanowny/a ${opts.customerName},...</p>
    <p>Kwota: ${opts.amountDue.toFixed(2)} PLN</p>
    <p>Termin płatności: ${opts.dueAt.toLocaleDateString("pl-PL")} (${opts.daysOverdue} dni temu)</p>
  `;
  const transport = createTransport();
  await transport.sendMail({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: `${levelLabels[opts.level]} — ${opts.invoiceNumber} — ALLBAG`,
    html: emailTemplate(levelLabels[opts.level], bodyHtml),
  });
}
```

### Pattern 4: Windykacja PDF Template

**What:** New `WindykacjaPdfTemplate` using `@react-pdf/renderer`, served from Route Handler.

**Critical decisions from Phases 04-02 / 04-03:**
- Do NOT use `@ts-nocheck` in `.tsx` PDF templates (Phase 04-03 correction)
- `Buffer.from(buffer)` wrapping needed: `renderToBuffer` returns `Buffer<ArrayBufferLike>`, not assignable to `BodyInit`
- Route: `GET /api/windykacja/pdf/[invoiceId]` — follows same pattern as `/api/quotations/[id]/pdf`

```typescript
// Route Handler pattern (source: Phase 04-02 quotations PDF route)
import { renderToBuffer } from "@react-pdf/renderer";
import { WindykacjaPdfTemplate } from "@/lib/pdf/windykacja-template";

export async function GET(req: Request, { params }: { params: { invoiceId: string } }) {
  await requireAdmin();
  const invoice = await getInvoiceById(Number(params.invoiceId));
  if (!invoice) return new Response("Not found", { status: 404 });

  const buffer = await renderToBuffer(<WindykacjaPdfTemplate invoice={invoice} />);
  return new Response(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="wezwanie-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
```

### Pattern 5: B2B Portal Route Group

**What:** `(b2b)` route group with own layout, separate from `(dashboard)`. Uses same Auth.js v5 session.

**When to use:** CRM-05. The user already has `priceListId` on the `User` model from Phase 3.

**Key architecture decisions:**
- `(b2b)` layout at `src/app/(b2b)/layout.tsx` — no sidebar, minimal header with ALLBAG branding
- Guard: `requireAuth()` (not `requireAdmin()`) — customers are Users with `role: "user"` and an assigned `priceListId`
- The price list page calls existing `getPriceLists()` DAL but filtered to user's assigned list
- The B2B portal is at `/b2b/portal/price-list` — accessible via basePath `/kalkulator2026/b2b/portal/price-list`

```typescript
// (b2b)/layout.tsx
import { requireAuth } from "@/lib/dal/auth";

export default async function B2BLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();  // redirects to /login if no session
  return (
    <html>
      <body>
        <header>ALLBAG B2B Portal — {session.user.name}</header>
        {children}
      </body>
    </html>
  );
}
```

### Anti-Patterns to Avoid

- **Running `prisma migrate`:** NEVER on this project. Write raw SQL in `07-DB-MIGRATION.sql` and apply manually. (Established rule — shared prod DB with PHP.)
- **Fetching all invoices for aging without filtering:** Always filter `status NOT IN ('paid', 'cancelled')` before computing aging buckets.
- **Sending emails in Server Actions without try/catch:** Use best-effort pattern — `try { await sendPaymentReminderEmail(...) } catch {}` then log. Auth flows (and action responses) must never fail because email fails. (Phase 01-02 pattern.)
- **Using `z.infer<>` instead of `z.input<>` with `useForm`:** Always `useForm<z.input<Schema>>()` to avoid TypeScript errors on `.default()` fields. (Phase 02-02 decision.)
- **Import `@react-pdf/renderer` in Server Components directly:** Render PDF in a Route Handler (not in a Server Action) — `renderToBuffer` needs to run in a Node.js handler context.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Aging bucket computation | Custom SQL CASE WHEN query | `differenceInDays` from date-fns on Prisma result | date-fns already installed; TypeScript is simpler and testable |
| PDF generation | `pdfkit` or manual HTML-to-PDF | `@react-pdf/renderer` already installed | Used in Phase 4 for quotation + invoice PDFs; pattern established |
| Email sending | Custom SMTP client | `nodemailer` + `src/lib/email.ts` | Already configured with ALLBAG SMTP; just add `sendPaymentReminderEmail()` |
| Customer table | Custom DataTable | TanStack Table + URL state pattern | Established across 5 prior phases; consistent UX |
| Pipeline Kanban | Build drag-and-drop from scratch | Dropdown stage selector (simplest) OR Framer Motion drag | Phase 7 scope is CRUD + pipeline view, not a full Kanban app |
| Reminder level tracking | Custom state machine | Simple `level` int in `ReminderLog` (max per case) | kalkulator2025 uses P1-P4 levels; replicate as integer 1-4 |

**Key insight:** Every library needed for Phase 7 is already in `package.json`. The complexity is in schema design and the AR business logic (aging buckets, escalation levels), not in new tooling.

---

## Common Pitfalls

### Pitfall 1: Invoice.status Does Not Track AR Status
**What goes wrong:** Using `Invoice.status` (draft/issued/paid/cancelled) to drive windykacja logic assumes all "issued" invoices are overdue.
**Why it happens:** Invoice status tracks the document lifecycle; AR status (open/reminded/settled) is a separate concern.
**How to avoid:** The `WindykacjaCase` model is the AR overlay. An invoice becomes "in windykacja" when a `WindykacjaCase` is created for it. The aging query filters `status IN ('issued', 'draft')` AND `dueAt < today`.
**Warning signs:** If WIND-01 dashboard shows paid invoices as overdue.

### Pitfall 2: Prisma Decimal → number Conversion
**What goes wrong:** Using `invoice.totalGross` directly in arithmetic gives Prisma `Decimal` type, not `number`.
**Why it happens:** Prisma returns `Decimal` objects for `@db.Decimal` fields.
**How to avoid:** Always `Number(inv.totalGross)` in DAL map functions (Phase 03-01 decision). DAL should return plain TypeScript types, not Prisma Decimal.
**Warning signs:** TypeScript errors on arithmetic operations or NaN in rendered values.

### Pitfall 3: B2B Portal Auth Guard at Wrong Level
**What goes wrong:** Protecting only the price-list page but not the layout, allowing navigation to unprotected subpages.
**Why it happens:** Forgetting that Next.js route groups share layout but not middleware-level protection.
**How to avoid:** Put `requireAuth()` in `(b2b)/layout.tsx` (server component), AND in each page if they have admin-only content. Follow the same `requireAuth()` / `requireAdmin()` DAL guard pattern used in every dashboard page.
**Warning signs:** Unauthenticated users can render the B2B layout.

### Pitfall 4: Customer vs User — Duplicate Entity Problem
**What goes wrong:** CRM `Customer` model duplicates data already on `User` model (email, priceListId). Editing one doesn't sync the other.
**Why it happens:** CRM customers and system Users are different entity types — a customer may not have a login account.
**How to avoid:** Keep `Customer` as a standalone entity. When a customer also has a system login, optionally link with `Customer.userId Int?` FK (nullable). Do NOT use `User` as the CRM customer entity.
**Warning signs:** Admins updating customer email in CRM but the user's login email is unchanged.

### Pitfall 5: Wind-03 PDF Generation Blocks the Request
**What goes wrong:** Generating a PDF in a Server Action instead of a Route Handler causes edge runtime issues or overly long server action response times.
**Why it happens:** `renderToBuffer` from `@react-pdf/renderer` is Node.js-only (no Edge runtime).
**How to avoid:** Always generate PDFs in a Route Handler (`route.ts`) not a Server Action. Pattern: GET `/api/windykacja/pdf/[invoiceId]` returns `Content-Disposition: attachment`.
**Warning signs:** TypeScript errors about Edge runtime incompatibility.

### Pitfall 6: Missing `invoiceCase` Relation on Invoice Model
**What goes wrong:** Adding `WindykacjaCase` with a FK to `Invoice` but forgetting to add the back-relation `invoiceCase WindykacjaCase?` to the `Invoice` model in schema.prisma.
**Why it happens:** Prisma requires both sides of a one-to-one relation.
**How to avoid:** When adding `WindykacjaCase` model, simultaneously add `invoiceCase WindykacjaCase?` to the existing `Invoice` model.
**Warning signs:** Prisma schema validation error: "The relation field `invoiceCase` on model `Invoice` is missing an opposite relation field."

---

## Code Examples

### Aging Dashboard DAL

```typescript
// src/lib/dal/windykacja.ts
// Source: Prisma 6 docs + date-fns 4 docs; pattern from Phase 06-01 analytics DAL

import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/dal/auth";
import { differenceInDays } from "date-fns";

export type AgingBucket = "current" | "0-30" | "31-60" | "61-90" | "90+";

export interface AgingRow {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerNip: string | null;
  totalGross: number;
  dueAt: Date | null;
  daysOverdue: number;
  bucket: AgingBucket;
  caseId: number | null;
  caseStatus: string | null;
}

export interface AgingSummary {
  totalOverdue: number;       // PLN
  countOverdue: number;
  buckets: Record<AgingBucket, { count: number; amount: number }>;
}

function toBucket(dueAt: Date | null): AgingBucket {
  if (!dueAt) return "current";
  const d = differenceInDays(new Date(), dueAt);
  if (d <= 0) return "current";
  if (d <= 30) return "0-30";
  if (d <= 60) return "31-60";
  if (d <= 90) return "61-90";
  return "90+";
}

export async function getAgingData(): Promise<{ rows: AgingRow[]; summary: AgingSummary }> {
  await requireAdmin();
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["issued", "draft"] },
      dueAt: { not: null, lt: new Date() },  // only past-due
    },
    select: {
      id: true,
      invoiceNumber: true,
      customerName: true,
      customerNip: true,
      totalGross: true,
      dueAt: true,
      invoiceCase: { select: { id: true, status: true } },
    },
    orderBy: { dueAt: "asc" },
  });

  const rows: AgingRow[] = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customerName: inv.customerName,
    customerNip: inv.customerNip,
    totalGross: Number(inv.totalGross),
    dueAt: inv.dueAt,
    daysOverdue: inv.dueAt ? differenceInDays(new Date(), inv.dueAt) : 0,
    bucket: toBucket(inv.dueAt),
    caseId: inv.invoiceCase?.id ?? null,
    caseStatus: inv.invoiceCase?.status ?? null,
  }));

  const summary: AgingSummary = {
    totalOverdue: rows.reduce((s, r) => s + r.totalGross, 0),
    countOverdue: rows.length,
    buckets: {
      "current": { count: 0, amount: 0 },
      "0-30": { count: 0, amount: 0 },
      "31-60": { count: 0, amount: 0 },
      "61-90": { count: 0, amount: 0 },
      "90+": { count: 0, amount: 0 },
    },
  };
  rows.forEach((r) => {
    summary.buckets[r.bucket].count++;
    summary.buckets[r.bucket].amount += r.totalGross;
  });

  return { rows, summary };
}
```

### DB Migration SQL (pattern from Phase 04-01)

```sql
-- .planning/phases/07-crm-and-accounts-receivable/07-DB-MIGRATION.sql
-- Apply with: prisma db execute --file ./07-DB-MIGRATION.sql
-- OR manually in phpMyAdmin

CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `symbol` VARCHAR(50) NULL UNIQUE,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `nip` VARCHAR(20) NULL,
  `address` TEXT NULL,
  `price_list_id` INT NULL,
  `account_manager` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_contact_at` DATETIME NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customers_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leads` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `company` VARCHAR(255) NULL,
  `source` VARCHAR(100) NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'new',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_leads_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `deals` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `stage` VARCHAR(50) NOT NULL DEFAULT 'prospecting',
  `value` DECIMAL(12,2) NULL,
  `notes` TEXT NULL,
  `closed_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_deals_stage` (`stage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `brand_watch_items` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `url` VARCHAR(500) NOT NULL,
  `marketplace` VARCHAR(100) NOT NULL,
  `product_sku` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `last_checked` DATETIME NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `windykacja_cases` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL UNIQUE,
  `customer_id` INT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'open',
  `priority` VARCHAR(20) NOT NULL DEFAULT 'normal',
  `notes` TEXT NULL,
  `assigned_to` INT NULL,
  `resolved_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_windykacja_cases_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reminder_logs` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `case_id` INT NOT NULL,
  `level` TINYINT NOT NULL,
  `recipient_email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body_html` LONGTEXT NULL,
  `sent_by` INT NULL,
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(20) NOT NULL DEFAULT 'sent',
  `error_message` TEXT NULL,
  INDEX `idx_reminder_logs_case_id` (`case_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Navigation Update (navigation.ts)

```typescript
// Add to sidebarItems in src/lib/navigation.ts
// Source: existing navigation.ts pattern

import { Users2, TrendingUp, AlertTriangle, ... } from "lucide-react";

// CRM group
{ type: "separator" },
{ type: "item", label: "Klienci", href: "/crm", icon: Users2, pageId: "admin-crm" },
{ type: "item", label: "Leady", href: "/crm/leads", icon: TrendingUp, pageId: "admin-leads" },
{ type: "item", label: "Pipeline", href: "/crm/pipeline", icon: BarChart2, pageId: "admin-pipeline" },
{ type: "separator" },
{ type: "item", label: "Windykacja", href: "/windykacja", icon: AlertTriangle, pageId: "admin-windykacja" },
```

---

## State of the Art

| Old Approach (kalkulator2025) | Current Approach (kalkulator2026) | Impact |
|-------------------------------|-----------------------------------|--------|
| Windykacja as separate React/Vite SPA in `/windykacja/` directory, embedded via `<iframe>` in admin-windykacja.php | Native Next.js route `/windykacja` in `(dashboard)` route group | No iframe, same auth session, Aether design, shared DAL |
| Payment reminders data sourced from Subiekt GT invoices via Node API at `NODE_API_BASE/reports/overdue-payments` | Query from `invoices` table directly via Prisma (invoices built in Phase 4) | Self-contained; no dependency on kalkulator2025 Node server |
| B2B portal = admin-b2b-guide.php (static HTML guide page, no real portal) | Next.js `(b2b)` route group with Auth.js session, reads PriceList from Phase 3 schema | First real B2B portal |
| CRM = sales-strategy-generator.php (AI suggestions, not a real CRM) | Prisma Customer/Lead/Deal models with CRUD UI | First real CRM module |
| Brand protection = not implemented in production kalkulator2025 | Simple `BrandWatchItem` watchlist table | Minimal viable implementation |

**Deprecated/outdated:**
- kalkulator2025 windykacja React SPA (`/windykacja/frontend/`): superseded by native Next.js implementation
- `NODE_API_BASE/reports/overdue-payments` endpoint: superseded by direct Prisma query on `invoices` table
- `payment_reminder_settings`, `payment_reminder_logs`, `payment_reminder_tracking`, `payment_reminder_exclusions`, `payment_reminder_queue`, `payment_reminder_templates` MySQL tables: kalkulator2025 legacy; do NOT replicate in kalkulator2026. Use simplified `windykacja_cases` + `reminder_logs` instead.

---

## Open Questions

1. **Should aging buckets include invoices from Subiekt GT that are NOT in the kalkulator2026 `invoices` table?**
   - What we know: Phase 4 built kalkulator2026's own `invoices` table (FAK-YYYY-NNNNN). kalkulator2025 sourced overdue data from Subiekt GT via a Node API.
   - What's unclear: Are all ALLBAG invoices in the kalkulator2026 `invoices` table, or are some only in Subiekt GT?
   - Recommendation: For Phase 7, scope WIND-01 to `invoices` table only. If Subiekt GT invoices need inclusion, that is a v2 enhancement.

2. **CRM-05 B2B portal: are "customers" the same as system Users (with login), or a separate entity?**
   - What we know: kalkulator2025 B2B portal was a static HTML guide, not a real portal. Users have `priceListId` on the `User` model.
   - What's unclear: Whether the customer base (CRM-01 `Customer` model) maps 1:1 to system `User` accounts.
   - Recommendation: Implement `Customer` as a standalone entity. For B2B portal (CRM-05), gate access by `User.priceListId IS NOT NULL`. This means "any system user with an assigned price list can access the B2B portal." No new Customer-User link needed for the MVP.

3. **CRM-06 brand protection: is there a specific data source to monitor?**
   - What we know: kalkulator2025 has no brand protection functionality in production. The admin-b2b-guide.php is a static page.
   - What's unclear: Whether ALLBAG wants web-scraping/automated monitoring or just a manual watchlist.
   - Recommendation: Implement as a manual watchlist (BrandWatchItem table with URL + marketplace + notes + status). No automated scraping in Phase 7 — that would be v2 or Phase 9 (Tradewatch).

---

## Sources

### Primary (HIGH confidence)
- `prisma/schema.prisma` — confirmed existing models: Invoice (dueAt, status fields), User (priceListId), PriceList; NO CRM or windykacja models exist yet
- `package.json` — confirmed: `@react-pdf/renderer@4.3.2`, `nodemailer@7.0.13`, `date-fns@4.1.0`, `recharts@3.8.0` all installed
- `src/lib/email.ts` — confirmed: Nodemailer configured, `emailTemplate()` helper, `sendContainerStatusEmail()` / `sendQuotationEmail()` patterns
- `src/lib/pdf/invoice-template.tsx` — confirmed: @react-pdf/renderer usage without `@ts-nocheck`, StyleSheet.create pattern
- `.planning/STATE.md` decisions log — confirmed: 40+ project-specific decisions affecting Phase 7 (Prisma Decimal→number, no `prisma migrate`, zodResolver z.input, DataTable pattern, email best-effort, Buffer.from wrapping for PDF)

### Secondary (MEDIUM confidence)
- `kalkulator2025/windykacja/frontend/src/types/invoice.ts` — windykacja data model reference; used to inform `WindykacjaCase` + `ReminderLog` model design
- `kalkulator2025/windykacja/frontend/src/types/settings.ts` — escalation levels P1-P4 (1-4 integer levels); confirmed as the right escalation model
- `kalkulator2025/api/admin/payment-reminder-settings.php` — confirmed table names: `payment_reminder_settings`, `payment_reminder_logs`, `payment_reminder_tracking`, `payment_reminder_queue`, `payment_reminder_templates`, `payment_reminder_exclusions`; these are kalkulator2025 legacy tables, NOT to be replicated
- `kalkulator2025/api/admin/payment-reminder-send.php` — reminder levels: -2 (pre-due), 0 (on-due), 1 (7+ days), 2 (14+ days), 3 (30+ days), 4 (60+ days); simplified to 1-4 in kalkulator2026

### Tertiary (LOW confidence)
- kalkulator2025 CRM feature (CRM-01..04): No PHP files for customers/pipeline found in non-worktree code. `admin/sales-strategy-generator.php` and `admin-social-manager.php` are AI tools, not a real CRM. Phase 7 builds CRM from scratch.
- B2B portal claim: `admin-b2b-guide.php` was a static HTML page, not a real portal. CRM-05 is a new feature.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed in package.json; no new installs required
- Architecture: HIGH — patterns verified from Phases 1-6 in STATE.md; new models designed from kalkulator2025 type inspection
- Pitfalls: HIGH — drawn directly from STATE.md accumulated decisions log (40+ confirmed decisions)
- kalkulator2025 reference: MEDIUM — windykacja types/PHP inspected; CRM had no production implementation to reference

**Research date:** 2026-03-23
**Valid until:** 2026-04-22 (30 days — stable Next.js/Prisma stack)
