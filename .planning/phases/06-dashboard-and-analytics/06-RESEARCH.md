# Phase 6: Dashboard & Analytics - Research

**Researched:** 2026-03-23
**Domain:** Data aggregation, chart visualization, notifications, user settings
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Użytkownik widzi główny dashboard z KPI (sprzedaż, zamówienia, dostawy) | Quotations + Containers + DomesticDelivery tables have enough data for KPI aggregation via Prisma aggregate() |
| DASH-02 | Dashboard pokazuje wykresy trendów (tygodniowe, miesięczne) | Recharts 3.8.0 (not installed — needs npm install recharts); $queryRaw with MySQL DATE_FORMAT() for week/month grouping |
| DASH-03 | Dashboard pokazuje ostatnią aktywność w systemie | ActivityLog table already exists with full history; getActivityLog DAL already implemented |
| DASH-04 | Dashboard pokazuje nadchodzące dostawy i kontenery | Container.etaDate + DomesticDelivery.etaDate with future date filter; pattern exists in getCalendarDeliveries |
| DASH-05 | Użytkownik widzi powiadomienia w topnav (real-time badge) | New Notification + NotificationRead tables needed in DB migration; polling (setInterval 30s) pattern recommended over SSE |
| DASH-06 | Użytkownik może zarządzać ustawieniami konta (hasło, preferencje) | User.passwordHash already exists; bcryptjs already installed; notification pref fields need new DB table |
| ANAL-01 | Admin widzi dashboard sprzedaży (przychody, top produkty, top klienci) | Quotation + QuotationItem tables provide revenue/top-products; no Subiekt dependency for quotation-based KPIs |
| ANAL-02 | Admin widzi porównanie rok do roku (YoY) i tydzień do tygodnia (WoW) | $queryRaw + MySQL YEAR()/WEEK()/DATE_FORMAT() required; Prisma groupBy() cannot handle date functions |
| ANAL-03 | Admin widzi statystyki paczkarni (wydajność pakowaczy, kolejka) | packer_live_stats table exists in prod MySQL (from kalkulator2025); needs schema definition in Prisma + read-only DAL |
| ANAL-04 | Admin widzi dashboard magazynu i stan zapasów | ContainerItem table covers inventory-in-transit; no standalone inventory table exists — show container-based stock |
| ANAL-05 | Admin może eksportować raporty do Excel | xlsx (SheetJS) already installed at 0.20.3 via CDN; Route Handler GET pattern: XLSX.write() → buffer → Response |
| ANAL-06 | System generuje raport martwych zapasów i zwrotów | No dedicated returns/dead-stock table in kalkulator2026; use ContainerItem + Product.updatedAt heuristics or raw query |
</phase_requirements>

---

## Summary

Phase 6 builds the data-rich main dashboard and admin analytics layer that all previous phases have been feeding data into. The project already has rich data tables (quotations, containers, deliveries, activity_log) and a working `getContainerAnalytics()` pattern with `$queryRaw` — the same approach directly applies to all new KPI aggregations.

The most significant infrastructure gap is the **notifications system**: kalkulator2025 has a full `notifications` + `notification_reads` + `notification_recipients` schema, but kalkulator2026 has none of this. A DB migration must create these tables before notification badge work can begin. The topbar already exists as a Client Component (`topbar.tsx`) and is the natural location for the polling badge — no SSE complexity needed since the existing pattern in kalkulator2025 used simple polling every 30 seconds.

Charts require **Recharts 3.8.0** (not yet installed). Recharts must always be wrapped in `"use client"` components; the recommended pattern is to fetch data in the Server Component (page) and pass it as props to a chart Client Component. SheetJS (`xlsx` 0.20.3) is already installed for Excel export and works perfectly from Route Handlers using `XLSX.write(wb, { type: "buffer" }) → Response`.

**Primary recommendation:** Plan three waves: (1) DB migration + dashboard DAL layer, (2) main dashboard page + KPI cards + charts + activity feed + upcoming deliveries, (3) notifications system + analytics admin pages + Excel export + user settings.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.19.2 | ORM + $queryRaw for aggregation | Already used across all phases |
| date-fns | 4.1.0 | Date arithmetic for WoW/YoY calculations | Already installed in Phase 5 |
| xlsx (SheetJS) | 0.20.3 (CDN) | Excel export | Already installed, no alternative needed |
| sonner | 2.0.7 | Toast for export/save feedback | Already used across all phases |

