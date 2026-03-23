# Project Research Summary

**Project:** ALLBAG Kalkulator 2026
**Domain:** Enterprise SaaS Admin Panel for Import/Distribution Business (Poland)
**Researched:** 2026-03-23
**Confidence:** MEDIUM-HIGH

## Executive Summary

ALLBAG Kalkulator 2026 is a full-stack enterprise admin panel replacing the fragmented kalkulator2025 system (4 separate React+Vite apps) with a unified Next.js 15 App Router application. The system manages the complete operational workflow of a Polish import/distribution company: product catalog, quotation building with margin matrices, container tracking from China, invoicing with legally mandated KSeF integration, CRM, HR, analytics, and more. The recommended approach uses Next.js 15.5.11 with React 19, Prisma 6 introspecting an existing shared MySQL database, Auth.js v5 for credentials-based authentication, Tailwind CSS 4 with a custom dark glassmorphism "Aether" design system built on shadcn/ui, and TanStack Query + Zustand for client-side state management. The entire system deploys on a local XAMPP Windows server behind Apache reverse proxy with PM2 process management.

The strongest recommendation from research is to adopt a strict layered architecture with a Data Access Layer (DAL) as the authoritative security boundary. CVE-2025-29927 proved that middleware-only authentication in Next.js is a critical vulnerability. Every database query must verify user permissions at the DAL level, not just at the routing layer. The architecture follows a "server-first with client islands" pattern where Server Components handle data fetching and Client Components are pushed to leaf nodes for interactivity only. This approach minimizes JavaScript sent to the browser and keeps sensitive data on the server.

The primary risks are threefold. First, the shared MySQL database between the legacy PHP backend and the new Next.js app creates a dual-write hazard -- Prisma migrations must never run, and schema changes require manual coordination. Second, Poland's KSeF e-invoicing mandate took effect April 1, 2026 (for most businesses), making invoicing with KSeF integration a time-critical legal compliance feature that should be prioritized in early phases. Third, deploying Next.js on Windows XAMPP behind Apache introduces non-standard configuration (basePath, ProxyPass, PM2 on Windows, Prisma path issues) that requires careful Phase 1 setup to avoid cascading problems.

## Key Findings

### Recommended Stack

The stack centers on Next.js 15.5.11 (pinned, not latest 16.x) with React 19.0.4, TypeScript 5.9.3, and Node.js 22.x LTS. This version combination is deliberately conservative: the ecosystem (Auth.js, Prisma adapters, shadcn/ui) stabilized against Next.js 15, and upgrading to 16 introduces breaking changes without meaningful benefit for this project. Prisma 6.19.2 provides type-safe database access via `db pull` introspection of the existing MySQL schema, with an optional Rust-free Query Compiler for 3.4x performance on large result sets.

**Core technologies:**
- **Next.js 15.5.11 (App Router):** Full-stack framework with Server/Client Components, Server Actions, streaming SSR, Turbopack dev server. Pinned to 15.x for ecosystem stability.
- **Prisma 6.19.2 + MySQL 8:** ORM with `db pull` introspection for the existing 20+ table schema. Never migrate -- PHP shares this database.
- **Auth.js v5 (next-auth@beta):** Credentials provider with bcryptjs for existing password hashes. JWT session strategy. Split config pattern for Edge middleware compatibility.
- **Tailwind CSS 4.2.2 + shadcn/ui CLI v4:** CSS-first `@theme` configuration for Aether design tokens. shadcn/ui provides accessible component primitives with full code ownership.
- **TanStack Query 5 + Zustand 5:** Server state caching (Query) and client UI state (Zustand) with strict separation -- server data never enters Zustand.
- **TanStack Table 8 + Recharts 3:** Headless data tables with full styling control and composable chart components for the dashboard.
- **react-hook-form 7 + Zod 4:** Performant uncontrolled forms with shared validation schemas between client and server.
- **Motion 12 (formerly Framer Motion):** Spring physics animations for the Aether design system. Client components only.

### Expected Features

**Must have (table stakes -- P0/P1):**
- Authentication + RBAC (blocks everything else)
- Product Management (CRUD, categories, SKU, images, Excel import/export)
- Price List Management with margin matrices (daily business operation)
- Quotation Builder with PDF export and email (primary revenue workflow)
- Invoicing with KSeF integration and JPK compatibility (legal deadline: April 2026)
- Container Tracking with status pipeline (core logistics operation)
- Domestic Deliveries basic tracking
- Main Dashboard with KPI cards and charts
- Notification center
- User management
- Aether dark theme applied consistently (brand identity, not optional)

