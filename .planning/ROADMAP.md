# Roadmap: ALLBAG Kalkulator 2026

## Overview

ALLBAG Kalkulator 2026 replaces the fragmented kalkulator2025 system (4 separate React/Vite apps + PHP backend) with a unified Next.js 15 App Router application featuring the Aether futuristic design system. The roadmap progresses from infrastructure and authentication through core commerce modules (products, pricing, quotations), logistics (containers, deliveries), analytics, and finally extended business modules (CRM, HR, email campaigns, AI tools). Each phase delivers a coherent, verifiable capability that builds on the previous, following the hard dependency chain: Auth > Products > Pricing > Quotations > Containers > Dashboard > Extended Modules.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation, Auth & System Shell** - Next.js 15 infrastructure, Auth.js v5 with RBAC, Aether design tokens, XAMPP deployment, AetherShell layout, user/system management (completed 2026-03-23)
- [x] **Phase 2: Product Management** - Full product CRUD with categories, images, Excel import, Subiekt GT sync, bulk operations -- the first feature module proving all architectural patterns (completed 2026-03-23)
- [x] **Phase 3: Pricing Engine** - Price list management with margin matrices, automatic price calculation, visual margin editor (completed 2026-03-23)
- [ ] **Phase 4: Quotations & Invoicing** - Quotation builder with PDF/email export, invoice creation with PDF export, label printing -- the primary revenue workflow
- [x] **Phase 5: Containers & Deliveries** - China import container tracking with status pipeline, domestic delivery management, delivery calendar, documents and labels (completed 2026-03-23)
- [ ] **Phase 6: Dashboard & Analytics** - Main dashboard with KPI cards and charts, sales analytics, paczkarnia stats, warehouse dashboard, report exports
- [ ] **Phase 7: CRM & Accounts Receivable** - Customer management, sales pipeline, B2B portal, brand protection, overdue payments dashboard, payment reminders
- [ ] **Phase 8: HR, Email Campaigns & AllTask** - Employee management, time tracking, email campaign builder with SendGrid, AllTask SSO integration
- [ ] **Phase 9: AI Console, Tradewatch & Kreator** - AI chatbot with business data context, competitor price monitoring, product mockup canvas tool

## Phase Details

### Phase 1: Foundation, Auth & System Shell
**Goal**: Users can log in to a working Next.js 15 application with the Aether design system, see role-appropriate navigation, and admins can manage users and permissions -- all deployed on XAMPP behind Apache ProxyPass
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, SYST-01, SYST-02, SYST-03, SYST-04
**Success Criteria** (what must be TRUE):
  1. User can register with an access code, log in with email/password, and stay logged in across browser refreshes (7-day session)
  2. User can reset a forgotten password via an email link
  3. Admin sees admin navigation and pages; regular user sees only their permitted pages (RBAC enforced at DAL level, not just middleware)
  4. Admin can create/edit/delete users, assign roles, manage page-level permissions, and create access codes for registration
  5. System logs all user activity and admin can view the audit log in the admin panel
  6. User can use the notepad feature from the sidebar
  7. The application loads at /kalkulator2026 via Apache ProxyPass with Aether dark theme (glassmorphism, neon accents, correct fonts) applied consistently across all pages
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Next.js 15 scaffold, Prisma schema, Auth.js v5 split config, Aether theme tokens, deployment config
- [ ] 01-02-PLAN.md — Auth pages (login, register, forgot/reset password), app shell (sidebar + topbar), RBAC navigation
- [ ] 01-03-PLAN.md — Admin panels (users, permissions, access codes, audit log), notepad feature

### Phase 2: Product Management
**Goal**: Users can browse, search, and filter the full product catalog; admins can manage products through CRUD, bulk operations, Excel import, and Subiekt GT synchronization
**Depends on**: Phase 1
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06, PROD-07
**Success Criteria** (what must be TRUE):
  1. User can browse the product list with search, column sorting, pagination, and filters by category/group
  2. Admin can create, edit, and delete products with all fields (name, SKU, description, purchase price) and assign them to categories/product groups
  3. Admin can upload product images (stored in MinIO) and see them displayed in the product detail view
  4. Admin can import products from an Excel file and see them appear in the product list
  5. Admin can sync products from Subiekt GT and perform bulk edit/delete operations on selected products
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Prisma schema extension (db pull + 5 product models), MinIO S3Client singleton, Subiekt GT MSSQL singleton, product DAL + Server Actions + Zod schemas (completed 2026-03-23)
- [ ] 02-02-PLAN.md — Product list page (TanStack Table + URL-state pagination/search/filters + row selection), product create/edit forms, categories/groups management
- [ ] 02-03-PLAN.md — Image upload (MinIO presigned PUT URLs), Excel import (SheetJS Route Handler), Subiekt GT sync page, bulk operations completion