### Needs Installation
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.0 (latest) | Charts: LineChart, BarChart, AreaChart, PieChart | Most popular React charting library; composable, responsive, D3-based |

**Installation:**
```bash
npm install recharts
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts | Chart.js + react-chartjs-2 | Recharts is more React-idiomatic, composable; Chart.js has wider chart variety but heavier and more imperative API |
| recharts | Victory | Victory is more feature-complete but larger bundle and less community activity |
| setInterval polling | Server-Sent Events (SSE) | SSE is more efficient but adds complexity with ReadableStream; kalkulator2025 used polling — match existing approach |

---

## Data Sources Inventory

### What KPIs Can Be Built From Existing Tables

| KPI | Source Table(s) | Prisma Method | Notes |
|-----|-----------------|---------------|-------|
| Total quotations (today/week/month) | `quotations` | `prisma.quotation.count({ where: { createdAt: { gte } } })` | status filter: draft/sent/accepted |
| Total revenue from quotations | `quotations` | `prisma.quotation.aggregate({ _sum: { totalAmount } })` | totalAmount is pre-calculated |
| Quotations by status | `quotations` | `prisma.quotation.groupBy({ by: ['status'] })` | draft/sent/accepted/rejected |
| Top products by quotation revenue | `quotation_items` | `$queryRaw` GROUP BY productName/sku | No Order model — quotation items are the sales proxy |
| Containers in transit / ETA this week | `containers` | `prisma.container.count({ where: { status, etaDate } })` | Pattern already in getContainerAnalytics() |
| Upcoming deliveries (7 days) | `domestic_deliveries` | `prisma.domesticDelivery.findMany({ where: { etaDate: { gte, lte } } })` | Pattern already in getCalendarDeliveries() |
| Activity feed | `activity_log` | `prisma.activityLog.findMany({ orderBy: createdAt desc, take: 10 })` | getActivityLog() DAL already exists |
| Active users | `users` | `prisma.user.count({ where: { isActive: true } })` | Simple count |
| Packer stats | `packer_live_stats` | `$queryRaw` (read-only, prod MySQL table) | Exists in prod DB; needs Prisma model added |
| Weekly trend (quotation revenue) | `quotations` | `$queryRaw` with `DATE_FORMAT(created_at, '%Y-%W')` GROUP BY | Prisma groupBy cannot do date functions |
| YoY comparison | `quotations` | `$queryRaw` with `YEAR(created_at)` GROUP BY month | Same raw query approach |

### Tables That Do NOT Exist Yet in kalkulator2026 Schema

| Table | Purpose | Action Required |
|-------|---------|-----------------|
| `notifications` | Admin-created system/delivery/feature notifications | Create in Phase 6 DB migration |
| `notification_reads` | Per-user read tracking + dismiss | Create in Phase 6 DB migration |
| `notification_recipients` | Per-user targeting when target_type='specific' | Create in Phase 6 DB migration |

Note: `packer_live_stats` exists in the production MySQL database (confirmed from kalkulator2025 backup) but is not yet in Prisma schema. Add as a Prisma model with `@@map("packer_live_stats")`.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(dashboard)/
│   ├── page.tsx                          # Main dashboard (Server Component, Phase 6 replaces stub)
│   ├── _components/
│   │   ├── kpi-cards.tsx                 # KPI grid (Server Component — no interactivity)
│   │   ├── trend-chart.tsx               # "use client" — Recharts LineChart/AreaChart
│   │   ├── activity-feed.tsx             # Server Component
│   │   ├── upcoming-deliveries.tsx       # Server Component
│   │   └── notification-bell.tsx         # "use client" — polling badge
│   ├── analytics/
│   │   ├── page.tsx                      # Admin analytics hub
│   │   ├── _components/
│   │   │   ├── sales-chart.tsx           # "use client" — BarChart/LineChart
│   │   │   ├── top-products-table.tsx    # Server Component or Client (TanStack Table)
│   │   │   ├── packer-stats.tsx          # Server Component
│   │   │   └── dead-stock-table.tsx      # Server Component
│   └── settings/
│       └── account/
│           └── page.tsx                  # User account settings (password change, prefs)
├── lib/
│   ├── dal/
│   │   ├── dashboard.ts                  # getDashboardKpis, getActivityFeed, getUpcomingDeliveries
│   │   ├── analytics.ts                  # getSalesAnalytics, getYoYComparison, getWoWComparison, getPackerStats, getDeadStock
│   │   └── notifications.ts             # getNotifications, getUnreadCount, markRead, createNotification
│   └── actions/
│       └── notifications.ts             # markNotificationReadAction, createNotificationAction
├── types/
│   ├── dashboard.ts                      # DashboardKpi, TrendDataPoint, ActivityEntry types
│   └── analytics.ts                      # SalesAnalytics, YoYRow, PackerStats types
└── app/api/
    ├── notifications/
    │   └── unread-count/route.ts         # GET — polling endpoint for badge
    └── analytics/
        └── export/route.ts               # GET — SheetJS Excel export
```

