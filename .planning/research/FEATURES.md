# Feature Research: ALLBAG Kalkulator 2026

**Domain:** Enterprise SaaS Admin Panel for Import/Distribution Company (Poland)
**Researched:** 2026-03-23
**Confidence:** MEDIUM-HIGH (strong domain evidence from multiple sources; some Poland-specific items are LOW confidence due to limited English-language sources)

---

## Feature Landscape

### 1. Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken. Grouped by module.

#### 1.1 Authentication & Access Control

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Email/password login with bcrypt | Every enterprise app has this | LOW | Already in kalkulator2025; migrate to NextAuth v5 Credentials provider |
| Role-Based Access Control (RBAC) | Enterprise users need permission boundaries; admin vs user vs viewer | MEDIUM | Map existing `user_permissions` table; use middleware-level guards on App Router |
| Password reset via email | Table stakes for any auth system | LOW | SendGrid integration already exists |
| Session management with JWT/cookie | Users expect persistent sessions across tabs | LOW | NextAuth v5 handles this natively with `auth()` server function |
| Registration with access codes | ALLBAG-specific: controlled onboarding for internal users | LOW | Existing pattern; code-gated registration prevents public signups |
| Activity logging / audit trail | Enterprise compliance requirement; who did what, when | MEDIUM | Log all CRUD operations to `activity_logs` table; display in admin panel |

**UX Best Practice:** Login page should load in <1s. Use skeleton loading for auth state checks. Show role-specific navigation immediately after auth -- never show menu items users cannot access (RBAC-driven nav, not hidden-behind-click).

#### 1.2 Product Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Product CRUD with categories | Core of any distribution business system | MEDIUM | Products table with category hierarchy; support parent/child categories |
| SKU management | Distribution companies identify everything by SKU | LOW | Unique constraint; auto-generation option |
| Product images (multiple per product) | Visual identification critical for physical goods | MEDIUM | MinIO storage already in place; implement image gallery with drag-to-reorder |
| Excel import/export | Bulk operations are non-negotiable for 1000+ product catalogs | MEDIUM | Use `xlsx` or `exceljs` library; validate before import; show preview with error highlighting |
| Product search with filters | Finding products fast is daily workflow | MEDIUM | Server-side search with debounced input; filter by category, status, price range |
| Inventory levels / stock display | Distribution = inventory; users need to see what is in stock | LOW | Read from Subiekt GT sync or direct DB; show stock badges (in stock / low / out) |
| Barcode/EAN support | Standard in wholesale/distribution for scanning and labeling | LOW | Store EAN-13 field; generate barcode images for labels |

**UX Best Practice:** Product list should use server-side paginated data table (25 rows default). Sticky header with search bar. Column sorting on name, SKU, price, stock, category. Quick-view side panel on row click showing full product details without page navigation. Bulk select + bulk actions (delete, change category, export). Zebra striping for readability in dense tables.