**Should have (P2 -- add after core validation):**
- CRM module (customer profiles, sales pipeline, interaction history)
- Windykacja / Accounts Receivable (overdue dashboard, payment reminders)
- Sales Analytics (trends, YoY, top products)
- HR module (employee directory, time tracking, leave management)
- AllTask SSO integration
- Subiekt GT bidirectional sync
- Command palette (Cmd+K)

**Defer (P3 -- v2+):**
- B2B Customer Portal (significant standalone project)
- AI Console (needs data to be useful)
- Email Campaign Builder (use SendGrid Marketing meanwhile)
- Tradewatch price monitoring (complex scraping infrastructure)
- Kreator canvas tool (use Canva/Figma meanwhile)
- Paczkarnia analytics (niche, needs defined warehouse process)
- Real-time collaboration (WebSocket complexity for marginal benefit)

### Architecture Approach

The architecture follows a strict layered monolith pattern optimized for Next.js 15 App Router: thin route pages that compose Server Components, a Data Access Layer (DAL) as the authoritative security and data boundary, Server Actions for internal mutations, and Route Handlers for external REST API (PHP bridge, Subiekt GT, future mobile). Route groups separate `(auth)` (minimal login layout) from `(dashboard)` (full app shell with sidebar/topbar). The Aether design system wraps shadcn/ui primitives with glassmorphism styles in a `components/aether/` layer, keeping upstream components updatable.

**Major components:**
1. **Data Access Layer (`lib/dal/`)** -- Server-only module. Every function verifies `getCurrentUser()` permissions before returning filtered DTOs. Primary security boundary.
2. **Server Actions (`lib/actions/`)** -- Thin mutation endpoints. Validate with Zod, delegate to DAL. Exposed as POST endpoints (must include auth checks).
3. **Route Handlers (`app/api/v1/`)** -- Stable REST API for PHP bridge proxy, Subiekt GT webhooks, and external integrations. Share DAL with Server Actions.
4. **Aether Design System (`components/aether/`)** -- Token-driven glassmorphism components (GlassCard, GlowButton, DataTable, StatCard) built on shadcn/ui + Tailwind CSS 4 `@theme`.
5. **State Management** -- TanStack Query for server state caching, Zustand for client UI state. Zero overlap between the two.
6. **Auth System** -- Auth.js v5 with split config (`auth.config.ts` for Edge/middleware, `auth.ts` for Node.js/Prisma). Four-layer RBAC: middleware (optimistic) -> layout (guard) -> DAL (authoritative) -> Server Action (mutation guard).

### Critical Pitfalls

1. **Prisma Connection Pool Exhaustion (Phase 1)** -- Next.js hot reload creates new PrismaClient instances without closing old connections. Use the `globalThis` singleton pattern and limit dev connections to 3-5. The shared MySQL instance with PHP makes headroom critical (`max_connections >= 200`).

2. **Middleware Auth Bypass CVE-2025-29927 (Phase 1)** -- Attackers can bypass all middleware by sending `x-middleware-subrequest` header. Never rely solely on middleware for auth. Implement defense-in-depth via DAL pattern. Strip the header at Apache level as additional safeguard.

3. **NextAuth v5 bcrypt + Edge Runtime Incompatibility (Phase 1)** -- bcrypt cannot run in Edge Runtime. Must split auth config into Edge-safe `auth.config.ts` (callbacks only) and Node.js `auth.ts` (Credentials provider with bcryptjs). Most common Auth.js v5 migration blocker.

4. **Apache ProxyPass + basePath Mismatch (Phase 1)** -- Without `basePath: '/kalkulator2026'` in next.config.ts matching the Apache ProxyPass path, all static assets return 404. Page renders but appears completely unstyled. Also need WebSocket proxy for HMR in dev.

5. **PHP Bridge + Prisma Shared Database (All Phases)** -- Never run `prisma migrate` or `prisma db push`. Use `prisma db pull` only. The PHP backend is the schema authority. Dual-write requires optimistic concurrency with `updated_at` timestamps and a migration ledger tracking which endpoints are migrated.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Bootstrap
**Rationale:** Every other phase depends on auth, database connectivity, design system, and deployment infrastructure being correctly configured. The majority of critical pitfalls (7 out of 17) must be addressed here. Getting this wrong cascades into every subsequent phase.
**Delivers:** Working Next.js app deployed on XAMPP with auth, Prisma connected to existing MySQL, Aether theme initialized, Apache reverse proxy configured, PM2 running.
**Addresses:** Authentication + RBAC, Aether theme system, deployment infrastructure
**Avoids:** Prisma connection pool exhaustion, middleware auth bypass, bcrypt/Edge incompatibility, basePath mismatch, Windows path issues, Tailwind v4 dark mode breakage, NextAuth env var prefix change, PHP bridge schema coordination