### Pattern 1: Server Component Page + Client Chart Island

**What:** Fetch all data in the Server Component, pass as serializable props to Recharts Client Component.
**When to use:** All chart pages in Phase 6.

```typescript
// Source: Verified pattern from Next.js official docs + recharts community
// src/app/(dashboard)/page.tsx (Server Component)
import { getDashboardKpis } from "@/lib/dal/dashboard";
import { TrendChart } from "./_components/trend-chart";

export default async function DashboardPage() {
  const { kpis, trendData, activityFeed, upcoming } = await getDashboardKpis();
  return (
    <div>
      {/* KPI cards — pure Server Component rendering */}
      <KpiCards kpis={kpis} />
      {/* Chart — Client Component island, receives serialized data */}
      <TrendChart data={trendData} />
    </div>
  );
}
```

```typescript
// src/app/(dashboard)/_components/trend-chart.tsx (Client Component)
"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

interface TrendDataPoint {
  period: string;
  revenue: number;
  count: number;
}

export function TrendChart({ data }: { data: TrendDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="period" stroke="#9ca3af" tick={{ fontSize: 12 }} />
        <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: "#0a0a1e", border: "1px solid rgba(255,255,255,0.08)" }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#6366f1"
          fill="rgba(99,102,241,0.15)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

### Pattern 2: Prisma $queryRaw for Time-Series Aggregation

**What:** Use raw SQL with MySQL date functions for GROUP BY week/year.
**When to use:** DASH-02, ANAL-02 (any chart with time bucketing).

```typescript
// Source: Verified from Prisma docs + community patterns
// src/lib/dal/dashboard.ts
import { prisma } from "@/lib/db";

interface WeeklyTrendRow {
  period: string;   // e.g. "2026-12"
  revenue: number;
  count: bigint;
}

export async function getWeeklyQuotationTrend(): Promise<WeeklyTrendRow[]> {
  const rows = await prisma.$queryRaw<WeeklyTrendRow[]>`
    SELECT
      DATE_FORMAT(created_at, '%Y-%u') AS period,
      SUM(total_amount) AS revenue,
      COUNT(*) AS count
    FROM quotations
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
    GROUP BY DATE_FORMAT(created_at, '%Y-%u')
    ORDER BY period ASC
  `;
  // IMPORTANT: MySQL COUNT returns bigint — must coerce
  return rows.map(r => ({
    period: r.period,
    revenue: Number(r.revenue),
    count: Number(r.count),
  }));
}