### Phase 3: Pricing Engine
**Goal**: Admins can configure price lists with margin matrices so that the system automatically calculates sale prices; users can view their assigned price list
**Depends on**: Phase 2
**Requirements**: PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05
**Success Criteria** (what must be TRUE):
  1. Admin can create price lists for different customer groups and assign them names/descriptions
  2. Admin can set margins in the visual price_list x product_group matrix editor and see sale prices auto-calculated from purchase prices
  3. User can view the price list assigned to them with correct calculated prices
  4. Admin can clone an existing price list and bulk-edit margins across the cloned copy
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Prisma schema extension (PriceList, PriceListMargin, User.priceListId), DAL (price-lists.ts), Server Actions, Zod schemas, TypeScript types (completed 2026-03-23)
- [x] 03-02-PLAN.md — Price list admin pages (list, create, detail + margin matrix editor, clone dialog), user "my price list" view, admin user price list assignment (completed 2026-03-23)

### Phase 4: Quotations & Invoicing
**Goal**: Users can build quotations from products and price lists, export them as PDF, send via email, and manage their quotation history; admins can create invoices and print labels
**Depends on**: Phase 3
**Requirements**: QUOT-01, QUOT-02, QUOT-03, QUOT-04, QUOT-05, QUOT-06, FACT-01, FACT-05, FACT-06, FACT-07
**Success Criteria** (what must be TRUE):
  1. User can create a quotation by selecting products, and prices are automatically populated from the appropriate price list
  2. Each quotation receives a unique sequential number in the format WYC-YYYY-##### and can be duplicated to create a new quotation
  3. User can export a quotation to a professionally formatted PDF and send it to a customer via email directly from the system
  4. User can browse and filter their quotation history by date, status, and customer
  5. Admin can create VAT invoices, export them to PDF, and browse/filter the invoice history
  6. Admin can print shipping labels for orders
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — Prisma models (Quotation, QuotationItem, Invoice, InvoiceItem), DAL, Server Actions, Zod schemas, email utility extension, next.config.ts update, DB migration SQL
- [ ] 04-02-PLAN.md — Quotation builder UI (3-step wizard), quotation list/history page, quotation detail with PDF export, email send, and duplicate actions
- [ ] 04-03-PLAN.md — Invoice CRUD pages, invoice PDF Route Handler, shipping labels print page

### Phase 5: Containers & Deliveries
**Goal**: Admins can track China import containers through their full lifecycle and manage domestic deliveries; users can see a unified delivery calendar
**Depends on**: Phase 2
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, CONT-08, DELV-01, DELV-02, DELV-03, DELV-04
**Success Criteria** (what must be TRUE):
  1. Admin can create containers with number, carrier, and ETA; then track their status through the pipeline (in_transit > at_port > unloaded > completed)
  2. Admin can add products to a container, upload documents (stored in MinIO), and generate Chinese labels for container items
  3. System displays a countdown to ETA for each container and sends email notifications about status changes
  4. Admin can view container analytics showing total value, on-time percentage, and cost breakdowns
  5. Admin can create and track domestic deliveries with status management
  6. Users see a unified delivery calendar showing both China containers and domestic deliveries
  7. Admin can sync delivery data with Subiekt GT
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — Prisma schema (6 models), SQL migration, container + delivery DAL + Server Actions + Zod schemas + types, sendContainerStatusEmail, navigation entries
- [ ] 05-02-PLAN.md — Container list page, container create form, container detail (items editor, document upload, Chinese labels, ETA countdown, notify dialog), presigned upload route
- [ ] 05-03-PLAN.md — Container analytics stats panel, domestic deliveries CRUD UI, unified delivery calendar (date-fns monthly grid), Subiekt GT sync with schema discovery

### Phase 6: Dashboard & Analytics
**Goal**: Users see a data-rich main dashboard with KPI cards, charts, and activity feeds; admins access detailed analytics for sales, warehouse, and packing operations
**Depends on**: Phase 4, Phase 5
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, ANAL-01, ANAL-02, ANAL-03, ANAL-04, ANAL-05, ANAL-06
**Success Criteria** (what must be TRUE):
  1. User sees a main dashboard with KPI cards (sales, orders, deliveries), trend charts (weekly, monthly), recent activity feed, and upcoming deliveries/containers
  2. User sees a real-time notification badge in the top navigation and can manage account settings (password, preferences)
  3. Admin can view the sales analytics dashboard with revenue breakdowns, top products, top customers, and year-over-year / week-over-week comparisons
  4. Admin can view paczkarnia analytics (packer efficiency, queue status) and warehouse dashboard (stock levels, dead stock report, returns)
  5. Admin can export any analytics report to Excel