### Phase 2: Design System and Core Patterns
**Rationale:** Before building features, the reusable component library and architectural patterns (DAL, Server/Client split, form handling) must be established and validated with a reference feature module. Products is the ideal first module because almost every other module depends on it.
**Delivers:** Complete Aether component library (GlassCard, DataTable, StatCard, PageHeader, Sidebar, forms), Products CRUD (the full vertical slice proving all patterns work), REST API for products
**Uses:** shadcn/ui + Tailwind 4 @theme, TanStack Table, react-hook-form + Zod, TanStack Query, Motion
**Implements:** DAL pattern, Server-first with Client Islands, Zustand + TanStack Query separation, Server Actions + Route Handlers hybrid
**Avoids:** Framer Motion RSC boundary issues, Tailwind v4 class renames, useFormStatus child component requirement

### Phase 3: Core Business Modules
**Rationale:** With Products proven, the remaining core business modules follow the same established patterns. Invoicing with KSeF is the most time-critical due to the April 2026 legal deadline and must be prioritized within this phase. Quotations and Price Lists are tightly coupled and should be built together.
**Delivers:** Quotation Builder with PDF export, Price List Management with margin matrices, Invoicing with KSeF/JPK integration, Container Tracking with status pipeline, Domestic Deliveries
**Addresses:** Primary revenue workflow (quotations), legal compliance (KSeF), core logistics (containers)
**Avoids:** Large Excel import blocking main thread (use worker threads), PDF generation failures on Windows (test on actual XAMPP server)

### Phase 4: Dashboard and Analytics
**Rationale:** Dashboard and analytics depend on data from Phases 2-3 being populated. Building them now means real data to visualize. The notification center also aggregates events from core modules.
**Delivers:** Main Dashboard with KPI cards and charts, Notification center, Sales analytics (trends, top products, revenue by customer), Packing line analytics (if warehouse process is defined)
**Uses:** Recharts for charts, TanStack Query for real-time refresh, Zustand for dashboard widget preferences
**Implements:** ISR with appropriate revalidation for dashboard pages, React `cache()` for expensive aggregation queries

### Phase 5: Extended Modules (Post-Validation)
**Rationale:** These modules add business value but are not blockers for replacing kalkulator2025. Build them after core modules are validated with real users. CRM and Subiekt GT sync have the highest user value in this tier.
**Delivers:** CRM module, Windykacja/AR, HR module, AllTask SSO integration, Subiekt GT sync, Command palette
**Addresses:** Customer relationship management, accounts receivable, employee management, ERP integration
**Avoids:** Over-building before user feedback; Subiekt GT sync needs careful background job architecture (not in request/response cycle)

### Phase 6: Differentiators and v2 Features
**Rationale:** These are the features that transform the app from a functional replacement into a competitive advantage. They require mature data and stable infrastructure. The B2B Portal is effectively a standalone project requiring its own auth context and customer-specific pricing.
**Delivers:** B2B Customer Portal, AI Console, Email Campaign Builder, Tradewatch, Kreator, real-time collaboration
**Addresses:** Self-service ordering, data intelligence, marketing automation, competitive intelligence

### Phase Ordering Rationale