// YoY: same month in current year vs last year
export async function getYoYComparison() {
  return prisma.$queryRaw`
    SELECT
      MONTH(created_at) AS month,
      YEAR(created_at) AS year,
      SUM(total_amount) AS revenue,
      COUNT(*) AS count
    FROM quotations
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 2 YEAR)
    GROUP BY YEAR(created_at), MONTH(created_at)
    ORDER BY year ASC, month ASC
  `;
}
```

### Pattern 3: Notification Badge (Polling)

**What:** Client Component polls `/api/notifications/unread-count` every 30 seconds.
**When to use:** DASH-05.

```typescript
// src/components/aether/notification-bell.tsx — REPLACES/EXTENDS topbar.tsx
"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const json = await res.json();
        setUnreadCount(json.data?.total ?? 0);
      }
    }
    fetchCount(); // immediate on mount
    const interval = setInterval(fetchCount, 30_000); // 30s poll
    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  return (
    <button className="relative p-2 rounded-lg hover:bg-white/[0.05]">
      <Bell className="w-5 h-5 text-aether-text-secondary" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center
          rounded-full bg-aether-rose text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
```

### Pattern 4: SheetJS Excel Export via Route Handler

**What:** GET Route Handler generates workbook in memory and streams as buffer.
**When to use:** ANAL-05.

```typescript
// Source: SheetJS official docs + Dave Gray verified pattern
// src/app/api/analytics/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/dal/auth";
import { getSalesAnalytics } from "@/lib/dal/analytics";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const { searchParams } = req.nextUrl;
  const report = searchParams.get("report") ?? "sales";

  const data = await getSalesAnalytics({ report });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Raport");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    headers: {
      "Content-Disposition": `attachment; filename="raport-${report}-${new Date().toISOString().slice(0,10)}.xlsx"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
```

Client trigger (Server Action or direct link):
```typescript
// In any Client Component — trigger download with anchor href
<a href="/kalkulator2026/api/analytics/export?report=sales" download>
  Eksportuj Excel
</a>
```

### Pattern 5: Topbar Extension for Notifications

**What:** The existing `topbar.tsx` is a Client Component. Add `NotificationBell` as a sibling in the right section.
**When to use:** DASH-05 — do not rebuild topbar from scratch.

The existing topbar layout: `[MobileMenuButton][Spacer][RoleBadge][UserName][Avatar][LogoutBtn]`
Phase 6 adds: `[MobileMenuButton][Spacer][RoleBadge][UserName][NotificationBell][Avatar][LogoutBtn]`

The topbar already has `"use client"` — `NotificationBell` can be a separate file imported directly.

### Anti-Patterns to Avoid

- **Recharts in Server Component:** Will throw `TypeError: Super expression must either be null or a function`. Always `"use client"` on the chart file.
- **Prisma groupBy() for date bucketing:** Prisma's native `groupBy()` cannot use `DATE_FORMAT()` or `WEEK()` — use `$queryRaw` only.
- **BigInt from COUNT in raw queries:** MySQL `COUNT(*)` returns `bigint` in Prisma raw results — always coerce with `Number()`.
- **Decimal from SUM in raw queries:** MySQL `SUM()` returns `Decimal` — always coerce with `Number()`.
- **Direct Topbar rebuild:** The topbar is used in the dashboard layout — extend it minimally, do not refactor its structure.
- **SSE for notification badge:** Adds ReadableStream complexity for no meaningful advantage over 30-second polling at this scale.

---

## Notifications Schema (New — DB Migration Required)

Based on the confirmed kalkulator2025 schema, Phase 6 DB migration must add these three tables:

```sql
-- 06-DB-MIGRATION.sql
CREATE TABLE notifications (
  id INT NOT NULL AUTO_INCREMENT,
  sender_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('system','delivery','feature','important') DEFAULT 'system',
  target_type ENUM('all','specific') DEFAULT 'all',
  priority ENUM('low','normal','high') DEFAULT 'normal',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_type (type),
  KEY idx_created (created_at),
  CONSTRAINT fk_notif_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification_reads (
  id INT NOT NULL AUTO_INCREMENT,
  notification_id INT NOT NULL,
  user_id INT NOT NULL,
  read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_dismissed TINYINT(1) DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY unique_read (notification_id, user_id),
  KEY idx_user (user_id),
  CONSTRAINT fk_nr_notif FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  CONSTRAINT fk_nr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification_recipients (
  id INT NOT NULL AUTO_INCREMENT,
  notification_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_notif (notification_id),
  CONSTRAINT fk_nrec_notif FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  CONSTRAINT fk_nrec_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Corresponding Prisma models to add to `schema.prisma`:
```prisma
model Notification {
  id          Int      @id @default(autoincrement())
  senderId    Int      @map("sender_id")
  title       String   @db.VarChar(255)
  message     String   @db.Text
  type        String   @default("system") // system | delivery | feature | important
  targetType  String   @default("all") @map("target_type") // all | specific
  priority    String   @default("normal") // low | normal | high
  createdAt   DateTime @default(now()) @map("created_at")
  expiresAt   DateTime? @map("expires_at")

  sender     User                     @relation("NotificationSender", fields: [senderId], references: [id], onDelete: Cascade)
  reads      NotificationRead[]
  recipients NotificationRecipient[]

  @@index([type])
  @@index([createdAt])
  @@map("notifications")
}

model NotificationRead {
  id             Int      @id @default(autoincrement())
  notificationId Int      @map("notification_id")
  userId         Int      @map("user_id")
  readAt         DateTime @default(now()) @map("read_at")
  isDismissed    Boolean  @default(false) @map("is_dismissed")

  notification   Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([notificationId, userId])
  @@index([userId])
  @@map("notification_reads")
}

model NotificationRecipient {
  id             Int  @id @default(autoincrement())
  notificationId Int  @map("notification_id")
  userId         Int  @map("user_id")

  notification   Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)

  @@index([notificationId])
  @@map("notification_recipients")
}
```

Note: Add `notificationsSent NotificationSender[]` and `notificationReads NotificationRead[]` back-relations to the `User` model.

---

## Packer Stats (ANAL-03) — Existing Production Table

`packer_live_stats` exists in the production MySQL database (confirmed from kalkulator2025 DB backup dated 2026-01-19). It is a simple stats table:

```
packer_live_stats:
  id             INT AUTO_INCREMENT
  recorded_at    DATETIME (index)
  total_packages INT
  total_items    INT
  packer_count   INT
  source         VARCHAR(20)  -- 'ssrs' or 'subiekt'
  created_at     TIMESTAMP