**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md — Prisma models (Notification, NotificationRead, NotificationRecipient, PackerLiveStat), DB migration SQL, dashboard DAL (getDashboardKpis, getWeeklyTrend, getActivityFeed, getUpcomingDeliveries), analytics DAL (getSalesAnalytics, getYoYComparison, getWoWComparison, getPackerStats, getDeadStock), notifications DAL + Server Actions, user settings Server Actions
- [ ] 06-02-PLAN.md — Main dashboard page (KPI cards, Recharts trend chart, activity feed, upcoming widget), notification bell in topbar (30s polling), user account settings page (/settings/account)
- [ ] 06-03-PLAN.md — Admin analytics pages (sales with WoW/YoY, paczkarnia, warehouse/dead stock), Excel export Route Handler (SheetJS, 4 report types)

### Phase 7: CRM & Accounts Receivable
**Goal**: Admins can manage customer relationships through a full CRM pipeline and handle overdue payment collection through the windykacja module
**Depends on**: Phase 4
**Requirements**: CRM-01, CRM-02, CRM-03, CRM-04, CRM-05, CRM-06, WIND-01, WIND-02, WIND-03, WIND-04
**Success Criteria** (what must be TRUE):
  1. Admin can manage a customer database (create, edit, delete, search) and view a complete customer profile with interaction history
  2. Admin can manage the sales pipeline with stages and values, generate leads, and reactivate dormant customers
  3. System offers a B2B portal where customers can browse their assigned price list and place orders
  4. Admin can view brand protection monitoring alerts
  5. Admin sees the overdue payments dashboard with aging buckets and can create/send payment reminder emails
  6. Admin can generate collection documents (PDF) and track the status of collection cases
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD
- [ ] 07-03: TBD

### Phase 8: HR, Email Campaigns & AllTask
**Goal**: Admins can manage employees and track work hours, run email marketing campaigns, and users can seamlessly access AllTask with SSO
**Depends on**: Phase 1
**Requirements**: HR-01, HR-02, HR-03, EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04, TASK-01, TASK-02, TASK-03
**Success Criteria** (what must be TRUE):
  1. Admin can manage employee records (CRUD) and view/edit work hour entries per employee
  2. Admin can generate HR reports (hours worked, absences) and export them
  3. Admin can create email campaigns with recipient lists and design email content using a rich text editor
  4. System sends campaigns via SendGrid/Nodemailer and admin can see campaign analytics (sent, opened)
  5. User can navigate to AllTask via SSO from the main navigation without re-authenticating
  6. Top navigation shows a badge with the count of incomplete AllTask tasks (via SSE) and the main dashboard shows a "My Tasks" widget
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD
- [ ] 08-03: TBD

### Phase 9: AI Console, Tradewatch & Kreator
**Goal**: Users can interact with an AI assistant in the context of business data, admins can monitor competitor prices, and admins can create product mockups on a canvas
**Depends on**: Phase 6
**Requirements**: AI-01, AI-02, AI-03, TRADE-01, TRADE-02, KREA-01, KREA-02
**Success Criteria** (what must be TRUE):
  1. User can chat with an AI assistant (Claude/OpenAI) that has context about the business data and can answer questions using natural language queries (NL to SQL)
  2. System persists AI conversation history and user can browse/continue previous conversations
  3. Admin can set up competitor price monitoring rules and receives alerts when prices cross defined thresholds
  4. Admin can create product mockups on a canvas and export designs to PNG and PDF
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 > 2 > 3 > 4 > 5 > 6 > 7 > 8 > 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation, Auth & System Shell | 3/3 | Complete   | 2026-03-23 |
| 2. Product Management | 3/3 | Complete   | 2026-03-23 |
| 3. Pricing Engine | 2/2 | Complete   | 2026-03-23 |
| 4. Quotations & Invoicing | 2/3 | In Progress|  |
| 5. Containers & Deliveries | 3/3 | Complete   | 2026-03-23 |
| 6. Dashboard & Analytics | 0/3 | Not started | - |
| 7. CRM & Accounts Receivable | 0/3 | Not started | - |
| 8. HR, Email Campaigns & AllTask | 0/3 | Not started | - |
| 9. AI Console, Tradewatch & Kreator | 0/2 | Not started | - |