- **Foundation first (Phase 1-2):** 12 of 17 identified pitfalls affect Phase 1-2. Architectural decisions made here (DAL pattern, auth split, design tokens) propagate through every subsequent phase. Cutting corners here creates compounding technical debt.
- **Products before Quotations:** Feature dependency graph shows Products are the foundation node. Quotations, Price Lists, Containers, and Tradewatch all depend on product data.
- **KSeF in Phase 3 (not later):** The April 2026 legal deadline is immovable. Even with penalty deferral to Jan 2027, the submission requirement is live. This cannot slip to Phase 4+.
- **Dashboard in Phase 4 (not Phase 1):** A dashboard without data is empty. Building it after core modules ensures meaningful KPIs from day one.
- **CRM in Phase 5 (not Phase 3):** CRM is enhanced by quotation/invoice/delivery data. Building it after those modules means richer customer profiles out of the box.
- **B2B Portal last:** Requires mature Products, Price Lists, and Customer management. Separate auth context. Effectively a standalone project.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Invoicing/KSeF):** KSeF integration requires FA(3) XML schema compliance, qualified e-seal/certificate authentication, QR code generation, and KSeF API interaction. Poland-specific domain with limited English-language documentation. Needs dedicated research-phase.
- **Phase 3 (Quotation Builder):** Complex interactive UI with inline editing, drag-to-reorder, real-time margin calculation, and "what-if" scenarios. The CPQ-lite pattern needs UX research specific to the product catalog structure.
- **Phase 5 (Subiekt GT Sync):** Bidirectional sync with Subiekt GT via Sfera API or direct MSSQL connection. Conflict resolution, background job architecture, and sync scheduling need dedicated research.
- **Phase 6 (B2B Portal):** Separate auth context, customer-specific pricing, self-service ordering. Significant standalone project needing its own research cycle.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented patterns for Next.js 15 setup, Auth.js v5, Prisma, Tailwind 4, XAMPP deployment. Research already provides code-level guidance.
- **Phase 2 (Design System + Products):** shadcn/ui + Tailwind 4 theming, CRUD modules, data tables -- all thoroughly documented. Follow patterns from Architecture research.
- **Phase 4 (Dashboard):** Recharts integration with shadcn/ui wrappers, KPI card patterns, standard analytics views. Well-established patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core package versions verified on npm. Version compatibility matrix documented. Clear rationale for each choice with alternatives considered. Only Auth.js v5 beta status is a minor uncertainty. |
| Features | MEDIUM-HIGH | Strong feature landscape from multiple domain sources. KSeF deadline verified via EY, KPMG, EDICOM. Polish localization requirements well-documented. Some Poland-specific ERP patterns (Subiekt GT API) are MEDIUM confidence. |
| Architecture | HIGH | Patterns verified against official Next.js docs, Auth.js guides, and multiple 2025-2026 community sources. DAL pattern directly informed by CVE-2025-29927 postmortem. Build order reflects hard dependencies. |
| Pitfalls | HIGH | 17 pitfalls identified with specific code-level prevention strategies. Phase mapping provided for each. Most verified across multiple independent sources. Recovery strategies documented. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **KSeF API integration details:** FA(3) XML schema structure, certificate authentication flow, and sandbox environment for testing need deeper research during Phase 3 planning. Polish-language documentation may be required.
- **Subiekt GT Sfera API:** Documentation is sparse in English. Actual API endpoints, authentication, and data models need research when Phase 5 approaches. Consider direct MSSQL connection as fallback.
- **MinIO server archival impact:** MinIO server repo was archived Feb 2026 but JS SDK remains maintained. Monitor for breaking changes. Evaluate migration to pure S3-compatible alternative if SDK maintenance stalls.
- **Auth.js v5 stable release:** Still in beta after 2+ years. API is stable but lack of a non-beta tag means potential for breaking changes in future betas. Pin to specific beta version (5.0.0-beta.30) and test upgrades carefully.
- **Zod 4 breaking changes from Zod 3:** Most tutorials and examples reference Zod 3.x. Zod 4 has breaking changes. Developers must use Zod 4 documentation specifically, not older tutorials.
- **Windows-specific deployment edge cases:** PM2 memory leaks on Windows, NTFS path length limits, and absence of native Windows service support for PM2 are documented but may surface additional issues. WSL fallback should be kept as option.
- **Network latency to remote MySQL (mail.allbag.pl):** If the database is not on the same LAN as the XAMPP server, network latency could significantly impact Server Component rendering. Needs verification and potential Redis caching layer.

## Sources

### Primary (HIGH confidence)
- Next.js 15 official docs (releases, basePath, standalone output, security blog)
- Tailwind CSS v4 docs (@theme directive, upgrade guide)
- Prisma 6 official docs (db pull, connection management, Query Compiler)
- Auth.js v5 migration guide and RBAC guide
- React 19 release blog (useFormStatus, Server Components)
- CVE-2025-29927 Vercel postmortem
- KSeF mandate sources (EY, KPMG, EDICOM, Marosa)
- Node.js release schedule

### Secondary (MEDIUM confidence)
- shadcn/ui changelog and Tailwind v4 integration docs
- TanStack Query SSR guide and TanStack Table npm
- Motion (Framer) upgrade guide
- PM2 documentation
- Community architecture patterns (Medium, MakerKit, dev.to)
- Polish labor law and invoicing requirement sources
- Subiekt GT integration guides (Alumio, ProsteIT)
- Enterprise UX pattern references (pencilandpaper.io)

### Tertiary (LOW confidence)
- MinIO JS SDK maintenance status (needs monitoring)
- Auth.js v5 stable release timeline (uncertain)
- Some exact package versions from WebSearch (verify on npm before installing)

---
*Research completed: 2026-03-23*
*Ready for roadmap: yes*