```

Add to Prisma schema as a **read-only model** (no mutations in kalkulator2026):

```prisma
model PackerLiveStat {
  id            Int      @id @default(autoincrement())
  recordedAt    DateTime @map("recorded_at")
  totalPackages Int      @map("total_packages")
  totalItems    Int      @map("total_items")
  packerCount   Int      @map("packer_count")
  source        String   @default("ssrs") @db.VarChar(20)
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([recordedAt])
  @@map("packer_live_stats")
}
```

DAL query — last 7 days packer totals:
```typescript
export async function getPackerStats() {
  await requireAdmin();
  return prisma.$queryRaw`
    SELECT
      DATE(recorded_at) as day,
      MAX(total_packages) as packages,
      MAX(packer_count) as packers
    FROM packer_live_stats
    WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(recorded_at)
    ORDER BY day ASC
  `;
}
```

---

## Dead Stock / Returns (ANAL-06)

There is no dedicated returns or dead-stock table in kalkulator2026. Options:

1. **Container-based dead stock:** Products in ContainerItem with `container.status = 'completed'` but no recent quotation_item entries = potential dead stock. Use a `$queryRaw` LEFT JOIN.
2. **Product age heuristic:** Products with `products.updatedAt` older than N months and no matching QuotationItem entries.

Recommended approach for ANAL-06: A `$queryRaw` joining `container_items`, `containers`, `products`, and checking absence in recent `quotation_items`:

```sql
SELECT p.id, p.name, p.sku, ci.quantity, c.actual_arrival_date
FROM container_items ci
JOIN containers c ON ci.container_id = c.id
JOIN products p ON ci.product_id = p.id
WHERE c.status = 'completed'
  AND c.actual_arrival_date < DATE_SUB(NOW(), INTERVAL 6 MONTH)
  AND NOT EXISTS (
    SELECT 1 FROM quotation_items qi
    WHERE qi.sku = p.sku
      AND qi.quotation_id IN (
        SELECT id FROM quotations WHERE created_at > DATE_SUB(NOW(), INTERVAL 6 MONTH)
      )
  )
