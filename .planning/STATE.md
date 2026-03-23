# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** Jeden zunifikowany system obsługujący cały cykl biznesowy ALLBAG -- z nowoczesnym Aether UI, szybki i przyjemny w codziennym użyciu
**Current focus:** Phase 1: Foundation, Auth & System Shell

## Current Position

Phase: 1 of 9 (Foundation, Auth & System Shell)
Plan: 1 of 3 in current phase
Status: In Progress
Last activity: 2026-03-23 - Completed plan 01-01: Foundation Bootstrap (Next.js scaffold, Prisma schema, Auth.js v5, Aether tokens)

Progress: [█░░░░░░░░░] 4%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 13 min
- Total execution time: 0.2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-auth-and-system-shell | 1/3 | 13 min | 13 min |

**Recent Trend:**
- Last 5 plans: 13 min
- Trend: -

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

### Pending Todos

None yet.

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
Stopped at: Completed 01-foundation-auth-and-system-shell/01-01-PLAN.md
Resume file: None
