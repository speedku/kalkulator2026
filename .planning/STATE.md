# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** Jeden zunifikowany system obsługujący cały cykl biznesowy ALLBAG -- z nowoczesnym Aether UI, szybki i przyjemny w codziennym użyciu
**Current focus:** Phase 2: Product Management — data layer complete, UI plans pending

## Current Position

Phase: 2 of 9 (Product Management)
Plan: 1 of 3 in current phase (02-01 complete)
Status: In Progress
Last activity: 2026-03-23 - Completed plan 02-01: Product Data Layer (Prisma schema, DAL, Server Actions, MinIO, Subiekt)

Progress: [████░░░░░░] 14%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 13 min
- Total execution time: 0.97 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-auth-and-system-shell | 3/3 | 34 min | 11 min |
| 02-product-management | 1/3 | 22 min | 22 min |

**Recent Trend:**
- Last 5 plans: 13 min, 8 min, 13 min, 22 min
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 9 phases derived from 85 v1 requirements. Auth+System in Phase 1, Products before Pricing before Quotations. Containers parallel to commerce chain (depends on Phase 2 only). Dashboard after data-producing phases.
- [Roadmap]: KSeF e-invoicing (FACT-02/03/04) deferred to v2 per REQUIREMENTS.md. FACT-01/05/06/07 (basic invoicing) stays in Phase 4.
- [Phase quick]: GitHub repo 'kalkulator2026' created as public under account 'speedku'; master branch used (not main); gh CLI single-command approach
- [Phase 01-foundation-auth-and-system-shell]: bcryptjs 3.0.3 used (vs planned 2.4.3) - backward compatible, same API; nodemailer@7 to satisfy @auth/core peer dep
- [Phase 01-foundation-auth-and-system-shell]: Auth.js v5 split config enforced: middleware.ts -> auth.config.ts (Edge-safe) only; auth.ts -> Prisma+bcryptjs (Node.js)
- [Phase 01-02]: @base-ui/react uses render prop (not asChild) for polymorphic components; TooltipTrigger uses render={<Link />} pattern
- [Phase 01-02]: SidebarNav server/client split: server fetches RBAC permissions, client handles interactivity (collapse, active, mobile overlay)
- [Phase 01-02]: Best-effort pattern for activity logging and emails — try/catch so auth flows never fail due to non-critical side effects
- [Phase 01-03]: getNoteVersionsAction server action wrapper: client components cannot import server-only DAL, use server actions as bridge
- [Phase 01-03]: deleteUser is soft delete only: isActive=false preserves FK integrity (activityLog, permissions, notes)
- [Phase 01-03]: Notepad version on every auto-save: complete history with version numbers, hashtag extraction, word/char count
- [Phase 01-03]: DataTable generic pattern: ColumnDef<T> with render prop established for reuse across all admin list pages
- [Phase 02-01]: prisma import (not db) — db.ts exports `prisma`, all DAL files use `import { prisma } from '@/lib/db'`
- [Phase 02-01]: Zod v4 uses result.error.issues (not .errors) — fixed across product actions
- [Phase 02-01]: prisma db pull skipped (placeholder creds) — 5 product models defined manually from confirmed kalkulator2025 schema
- [Phase 02-01]: Product soft delete pattern: isActive=false never hard delete (FK safety)

### Pending Todos

- Human verification of Phase 1 end-to-end (Task 3 of Plan 01-03)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Utwórz repozytorium GitHub kalkulator2026 i wypchnij projekt | 2026-03-23 | 66dbb83 | [1-utw-rz-repozytorium-github-kalkulator202](.planning/quick/1-utw-rz-repozytorium-github-kalkulator202/) |

### Blockers/Concerns

- DATABASE_URL in .env still has placeholder credentials - must be updated with real MySQL credentials before app can connect to mail.allbag.pl
- AUTH_SECRET must be generated and set before any auth flows work
- prisma db pull not yet run to validate schema against actual DB - do when DATABASE_URL is configured
- Shared MySQL database between PHP and Prisma: never run prisma migrate, use db pull only (still active)
- RESOLVED: bcrypt/Edge split - handled via Auth.js v5 split config pattern
- RESOLVED: basePath mismatch - basePath: /kalkulator2026 set in next.config.ts
- RESOLVED: Prisma connection pool exhaustion - globalThis singleton pattern implemented

## Session Continuity

Last session: 2026-03-23
Stopped at: Completed 02-product-management/02-01-PLAN.md
Resume file: None