ORDER BY c.actual_arrival_date ASC
LIMIT 50
```

This is a best-effort heuristic — note in UI that it reflects container arrivals vs. quotation activity, not a true warehouse inventory system.

---

## User Settings (DASH-06)

The `User` model has everything needed for password change:
- `passwordHash` field (bcryptjs-hashed)
- bcryptjs 3.0.3 already installed

Password change Server Action pattern (same as auth in Phase 1):
```typescript
// verify current password with bcryptjs.compare()
// hash new password with bcryptjs.hash(newPwd, 12)
// prisma.user.update({ where: { id }, data: { passwordHash: newHash } })
```

For notification preferences, the `user_widget_preferences` table exists in production MySQL with `notify_deliveries`, `notify_features`, `notify_system` boolean columns. This table is already reflected in `UserWidgetPermission` Prisma model but does NOT have the notification preference columns — they live in a separate `user_widget_preferences` table (distinct from `user_widget_permissions`).

Action: Add a `UserNotificationPreference` Prisma model mapping to `user_widget_preferences`, OR store preferences as JSON in a new `user_preferences` table (simpler for kalkulator2026).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Charts / data visualization | Custom SVG charts | Recharts 3.8.0 | Responsive containers, tooltips, legends, animations — hundreds of edge cases |
| Excel export | Manual CSV / custom binary format | SheetJS xlsx (already installed) | Cell formatting, multiple sheets, proper MIME types — trivial with SheetJS |
| Date arithmetic for WoW/YoY | Manual date math in JS | MySQL DATE_FORMAT/WEEK/YEAR in $queryRaw | Let the database do grouping — JS post-processing is slower and complex |
| Notification polling | Custom WebSocket server | setInterval fetch to Route Handler | SSE/WebSocket overkill for 30s badge polling at this scale |
| KPI aggregation caching | Custom in-memory cache | Next.js `cache()` function + `revalidatePath()` | React cache() deduplicates per-request; revalidate on mutations |

**Key insight:** The project already has SheetJS, bcryptjs, date-fns, and activity_log infrastructure. The work is in DAL functions and wiring them to UI, not building infrastructure.

---

## Common Pitfalls

### Pitfall 1: Recharts SSR Crash
**What goes wrong:** Importing Recharts in a Server Component or forgetting `"use client"` causes `TypeError: Super expression must either be null or a function` at build/runtime.
**Why it happens:** Recharts uses browser APIs (`window`, DOM refs) that don't exist during SSR.
**How to avoid:** Every file that imports from `recharts` MUST have `"use client"` at the top. Isolate chart components in separate files.
**Warning signs:** Build error with "Super expression" or hydration error mentioning Recharts.

### Pitfall 2: BigInt / Decimal from $queryRaw Results
**What goes wrong:** `COUNT(*)` returns `bigint` type in Prisma raw results; `SUM()` may return `Decimal`. Passing these directly to Recharts (which expects `number`) causes chart rendering failures or TypeScript errors.
**Why it happens:** MySQL wire protocol uses 64-bit integers for aggregates, which JavaScript serializes as `bigint`.
**How to avoid:** Always map raw query results: `count: Number(r.count)`, `revenue: Number(r.revenue)`.
**Warning signs:** `Cannot serialize BigInt` JSON error, or chart shows no bars/lines despite data existing.

### Pitfall 3: Missing Notification Tables in DB Migration
**What goes wrong:** Prisma schema adds Notification models but the DB migration SQL is not run, causing Prisma queries to fail with "table doesn't exist".
**Why it happens:** The shared MySQL rule — never run `prisma migrate`, always use manual SQL. If the migration file is written but not executed on the DB, schema and DB diverge.
**How to avoid:** Migration SQL must be in `prisma/06-DB-MIGRATION.sql`. Document in plan that it must be run manually. User to confirm before testing notifications.
**Warning signs:** PrismaClientKnownRequestError with code P2021 (table doesn't exist).

### Pitfall 4: Topbar Re-render on Poll
**What goes wrong:** NotificationBell is embedded in the topbar which is inside the layout. If the Server Component layout re-renders on route navigation, the Client Component state resets and loses the badge count until the next poll.
**Why it happens:** Next.js layouts preserve state across navigations by default, but if layout is forced to re-render (e.g., via `revalidatePath('/')`), client state is lost.
**How to avoid:** Don't call `revalidatePath('/')` from dashboard mutations unless necessary. The NotificationBell stores count in `useState` — it will refetch on mount but 30s polling handles steady state.
**Warning signs:** Badge count resets to 0 on every page navigation.

### Pitfall 5: StatCard vs GlassCard Inconsistency
**What goes wrong:** Using `GlassCard` wrapper when `StatCard` component already exists leads to inconsistent KPI card appearances.
**Why it happens:** `StatCard` (`stat-card.tsx`) is the proper Aether component for metrics — already has icon badge, value, label, and trend indicator built in. `GlassCard` is a raw container.
**How to avoid:** Use `StatCard` for KPI numbers with trend arrows. Use `GlassCard` for content sections and chart wrappers.
**Warning signs:** KPI cards look different from the design system spec.

### Pitfall 6: basePath in Excel Download Links
**What goes wrong:** `<a href="/api/analytics/export">` does not work — the app is served at `/kalkulator2026` basePath.
**Why it happens:** The app has `basePath: '/kalkulator2026'` in `next.config.ts`. Hardcoded `/api/` paths miss the base.
**How to avoid:** Use Next.js `<Link>` for internal navigation or use `process.env.NEXT_PUBLIC_BASE_PATH` prefix for download anchors, OR use the `basePath`-aware approach of `next/navigation`'s `useRouter().push()`. For static `<a>` download links, prefix with `/kalkulator2026`.
**Warning signs:** 404 on export click.

---

## Code Examples

### KPI Aggregation DAL

```typescript
// Source: Prisma docs aggregate() + project pattern from containers.ts
// src/lib/dal/dashboard.ts
import "server-only";
import { prisma } from "@/lib/db";
import { requireAuth } from "./auth";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from "date-fns";