#### 1.3 Quotation / Pricing System (CPQ-lite)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Quotation builder with line items | Core business process: build quotes for clients from product catalog | HIGH | Builder interface: select products, set quantities, apply margins, add notes per line |
| Auto-numbering (WYC-YYYY-#####) | Professional quotation tracking and reference | LOW | Sequential counter per year; store in DB |
| Price list management with margin matrices | Distribution companies use tiered pricing by customer group | HIGH | `price_list x product_group` matrix; visual editor for margin percentages |
| PDF export of quotations | Clients expect professional PDF documents | MEDIUM | Use `@react-pdf/renderer` or server-side `puppeteer`; branded template with ALLBAG logo |
| Email quotation to client | Send directly from system without copy-paste | LOW | SendGrid integration; attach PDF; track sent status |
| Quotation status tracking | Draft -> Sent -> Accepted / Rejected / Expired | LOW | Status enum with timestamps; color-coded badges in list view |
| Quotation duplication | Sales reps frequently base new quotes on existing ones | LOW | Deep-copy quotation with items; reset status to draft |
| Currency display (PLN) | Polish market: all prices in PLN with proper formatting | LOW | Format: `1 234,56 zl` (space as thousands separator, comma as decimal, Polish locale) |

**UX Best Practice:** Quotation builder should feel like a spreadsheet -- inline editing of quantities and prices. Auto-calculate totals in real-time. Drag-to-reorder line items. Sticky totals bar at bottom. Use Command+K or similar command palette for quick product search when adding items. Show margin % alongside each line item so reps can see profitability at a glance.

#### 1.4 Container Delivery Tracking (China Import)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Container list with status tracking | Core business: importing from China in containers | MEDIUM | Status pipeline: Ordered -> Loaded -> In Transit -> At Port -> Customs -> Delivered |
| ETA tracking and display | Knowing when goods arrive is critical for planning | LOW | Manual ETA entry initially; display countdown/days remaining |
| Container items / content list | What is in each container, linked to products | MEDIUM | Join table `container_items` linking containers to products with quantities |
| Document management per container | Customs docs, invoices, packing lists | MEDIUM | File upload (MinIO) attached to container; categorize by doc type |
| Label generation | Physical labels for container contents | MEDIUM | Template-based label generation; PDF output for printing |
| Status change notifications | Team needs to know when container status changes | LOW | Trigger notification on status update; show in notification center |

**UX Best Practice:** Container list as a Kanban board with columns for each status (drag to change status), OR as a timeline view showing all containers on a horizontal timeline with ETA markers. Dashboard card showing "X containers in transit, next arrival in Y days". Map visualization is a differentiator (see below), not table stakes.

#### 1.5 Domestic Deliveries

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Delivery CRUD with status tracking | Track domestic shipments to customers | LOW | Simpler than container tracking; status: Preparing -> Shipped -> Delivered |
| Link to orders/quotations | Know which delivery fulfills which order | LOW | Foreign key to quotation or order |
| Delivery scheduling | Plan when deliveries go out | LOW | Date picker with calendar view |

#### 1.6 Main Dashboard

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| KPI cards (revenue, orders, containers, overdue) | Executive summary at a glance | MEDIUM | 4-6 KPI cards at top; real-time from DB queries; compare to previous period |
| Activity feed | See recent actions across the system | LOW | Read from `activity_logs`; show last 20 actions with user, action, timestamp |
| Charts (revenue trend, top products, delivery status) | Visual analytics are baseline for any dashboard | MEDIUM | Line chart for revenue trend (weekly/monthly); bar chart for top 10 products; donut for container statuses |
| Notification center | Users need to see what requires their attention | MEDIUM | Bell icon with badge count; dropdown with unread notifications; mark as read |
| Quick actions | Shortcuts to most common tasks | LOW | "New Quotation", "New Product", "Check Containers" buttons |

**UX Best Practice:** Follow the 5-second rule -- user should understand business health within 5 seconds. KPI cards at top with sparklines showing trend. Use 3-5 KPI cards, not 10+. Group dashboard into sections: Overview, Sales, Logistics, Tasks. Allow widget reordering but ship with sensible defaults. Dark theme (Aether) works well for dashboards -- use neon accent colors for attention on important metrics.

#### 1.7 Invoicing

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Invoice CRUD (Faktura VAT) | Legal requirement for Polish business transactions | HIGH | Must comply with Polish Faktura VAT format: NIP, date, items with VAT rates (23%, 8%, 5%, 0%, ZW) |
| **KSeF integration** | **MANDATORY from April 2026 for all businesses** | **CRITICAL** | FA(3) XML schema; KSeF API for submission/retrieval; QR code generation; this is a legal compliance deadline |
| JPK_VAT compatibility | Tax reporting requirement; invoices must feed JPK reports | HIGH | Include KSeF invoice number in JPK records; support JPK_V7M format |
| PDF generation | Paper/PDF still needed for B2C and offline reference | MEDIUM | Branded PDF matching FA(3) schema content |
| Invoice numbering | Sequential, legally compliant numbering per year/month | LOW | Format: FV/YYYY/MM/##### or similar; no gaps allowed |
| VAT rate management | Different products have different VAT rates in Poland | LOW | Product-level VAT rate field; auto-calculate net/gross |
| Proforma invoices | Pre-payment invoices common in wholesale/import | LOW | Same format as invoice but marked "Proforma"; does not go to KSeF |
| Credit notes (Korekta) | Corrections to issued invoices | MEDIUM | Must reference original invoice; submit to KSeF as correction |

**CRITICAL NOTE on KSeF:** Poland mandates e-invoicing via KSeF from 1 Feb 2026 for large taxpayers (>PLN 200M revenue) and from **1 April 2026 for all other businesses**. ALLBAG almost certainly falls into the April 2026 mandate. This is not optional -- it is a legal requirement. FA(3) XML schema, API integration, QR codes, and authentication (qualified e-seal or KSeF certificate) are all required. Penalties are deferred until Jan 2027 but the submission requirement is live from April 2026. **This should be a Phase 1-2 priority.**

**UX Best Practice:** Invoice form should pre-fill from quotation data. Show net/VAT/gross breakdown in real-time as items are added. Validate NIP (Polish tax ID) format on input. Show KSeF submission status badge on each invoice (Submitted / Accepted / Rejected / Pending). Provide one-click "Send to KSeF" action.

#### 1.8 Basic Analytics

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Sales trends (weekly, monthly, YoY) | Standard business intelligence | MEDIUM | Line charts with period comparison; aggregate from invoices/quotations |
| Top products / categories report | Know what sells | LOW | Bar chart; sortable table with revenue, quantity, margin |
| Revenue by customer | Know who your best customers are | LOW | Ranked list; link to CRM/customer profile |
| Export to Excel | Everyone wants to take data into their own spreadsheets | LOW | CSV/XLSX export button on every report |

#### 1.9 User Management (Admin)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User CRUD | Admin needs to manage team accounts | LOW | List, create, edit, deactivate users |
| Role assignment | Control who can do what | LOW | Assign roles from predefined set; UI for permission matrix |
| User activity history | See what each user has been doing | LOW | Filter activity log by user |

---

### 2. Differentiators (Competitive Advantage)

Features that set ALLBAG Kalkulator apart from generic ERP/admin tools. These make it feel like a purpose-built system rather than a generic panel.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Aether Dark Theme UI** | Futuristic, polished design differentiates from ugly ERP interfaces; makes daily use enjoyable | MEDIUM | Glassmorphism, neon accents, Framer Motion animations; this IS the brand |
| **AI Console (Claude/OpenAI chat)** | In-app AI assistant for data queries, document drafting, analysis | HIGH | Chat interface; context-aware (can reference products, quotations); use tool-calling for structured queries |
| **Container tracking map visualization** | See containers on a world map with real-time position approximation | MEDIUM | Use Leaflet/Mapbox; plot route China->Poland with estimated position based on ETA |
| **Paczkarnia analytics (packing line performance)** | Unique to ALLBAG: track packing team efficiency, queue depth, throughput | MEDIUM | Custom dashboard for warehouse/packing operations; worker-level metrics |
| **Quotation margin calculator with "what-if" scenarios** | Sales reps can instantly see how margin changes affect profitability | MEDIUM | Slider/input for margin %; real-time recalculation of all line items; compare scenarios side-by-side |
| **Smart notifications with priority** | AI-categorized notifications: urgent (overdue payment) vs info (container status) | LOW | Priority levels; smart grouping; snooze capability |
| **Command palette (Cmd+K)** | Power user navigation: search anything, jump to any page, execute actions | MEDIUM | Global search across products, quotations, customers, containers; action shortcuts |
| **Tradewatch (competitive price monitoring)** | Track competitor prices for key products; alert on significant changes | HIGH | Web scraping or API integration; store price history; show trends and alerts |
| **Kreator (canvas/design tool)** | Create marketing materials, product images, banners in-app | HIGH | Canvas editor (Fabric.js or Konva.js); templates; export PNG/PDF |
| **Email campaign builder** | Send newsletters and campaigns to customer lists without leaving the app | HIGH | Template builder; recipient lists; SendGrid integration; open/click analytics |
| **Drag-and-drop quotation builder** | Visually construct quotations by dragging products from catalog | MEDIUM | More intuitive than spreadsheet-style; appeals to non-technical users |
| **Real-time collaboration indicators** | See who else is viewing/editing the same quotation or product | MEDIUM | WebSocket presence indicators; prevents conflicts |
| **Customizable dashboard widgets** | Users can arrange their own dashboard layout | MEDIUM | Drag-and-drop widget grid; save per-user layout preferences |
| **B2B portal for customers** | Self-service ordering portal where ALLBAG's customers can browse products, see their pricing, place orders, track deliveries | HIGH | Separate auth context; customer-specific pricing from price lists; order history; 83% of B2B buyers prefer self-service |
| **Subiekt GT deep integration** | Two-way sync: products, stock, invoices, orders between Kalkulator and Subiekt GT | HIGH | Use Sfera API or direct MSSQL connection; real-time or scheduled sync; conflict resolution |

#### Differentiator UX Patterns

- **Command Palette:** Trigger with Cmd+K (Mac) / Ctrl+K (Windows). Search across all entities. Show recent actions. Support keyboard navigation. This single feature dramatically improves power user productivity.
- **Dark Theme Excellence:** The Aether theme is itself a differentiator. Most ERPs are ugly. A polished dark theme with glassmorphism, spring animations (Framer Motion), and thoughtful micro-interactions makes ALLBAG Kalkulator feel premium and modern.
- **AI Console:** Position as "ask your data anything". Natural language queries like "Jaki byl przychod w styczniu?" (What was January revenue?) that translate to DB queries. Use Claude API with function calling to query the database safely.

---

### 3. Anti-Features (Commonly Requested, Often Problematic)

Features to explicitly NOT build in v1. Some may be appropriate for v2+.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Full ERP replacement** | "Why not replace Subiekt GT entirely?" | Subiekt GT handles accounting, ZUS, PIT, full Polish tax compliance -- rebuilding this is 2+ years of work and regulatory risk | Keep Subiekt GT for accounting/tax; sync data bidirectionally; Kalkulator is the operational frontend |
| **Real-time everything via WebSocket** | "All data should update live" | Massive complexity for marginal benefit on most screens; creates scaling issues; most admin panel data doesn't change every second | Use WebSocket only where it matters: notifications, chat (AllTask), collaboration indicators. Use SWR/React Query with smart revalidation for everything else |
| **Mobile native app** | "We need iOS/Android apps" | Doubles development effort; admin panels are data-heavy and work poorly on small screens; usage is primarily desktop | Build responsive web first; PWA for mobile access to specific features (notifications, container status check). Native mobile is a v3 concern |
| **Custom report builder (drag-and-drop)** | "Let users build any report they want" | Incredibly complex to build well; most users cannot build useful reports; becomes a support burden | Provide 10-15 pre-built reports covering 90% of needs; add Excel export for custom analysis; consider Metabase embed for advanced users in v2 |
| **Multi-language support (i18n)** | "What if we expand internationally?" | ALLBAG is a Polish company with Polish users; i18n adds complexity to every string, form, and validation | Build in Polish only. Use Polish date formats (DD.MM.YYYY), PLN currency, Polish UI strings. If international expansion happens, add i18n then |
| **Full payroll processing** | "HR module should handle payroll" | Polish payroll is extremely complex (ZUS contributions, PIT calculations, health insurance, civil law contracts vs employment); this is regulated territory | HR module tracks employees, hours, and basic reporting. Payroll stays in dedicated software (Subiekt Rachmistrz, Comarch Optima, or similar) |
| **Full accounting module** | "We should handle bookkeeping" | Polish accounting standards (UoR) require certified software; building this is regulatory quicksand | Sync invoices to Subiekt GT or accounting software; Kalkulator handles operational data, not the general ledger |
| **Offline mode** | "What if internet goes down?" | Admin panel runs on local XAMPP server; "offline" means the server is down, which breaks everything anyway | Ensure local server reliability (PM2 auto-restart); the deployment model (XAMPP on local network) already provides LAN-level availability |
| **Complex workflow engine** | "Let admins define custom approval workflows" | Over-engineering for a 10-20 user company; becomes unmaintainable | Hardcode the 2-3 approval workflows needed (quotation approval, invoice approval); make thresholds configurable |
| **AI-generated quotations** | "AI should auto-generate quotes based on customer history" | Pricing errors in quotations have direct financial impact; AI hallucinations are unacceptable here | AI can SUGGEST products and pre-fill templates based on history, but a human must review and approve every quotation |
| **Blockchain/NFT anything** | Sometimes requested in tech modernization projects | Zero business value for an import/distribution company | Do not build |
| **Video conferencing integration** | "Built-in video calls for sales" | Solved problem (Teams, Meet, Zoom); building this adds no value | Link to external meeting tools if needed |

---

### 4. Module-Specific Deep Dives

#### 4.1 CRM Module

**Table Stakes for Distribution CRM:**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Customer/company profiles | Central record of who you sell to | MEDIUM | Company name, NIP, address, contact persons, payment terms |
| Contact management | Multiple contacts per company | LOW | Name, email, phone, role; link to company |
| Interaction history | Log calls, emails, meetings | LOW | Timeline of interactions per customer |
| Sales pipeline (Kanban) | Visualize deal stages | MEDIUM | Columns: Lead -> Contacted -> Quotation -> Negotiation -> Won/Lost |
| Customer notes | Free-text notes per customer | LOW | Rich text editor; timestamped entries |

**CRM Differentiators:**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Lead reactivation alerts | Notify when dormant customer might be ready to re-engage | MEDIUM | Track last order date; alert after configurable period of inactivity |
| Customer scoring | Rank customers by revenue, order frequency, payment reliability | MEDIUM | Calculated score; display as badge on customer profile |
| Integration with quotation system | See all quotations for a customer in their profile | LOW | Foreign key lookup; embedded table in customer detail view |

#### 4.2 Windykacja (Debt Collection / AR)

**Table Stakes:**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Overdue invoice dashboard | See all unpaid invoices past due date | MEDIUM | Aging buckets: 1-30, 31-60, 61-90, 90+ days; color-coded |
| Payment reminder automation | Send email reminders on schedule | MEDIUM | Configurable reminder schedule (e.g., 7 days before due, on due date, 7/14/30 days after) |
| DSO tracking | Days Sales Outstanding -- key AR metric | LOW | Calculate from invoice/payment data; show trend |
| Customer payment history | See payment patterns per customer | LOW | Timeline of invoices + payments; highlight late payments |
| Overdue amount by customer | Prioritize collection by customer | LOW | Sorted list; total overdue per customer |

**UX Best Practice:** Aging chart should use red gradient (darker = more overdue). Top debtors list with total overdue amount. One-click "send reminder" button per invoice. Show customer payment reliability score alongside overdue amount to help prioritize.

#### 4.3 HR Module

**Table Stakes:**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Employee directory | List all employees with basic info | LOW | Name, position, department, contact, start date |
| Work hours tracking | Log daily hours; required by Polish labor law | MEDIUM | Time entry per day; support for overtime tracking; monthly summary |
| Leave/absence management | Track vacation, sick days, other absences | MEDIUM | Calendar view; balance tracking; approval workflow (simple: request -> approve/reject) |
| Basic reporting | Monthly hours report per employee | LOW | Exportable to Excel for payroll processing |

**Polish Labor Law Requirements (2025-2026):**
- Precise attendance records and working hour logs are mandatory
- Overtime must be tracked separately (Polish law limits: 150 hours/year standard, up to 416 with agreement)
- Remote work compliance tracking (since 2023 Labor Code reform)
- **Pay transparency:** From Dec 2025, salary ranges must be documented; from June 2026, gender pay gap reporting for companies with 250+ employees
- Digital personnel files are increasingly required
- BHP (occupational health and safety) training tracking

**Anti-Features for HR:**
- Do NOT build payroll processing (ZUS, PIT calculations) -- use dedicated Polish payroll software
- Do NOT build recruitment/ATS -- not core to distribution business
- Do NOT build performance review system in v1 -- manual process is fine for <50 employees

#### 4.4 AllTask (Task Management)

**Note:** AllTask already exists as a separate FastAPI+React application. The plan is iframe/SSO integration, not a rebuild.

**Integration Features Needed:**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| SSO bridge | Single sign-on between Kalkulator and AllTask | MEDIUM | Share auth token or implement OAuth2 bridge; user logs in once |
| Iframe embed | Display AllTask within Kalkulator's layout | LOW | Responsive iframe with proper sizing; match dark theme if possible |
| Notification bridging | AllTask notifications appear in Kalkulator's notification center | MEDIUM | WebSocket or polling from AllTask API; unified notification display |
| Deep linking | Link from Kalkulator entities to AllTask tasks | LOW | URL scheme for task references |

**If building task features natively (future):**
- Kanban board with customizable columns
- Task assignment to team members
- Due dates with reminders
- Task comments / chat thread
- File attachments

#### 4.5 Email Campaigns

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Template builder | Visual email editor | HIGH | Drag-and-drop blocks; responsive preview; save templates |
| Recipient list management | Manage who receives campaigns | MEDIUM | Import from CRM; segment by criteria; exclude unsubscribed |
| Send via SendGrid | Reliable delivery | LOW | Already integrated; use SendGrid Marketing API |
| Basic analytics | Open rates, click rates | LOW | Use SendGrid webhooks for tracking events |
| Unsubscribe handling | Legal requirement (GDPR) | LOW | One-click unsubscribe link; honor preferences |

#### 4.6 Tradewatch (Price Monitoring)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Competitor price tracking | Monitor key product prices across competitor sites | HIGH | Web scraping or API; store price history; run on schedule |
| Price change alerts | Notify when competitor changes price significantly | MEDIUM | Threshold-based alerts; configurable per product |
| Price history charts | Visualize price trends over time | LOW | Line chart per product; compare own price vs competitors |
| Product matching | Map own SKUs to competitor products | MEDIUM | Manual mapping initially; fuzzy matching as differentiator |

---

## Feature Dependencies

```
Authentication & RBAC
    |-- (required by all other modules)
    |
    |-- Product Management
    |       |-- Quotation System (needs products to quote)
    |       |       |-- PDF Export (needs quotation data)
    |       |       |-- Email sending (needs quotation + PDF)
    |       |       |-- CRM Pipeline (quotations link to deals)
    |       |
    |       |-- Price List Management (needs product groups)
    |       |       |-- Quotation System (uses price lists for auto-pricing)
    |       |
    |       |-- Container Tracking (containers contain products)
    |       |       |-- Label Generation (needs container items)
    |       |       |-- Document Management (attached to containers)
    |       |
    |       |-- Inventory Display (product stock levels)
    |       |       |-- Subiekt GT Sync (source of truth for stock)
    |       |
    |       |-- Tradewatch (monitors prices for products)
    |
    |-- Invoicing
    |       |-- KSeF Integration (mandatory for invoice submission)
    |       |-- JPK Reporting (needs invoice data)
    |       |-- Windykacja/AR (tracks overdue invoices)
    |       |       |-- Payment Reminders (needs overdue data)
    |       |
    |       |-- Quotation System (invoice from accepted quotation)
    |
    |-- Dashboard
    |       |-- (aggregates data from Products, Quotations, Invoices, Containers)
    |       |-- Analytics (deeper drill-down from dashboard)
    |
    |-- CRM
    |       |-- Customer Profiles (base for CRM)
    |       |-- Quotation History (per customer)
    |       |-- Invoice History (per customer)
    |       |-- Pipeline (needs customer + quotation)
    |
    |-- HR Module (independent; only needs auth)
    |
    |-- AllTask Integration (independent; only needs auth for SSO)
    |
    |-- Email Campaigns (needs CRM recipient lists)
    |
    |-- AI Console (needs access to all data for queries)
    |
    |-- B2B Portal (needs Products, Price Lists, Customer Auth)
```

### Dependency Notes

- **Products are the foundation:** Almost every module depends on product data. Products must be built first and be stable before other modules can reference them.
- **Quotations depend on Products + Price Lists:** The quotation builder needs both a product catalog and margin/pricing rules to function.
- **Invoicing depends on Quotations (partially):** Invoices can be created standalone, but the ideal flow is quotation-to-invoice conversion. KSeF integration is time-critical (April 2026 deadline).
- **Dashboard aggregates everything:** Build it incrementally as modules come online. Start with placeholder widgets, populate as data becomes available.
- **CRM is enhanced by but not blocked by other modules:** Can start with basic customer profiles and progressively link quotation/invoice/delivery history.
- **HR and AllTask are independent:** Can be built in parallel with core business modules.
- **B2B Portal is a late-stage feature:** Requires mature Products, Price Lists, and Customer management.
- **AI Console needs data to be useful:** Build after core modules have real data flowing through them.

---

## MVP Definition

### Launch With (v1 -- Phase 1-3)

Minimum viable product: the features needed to replace kalkulator2025's core functionality.

- [ ] **Authentication + RBAC** -- cannot use the system without this
- [ ] **Product Management** (CRUD, categories, SKU, images, Excel import) -- foundation for everything
- [ ] **Price List Management** with margin matrices -- daily business operation
- [ ] **Quotation Builder** with PDF export and email -- primary revenue-generating workflow
- [ ] **Container Tracking** with status pipeline and item lists -- core logistics operation
- [ ] **Domestic Deliveries** basic tracking -- daily operations
- [ ] **Main Dashboard** with KPI cards and key charts -- executive visibility
- [ ] **Invoicing with KSeF integration** -- **legal deadline April 2026**
- [ ] **Notification center** -- keep team informed
- [ ] **User management** -- admin capability
- [ ] **Aether dark theme** applied consistently -- this is the brand identity, not a "nice to have"

### Add After Validation (v1.x -- Phase 4-5)

Features to add once core is working and users are migrated from kalkulator2025.

- [ ] **CRM module** (customer profiles, pipeline, interaction history) -- trigger: when sales team requests structured customer tracking
- [ ] **Windykacja / AR module** (overdue dashboard, payment reminders) -- trigger: when accounts receivable becomes a visible pain point
- [ ] **Sales Analytics** (trends, YoY comparison, top products) -- trigger: when enough data exists for meaningful analysis (1-2 months of data)
- [ ] **HR module** (employee directory, time tracking, leave management) -- trigger: when current HR process becomes bottleneck
- [ ] **AllTask SSO integration** -- trigger: when users complain about separate logins
- [ ] **Subiekt GT sync** (products, stock, orders) -- trigger: when manual data entry between systems becomes unbearable
- [ ] **Command palette (Cmd+K)** -- trigger: when power users request faster navigation

### Future Consideration (v2+)

Features to defer until core product is stable and validated.

- [ ] **B2B Customer Portal** -- requires mature product catalog and pricing; significant standalone project
- [ ] **AI Console** -- needs substantial data in the system to be useful
- [ ] **Email Campaign Builder** -- can use external tools (SendGrid Marketing) in the meantime
- [ ] **Tradewatch (price monitoring)** -- complex scraping infrastructure; use manual tracking initially
- [ ] **Kreator (canvas tool)** -- nice differentiator but not core business; use Canva/Figma in the meantime
- [ ] **Paczkarnia analytics** -- niche module; needs warehouse process to be well-defined first
- [ ] **Real-time collaboration** -- WebSocket infrastructure adds complexity; defer until multi-user editing is a real pain point

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Deadline Pressure |
|---------|------------|---------------------|----------|-------------------|
| Authentication + RBAC | HIGH | LOW | **P0** | None (but blocks everything) |
| Product Management | HIGH | MEDIUM | **P0** | None (but blocks everything) |
| Quotation Builder | HIGH | HIGH | **P1** | None |
| Price List Management | HIGH | MEDIUM | **P1** | None |
| **Invoicing + KSeF** | **HIGH** | **HIGH** | **P1** | **April 2026 legal deadline** |
| Container Tracking | HIGH | MEDIUM | **P1** | None |
| Main Dashboard | HIGH | MEDIUM | **P1** | None |
| Domestic Deliveries | MEDIUM | LOW | **P1** | None |
| Notification Center | MEDIUM | MEDIUM | **P1** | None |
| User Management | MEDIUM | LOW | **P1** | None |
| Aether Theme System | HIGH | MEDIUM | **P1** | None (but defines brand) |
| CRM Module | MEDIUM | MEDIUM | **P2** | None |
| Windykacja / AR | MEDIUM | MEDIUM | **P2** | None |
| Sales Analytics | MEDIUM | MEDIUM | **P2** | None |
| HR Module | MEDIUM | MEDIUM | **P2** | None |
| AllTask SSO | LOW | MEDIUM | **P2** | None |
| Subiekt GT Sync | HIGH | HIGH | **P2** | None |
| Command Palette | MEDIUM | LOW | **P2** | None |
| B2B Portal | HIGH | HIGH | **P3** | None |
| AI Console | MEDIUM | HIGH | **P3** | None |
| Email Campaigns | LOW | HIGH | **P3** | None |
| Tradewatch | LOW | HIGH | **P3** | None |
| Kreator | LOW | HIGH | **P3** | None |
| Paczkarnia Analytics | LOW | MEDIUM | **P3** | None |

**Priority key:**
- **P0:** Must have before anything else works (foundation)
- **P1:** Must have for launch (core business operations + legal compliance)
- **P2:** Should have, add in subsequent phases
- **P3:** Nice to have, future consideration

---

## Polish Localization Requirements

### Currency & Number Formatting
- Currency: PLN (Polish Zloty)
- Format: `1 234,56 zl` (thin space or regular space as thousands separator, comma as decimal separator)
- Negative amounts: `-1 234,56 zl`
- Use `Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' })` for consistent formatting

### Date & Time Formatting
- Format: `DD.MM.YYYY` (e.g., `23.03.2026`)
- Time: 24-hour format (`14:30`, not `2:30 PM`)
- Date-time: `23.03.2026, 14:30`
- Use `date-fns` with `pl` locale or `Intl.DateTimeFormat('pl-PL')`
- Week starts on Monday (ISO standard, Polish convention)

### Address Format
```
Nazwa firmy
ul. Nazwa Ulicy 123/4
00-000 Miasto
Polska
NIP: 1234567890
```

### Tax Identifiers
- **NIP** (Numer Identyfikacji Podatkowej): 10-digit tax ID; validate format with checksum algorithm
- **REGON**: 9 or 14-digit statistical ID
- **KRS**: Company registration number (for larger entities)

### Legal Document Requirements
- Invoices (Faktura VAT): Must include seller NIP, buyer NIP, sequential number, date of issue, date of delivery, itemized list with VAT rates, net/VAT/gross totals
- Quotations: Should include validity period, payment terms, delivery terms
- All monetary values in PLN unless explicitly agreed otherwise

### Polish ERP Integration Patterns
- **Subiekt GT** (InsERT): MSSQL database; Sfera API for automations; most common small-business ERP in Poland
- **JPK (Jednolity Plik Kontrolny / SAF-T):** Standardized audit file; XML format; monthly submission (JPK_V7M)
- **KSeF:** National e-invoicing system; FA(3) XML schema; API integration mandatory from April 2026
- **GUS BIR1 API:** Verify company data (NIP, REGON) against government registry; free API
- **ZUS (social security):** Not directly relevant to Kalkulator, but HR module should track employee data needed for ZUS declarations

### UI Language
- All UI strings in Polish (no i18n in v1)
- Error messages in Polish
- Tooltips and help text in Polish
- Date picker shows Polish day/month names

---

## Competitor Feature Analysis

| Feature | Generic ERP (Subiekt/Optima) | Custom Admin (kalkulator2025) | ALLBAG Kalkulator 2026 |
|---------|------------------------------|-------------------------------|------------------------|
| Product management | Robust but ugly UI | Basic CRUD, fragmented across 4 apps | Unified, modern UI with rich media |
| Quotation system | Basic or via add-on | Custom builder, works well | Enhanced builder with margin calculator |
| Container tracking | Not available | Custom built, functional | Enhanced with visual timeline/map |
| Analytics | Basic reports | Separate dashboards per app | Unified analytics with drill-down |
| Invoicing | Excellent (core feature) | Basic, sends to Subiekt | Full with KSeF integration |
| CRM | Not available (separate product) | Basic customer data | Integrated pipeline + scoring |
| UI/UX | Dated, Windows-era | React+Vite, but fragmented | Aether dark theme, unified SPA |
| Price monitoring | Not available | Basic manual tracking | Automated Tradewatch |
| AI features | Not available | Not available | AI Console for queries + suggestions |
| B2B portal | Not available | Not available | Self-service ordering (v2) |
| Mobile access | Limited | Responsive but inconsistent | PWA-ready responsive design |

---

## UX Patterns Reference (Enterprise Admin Best Practices 2025-2026)

### Data Tables
- Server-side pagination (25 rows default; options: 10, 25, 50)
- Sticky header with search bar
- Column sorting with visual indicators (chevron arrows)
- Filter chips showing active filters
- Bulk select with action bar appearing at top
- Row hover reveals quick actions (edit, delete, view)
- Quick-view side panel on row click (not full page navigation)
- Zebra striping for readability
- Frozen first/last columns on horizontal scroll
- URL state preservation (page, sort, filters in query params)
- Column show/hide customization
- Empty state with helpful message and action button

### Forms
- Inline validation on blur (not on every keystroke)
- Clear error messages in Polish, positioned below the field
- Auto-save drafts for long forms (quotation builder, invoice editor)
- Sticky submit button bar for long forms
- Confirmation dialog for destructive actions
- Pre-fill from related data (invoice from quotation)
- Keyboard navigation (Tab through fields, Enter to submit)

### Dashboards
- KPI cards at top (3-5 max)
- Sparklines in KPI cards showing 7-day trend
- Charts: line for trends, bar for comparisons, donut for composition
- No pie charts with >4 segments
- No 3D chart effects
- Progressive disclosure: summary -> drill-down
- Section grouping with clear labels
- Follow the 5-second rule (main message visible immediately)

### Navigation
- Sidebar navigation (collapsible)
- Breadcrumbs for nested pages
- Command palette (Cmd+K) for power users
- Active state clearly indicated on current page
- Badge counts on menu items for pending actions
- Module grouping in sidebar (Business, Logistics, Analytics, Settings)

### Notifications
- Bell icon with unread count badge
- Dropdown with recent notifications
- Mark as read / mark all as read
- Click to navigate to relevant entity
- Priority indicators (color-coded)
- Sound/desktop notification for urgent items (optional)

### Dark Theme Specifics (Aether)
- Background: near-black (#080812, #0a0a1e)
- Text: high contrast white/light gray on dark backgrounds
- Accents: electric blue (#6366f1), cyan (#06b6d4), purple (#8b5cf6)
- Glassmorphism panels: `backdrop-blur-xl`, semi-transparent borders (`border-white/10`)
- Status colors: green for success, amber for warning, red for error, blue for info
- Charts: use accent colors for data series; avoid pure white chart backgrounds
- Hover states: subtle glow effects rather than background color changes
- Focus rings: accent-colored for accessibility

---

## Sources

### Enterprise Admin & Dashboard UX
- [Admin Dashboard UI/UX Best Practices 2025](https://medium.com/@CarlosSmith24/admin-dashboard-ui-ux-best-practices-for-2025-8bdc6090c57d) - MEDIUM confidence
- [Enterprise UX Design 2026](https://www.wearetenet.com/blog/enterprise-ux-design) - MEDIUM confidence
- [Enterprise UI Design 2026](https://hashbyt.com/blog/enterprise-ui-design) - MEDIUM confidence
- [Data Table UX Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables) - HIGH confidence
- [Dashboard Design UX Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards) - HIGH confidence
- [Enterprise Table UX Design Best Practices](https://www.denovers.com/blog/enterprise-table-ux-design) - MEDIUM confidence
- [AI Design Patterns for Enterprise Dashboards](https://www.aufaitux.com/blog/ai-design-patterns-enterprise-dashboards/) - MEDIUM confidence

### CPQ / Quotation Management
- [CPQ Best Practices - NetSuite](https://www.netsuite.com/portal/resource/articles/crm/cpq-best-practices.shtml) - HIGH confidence
- [Top CPQ Features for Distributors 2025](https://www.bettercommerce.io/blog/top-cpq-features-for-distributors-and-manufacturers) - MEDIUM confidence
- [CPQ Guide - ForteNext](https://www.fortenext.com/insights/a-guide-to-cpq-solutions-deploying-configure-price-quote) - MEDIUM confidence

### Container Tracking & Logistics
- [Best Container Tracking Software 2025 - Shipsgo](https://blog.shipsgo.com/the-best-container-tracking-platforms-in-2024/) - MEDIUM confidence
- [Terminal49 Container Tracking](https://terminal49.com/) - MEDIUM confidence
- [GoComet Container Tracking](https://www.gocomet.com/container-tracking-software) - MEDIUM confidence

### Polish Invoicing & KSeF
- [E-Invoicing Poland KSeF Guide - Marosa](https://marosavat.com/vat-news/e-invoicing-poland-guide-ksef) - HIGH confidence
- [Poland Mandatory B2B E-Invoicing - EDICOM](https://edicomgroup.com/blog/poland-will-make-b2b-electronic-invoicing-mandatory) - HIGH confidence
- [Poland Signs KSeF Law - EY](https://www.ey.com/en_gl/technical/tax-alerts/poland-signs-into-law-mandatory-national-e-invoicing-system) - HIGH confidence
- [KSeF Implementing Regulations - KPMG](https://kpmg.com/us/en/taxnewsflash/news/2025/12/poland-implementing-regulations-national-e-invoicing-system-ksef.html) - HIGH confidence
- [Invoicing in Poland 2025 - PolishTax](https://polishtax.com/invoicing-in-poland-2025-vat-ksef-and-the-road-to-mandatory-e-invoicing/) - HIGH confidence
- [Poland KSeF Mandate - VATupdate](https://www.vatupdate.com/2025/11/26/poland-ksef-e-invoicing-mandate-a-comprehensive-guide/) - MEDIUM confidence

### Subiekt GT / Polish ERP
- [Subiekt GT Integration - Alumio](https://www.alumio.com/platforms/subiekt-gt) - MEDIUM confidence
- [Subiekt GT Guide - ProsteIT](https://prosteit.pl/en/gt-subiekt-for-companies/) - MEDIUM confidence
- [Subiekt GT Overview - ITH](https://ith.eu/en/blog/subiekt-gt-warehouse-and-trade-system-for-small-and-medium-sized-companies/) - MEDIUM confidence
- [Subiekt GT Limitations - LinkerCloud](https://linkercloud.com/blog/erp/overcoming-subiekt-gts-limitations-a-linker-cloud-solution) - MEDIUM confidence

### CRM for Distribution
- [Best CRM for Wholesale Distribution 2025 - SimplyDepo](https://simplydepo.com/industry/best-crm-for-wholesale-distribution-trends-features/) - MEDIUM confidence
- [Enterprise CRM Guide - monday.com](https://monday.com/blog/crm-and-sales/enterprise-crm/) - MEDIUM confidence
- [B2B Customer Portal Guide 2025 - WizCommerce](https://wizcommerce.com/blog/b2b-customer-portal/) - MEDIUM confidence

### Distribution KPIs & Analytics
- [Distribution KPIs 2025 - insightsoftware](https://insightsoftware.com/blog/distribution-kpis-and-metric-examples/) - HIGH confidence
- [Sales KPIs 2025 - Revenue Velocity Lab](https://optif.ai/media/articles/sales-metrics-dashboard-15-kpis/) - MEDIUM confidence

### Accounts Receivable
- [AR Dashboard - LeanPay](https://www.leanpay.io/en/features/accounts-receivable-dashboard) - MEDIUM confidence
- [Debt Collection Software 2025 - Kolleno](https://www.kolleno.com/top-12-best-debt-collection-software-of-2025-features-reviews/) - MEDIUM confidence

### Polish Labor Law
- [Employment Compliance Poland 2025 - Bizky](https://bizky.ai/blog/employment-compliance-in-poland-2025-guide-for-employers/) - MEDIUM confidence
- [Polish Employment Law Guide 2025 - Bizky](https://bizky.ai/blog/polish-employment-law/) - MEDIUM confidence
- [Pay Transparency Poland 2025 - RSM](https://www.rsm.global/poland/en/insights/hr-payroll/employers-obligations-under-pay-transparency-directive) - HIGH confidence

### Price Monitoring
- [Top Price Monitoring Tools 2026 - MetricsCart](https://metricscart.com/insights/best-price-monitoring-tools/) - MEDIUM confidence
- [Price Intelligence 2025 - Impact Analytics](https://www.impactanalytics.co/blog/price-intelligence) - MEDIUM confidence

---
*Feature research for: Enterprise SaaS Admin Panel -- Import/Distribution (ALLBAG)*
*Researched: 2026-03-23*