export async function getDashboardKpis() {
  await requireAuth(); // all users see dashboard
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const next7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    quotationsThisWeek,
    revenueThisWeek,
    containersInTransit,
    upcomingDeliveries,
    recentActivity,
  ] = await Promise.all([
    prisma.quotation.count({
      where: { createdAt: { gte: weekAgo } },
    }),
    prisma.quotation.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: weekAgo }, status: { not: "draft" } },
    }),
    prisma.container.count({ where: { status: "in_transit" } }),
    prisma.domesticDelivery.findMany({
      where: { etaDate: { gte: now, lte: next7days }, status: { not: "cancelled" } },
      orderBy: { etaDate: "asc" },
      take: 5,
      select: { id: true, name: true, supplier: true, etaDate: true, status: true },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return {
    quotationsThisWeek,
    revenueThisWeek: Number(revenueThisWeek._sum.totalAmount ?? 0),
    containersInTransit,
    upcomingDeliveries,
    recentActivity,
  };
}
```

### Notification Unread Count Route Handler

```typescript
// Source: Next.js App Router Route Handler pattern
// src/app/api/notifications/unread-count/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = Number(session.user.id);

  const count = await prisma.notificationRead.count({
    // count notifications the user has NOT read
    // use raw for efficiency
  });
  // Simpler: use $queryRaw matching kalkulator2025 pattern
  const rows = await prisma.$queryRaw<[{ cnt: bigint }]>`
    SELECT COUNT(*) as cnt
    FROM notifications n
    WHERE (n.target_type = 'all'
           OR EXISTS (SELECT 1 FROM notification_recipients nr WHERE nr.notification_id = n.id AND nr.user_id = ${userId}))
      AND (n.expires_at IS NULL OR n.expires_at > NOW())
      AND NOT EXISTS (
        SELECT 1 FROM notification_reads nr2
        WHERE nr2.notification_id = n.id AND nr2.user_id = ${userId}
      )
  `;
  return NextResponse.json({ data: { total: Number(rows[0].cnt) } });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| kalkulator2025: PHP proxy to Node.js for sales KPIs | kalkulator2026: Direct Prisma queries from Server Components | Phase 6 | Eliminates PHP/Node proxy layer; quotation data lives in MySQL |
| Dashboard: static placeholder page | Full KPI + chart dashboard | Phase 6 | Core user-facing feature |
| kalkulator2025: polling via setInterval in jQuery | kalkulator2026: useEffect + setInterval in Client Component | Phase 6 | Same pattern, modern React |
| kalkulator2025: `notifications` table existed | kalkulator2026: needs DB migration to create it | Phase 6 start | Must add to 06-DB-MIGRATION.sql |

**Deprecated/outdated for this phase:**
- kalkulator2025 `dashboard-sales.php` proxy to Node.js 3001: not needed — kalkulator2026 queries MySQL directly via Prisma.
- kalkulator2025 `user_widget_preferences` table (separate from `user_widget_permissions`): replicate the notification preference columns as a new Prisma model in Phase 6 schema.

---

## Open Questions

1. **Does `packer_live_stats` table actually exist in the production allbag_kalkulator DB connected by kalkulator2026?**
   - What we know: Confirmed present in kalkulator2025 DB backup (2026-01-19). Both apps use the same `allbag_kalkulator` MySQL database.
   - What's unclear: Whether there are recent records (it's populated by a cron job in kalkulator2025's Node.js server).
   - Recommendation: Add Prisma model + read-only DAL. If table is empty or doesn't exist at runtime, show "Brak danych" gracefully.

2. **Should the main dashboard show quotation-based revenue or Subiekt GT sales data?**
   - What we know: kalkulator2025 proxied to a Node.js server that queried Subiekt GT MSSQL for real sales orders. kalkulator2026 has `mssql` installed but no Subiekt sales DAL yet.
   - What's unclear: Whether the product owner expects Subiekt-sourced sales on the main dashboard or is satisfied with quotation-based revenue as a proxy.
   - Recommendation: Use quotation data for Phase 6 (it's what exists). Flag in plan that Subiekt GT sales integration is a future enhancement.

3. **Should `user_widget_preferences` / notification preferences be a new DB table or JSON in User model?**
   - What we know: kalkulator2025 had a `user_widget_preferences` table with individual columns per preference. UserWidgetPermission model exists but is for widget visibility, not notification prefs.
   - What's unclear: Scope of preferences for Phase 6 (password + notification types only?).
   - Recommendation: For Phase 6, store notification prefs (notify_deliveries, notify_features, notify_system) as a new `UserNotificationPreference` Prisma model / table. Simpler than adding JSON blobs.

---

## Sources

### Primary (HIGH confidence)
- Prisma schema.prisma (project file) — confirmed table structure, all existing models
- C:/xampp/htdocs/kalkulator2025/api/notifications/ — confirmed notifications schema and polling approach
- C:/xampp/htdocs/kalkulator2025/.auto-claude/.../database.sql — confirmed `notifications`, `notification_reads`, `packer_live_stats` table DDL
- package.json (project file) — confirmed recharts NOT installed, xlsx 0.20.3 installed, date-fns 4.1.0 installed
- Prisma docs: https://www.prisma.io/docs/orm/prisma-client/using-raw-sql — $queryRaw for time-series grouping
- Prisma docs: https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing

### Secondary (MEDIUM confidence)
- WebSearch: Recharts + Next.js 15 App Router — confirmed `"use client"` requirement, Server→Client prop pattern, ResponsiveContainer usage
- WebSearch: SheetJS Route Handler pattern — confirmed `XLSX.write(wb, {type:"buffer"}) → Response` pattern, verified against official docs
- WebSearch: Prisma $queryRaw DATE_FORMAT GROUP BY — confirmed limitation of Prisma native groupBy(), verified $queryRaw approach
- Dave Gray post: https://www.davegray.codes/posts/how-to-download-xlsx-files-from-a-nextjs-route-handler — SheetJS export pattern
- SheetJS official: https://docs.sheetjs.com/docs/demos/static/nextjs/ — Next.js integration

### Tertiary (LOW confidence)
- NotificationBell polling interval of 30s — based on kalkulator2025 PHP comment "polling every 30 seconds"; reasonable but not empirically validated for this app's scale.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json (existing) and npm (recharts version)
- Architecture patterns: HIGH — confirmed from existing project code patterns (containers.ts, activity-log.ts, container-analytics.tsx)
- Data sources / KPI mapping: HIGH — confirmed from schema.prisma
- Notifications schema: HIGH — confirmed from kalkulator2025 DB backup
- Packer stats: MEDIUM — table confirmed in backup, availability in live DB unknown
- Dead stock heuristic: MEDIUM — no dedicated table, SQL approach is reasonable but not validated against real data
- Pitfalls: HIGH — all based on confirmed project code patterns

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable — Next.js 15, Recharts 3.x, Prisma 6 are all stable releases)
