# Architecture Research

**Domain:** Enterprise SaaS Admin Panel (Next.js 15 App Router + Aether Design)
**Researched:** 2026-03-23
**Confidence:** HIGH (verified against official Next.js docs, Auth.js docs, Prisma docs, and multiple 2025-2026 community sources)

## System Overview

```
                        BROWSER (Client)
                             |
                    [Apache ProxyPass]
                    /kalkulator2026 -> :3001
                             |
    +========================|=========================+
    |                   NEXT.JS 15                     |
    |                                                  |
    |  +-----------+    +------------+   +-----------+ |
    |  | Middleware |    | proxy.ts   |   | Static    | |
    |  | (auth     |--->| (headers,  |   | Assets    | |
    |  |  gate)    |    |  rewrites) |   | /public   | |
    |  +-----+-----+    +------------+   +-----------+ |
    |        |                                         |
    |  +-----v-----------------------------------------+
    |  |            APP ROUTER                         |
    |  |                                               |
    |  |  +----------+  +-------------+  +-----------+ |
    |  |  | (auth)   |  | (dashboard) |  | api/      | |
    |  |  | Route    |  | Route       |  | Route     | |
    |  |  | Group    |  | Group       |  | Handlers  | |
    |  |  +----------+  +------+------+  +-----------+ |
    |  |                       |                       |
    |  +-----------------------|-----------------------+
    |                          |                        |
    |  +-----------------------v-----------------------+|
    |  |          SERVER COMPONENT LAYER               ||
    |  |  (RSC: layouts, pages, data fetching)         ||
    |  +------------------+----------------------------+|
    |                     |                             |
    |  +------------------v----------------------------+|
    |  |          DATA ACCESS LAYER (DAL)              ||
    |  |  lib/dal/*.ts  (server-only)                  ||
    |  |  - Auth checks (getCurrentUser)               ||
    |  |  - Authorization (canAccess*)                  ||
    |  |  - DTO shaping (return only safe fields)      ||
    |  +------------------+----------------------------+|
    |                     |                             |
    |  +------------------v----------------------------+|
    |  |          PRISMA CLIENT (singleton)            ||
    |  |  lib/db.ts  (globalThis pattern)              ||
    |  +------------------+----------------------------+|
    |                     |                             |
    +=====================|============================+
                          |
              +-----------v-----------+
              |      MySQL 8          |
              |   mail.allbag.pl      |
              |   (shared with PHP)   |
              +-----------------------+
                          |
    +-----------+---------+---------+-----------+
    |           |                   |           |
    | MinIO     | Redis             | PHP API   |
    | (images)  | (cache/sessions)  | (bridge)  |
    +-----------+-------------------+-----------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Middleware (`middleware.ts`) | Optimistic auth gate: redirect unauthenticated users to login, route protection matchers. NOT the sole security layer. | Auth.js v5 `auth()` wrapper, matcher config for `/(dashboard)` routes |
| Route Groups `(auth)` | Minimal centered layout for login/register/forgot-password. No sidebar, no nav. | Own `layout.tsx` with centered card, Aether glow background |
| Route Groups `(dashboard)` | Full app shell: sidebar, topbar, breadcrumbs, notifications. All authenticated routes. | Own `layout.tsx` with `<Sidebar>`, `<Topbar>`, `<main>{children}</main>` |
| Server Components | Data fetching, layout rendering, SEO. Default for all components in App Router. | Pages, layouts, data display components |
| Client Components (`'use client'`) | Interactivity: forms, modals, drag-and-drop, charts, animations. Pushed to leaf nodes. | Form components, Kanban board, chart widgets, motion-animated elements |
| Data Access Layer (DAL) | Authorization + data fetching. Every query checks `getCurrentUser()` permissions. Returns DTOs only. | `lib/dal/products.ts`, `lib/dal/quotations.ts`, etc. |
| Server Actions (`'use server'`) | Thin mutation endpoints. Validate input with Zod, delegate to DAL. | `lib/actions/products.ts` for create/update/delete |
| Route Handlers (`app/api/`) | External-facing REST API for PHP bridge, mobile future, Subiekt GT integration. | `app/api/v1/products/route.ts` with GET/POST/PUT/DELETE |
| Prisma Client | Database access singleton. Connection pooling for MySQL. | `lib/db.ts` using `globalThis` pattern |
| Auth.js v5 (NextAuth) | Authentication (Credentials provider), session management (JWT), RBAC callbacks. | `auth.ts` + `auth.config.ts` split for middleware compatibility |
| Zustand Stores | Client-only UI state: sidebar collapse, theme prefs, modal state, form drafts. | `stores/ui.ts`, `stores/quotation-builder.ts` |
| TanStack Query | Server state caching on client: list pagination, search, real-time data refresh. | `hooks/queries/use-products.ts`, `hooks/mutations/use-create-product.ts` |
| Aether Design System | Token-driven component library built on shadcn/ui + Tailwind CSS 4 `@theme`. | `components/ui/` (shadcn primitives), `components/aether/` (composed) |

## Recommended Project Structure

```
src/
├── app/                          # App Router (routing only, thin pages)
│   ├── (auth)/                   # Auth route group (no sidebar)
│   │   ├── layout.tsx            # Centered card layout, Aether glow bg
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── forgot-password/
│   │       └── page.tsx
│   ├── (dashboard)/              # Dashboard route group (full app shell)
│   │   ├── layout.tsx            # Sidebar + Topbar + main content
│   │   ├── page.tsx              # Dashboard home (KPI cards)
│   │   ├── products/
│   │   │   ├── page.tsx          # Product list (RSC)
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx      # Product detail
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx  # Product edit form
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   ├── loading.tsx       # Skeleton for product list
│   │   │   └── error.tsx         # Error boundary
│   │   ├── quotations/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx      # Quotation builder (heavy client)
│   │   ├── price-lists/
│   │   ├── containers/
│   │   ├── deliveries/
│   │   ├── analytics/
│   │   │   ├── sales/
│   │   │   └── packing/
│   │   ├── hr/
│   │   ├── debt-collection/
│   │   ├── campaigns/
│   │   ├── tradewatch/
│   │   ├── ai-console/
│   │   ├── creator/
│   │   ├── invoices/
│   │   ├── alltask/              # iframe embed with SSO bridge
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   ├── users/
│   │   │   └── permissions/
│   │   └── _components/          # Dashboard-specific shared components
│   │       ├── sidebar.tsx
│   │       ├── topbar.tsx
│   │       └── breadcrumbs.tsx
│   ├── api/                      # Route Handlers (external REST API)
│   │   └── v1/
│   │       ├── products/
│   │       │   └── route.ts      # GET (list), POST (create)
│   │       ├── products/[id]/
│   │       │   └── route.ts      # GET, PUT, DELETE
│   │       ├── quotations/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts  # Auth.js catch-all
│   │       └── bridge/           # PHP bridge proxy
│   │           └── [...path]/
│   │               └── route.ts
│   ├── layout.tsx                # Root layout (html, body, providers)
│   └── not-found.tsx
├── components/                   # Shared UI components
│   ├── ui/                       # shadcn/ui primitives (Button, Input, Dialog...)
│   ├── aether/                   # Aether design system composed components
│   │   ├── glass-card.tsx        # Glassmorphism card wrapper
│   │   ├── glow-button.tsx       # Neon accent button
│   │   ├── data-table.tsx        # Aether-styled data table
│   │   ├── stat-card.tsx         # KPI stat card with glow
│   │   ├── sidebar-nav.tsx       # Glass sidebar navigation
│   │   └── page-header.tsx       # Consistent page header
│   └── shared/                   # App-wide shared (not design system)
│       ├── providers.tsx         # All client providers wrapper
│       ├── theme-provider.tsx
│       └── query-provider.tsx
├── lib/                          # Server-side core (one-way: app -> lib)
│   ├── db.ts                     # Prisma singleton
│   ├── dal/                      # Data Access Layer (server-only)
│   │   ├── auth.ts               # getCurrentUser(), verifySession()
│   │   ├── products.ts           # getProducts(), getProductById()
│   │   ├── quotations.ts         # getQuotations(), getQuotationById()
│   │   ├── price-lists.ts
│   │   ├── containers.ts
│   │   ├── users.ts              # User management DAL
│   │   └── _shared.ts            # Shared DAL utilities (pagination, sorting)
│   ├── actions/                  # Server Actions (thin, delegate to DAL)
│   │   ├── products.ts
│   │   ├── quotations.ts
│   │   ├── price-lists.ts
│   │   └── auth.ts               # login, logout, register actions
│   ├── validations/              # Zod schemas for input validation
│   │   ├── products.ts
│   │   ├── quotations.ts
│   │   └── auth.ts
│   ├── permissions.ts            # RBAC permission definitions + helpers
│   └── utils/                    # Pure utility functions (server-safe)
│       ├── format.ts
│       ├── numbers.ts
│       └── date.ts
├── hooks/                        # Client-side hooks
│   ├── queries/                  # TanStack Query hooks
│   │   ├── use-products.ts
│   │   ├── use-quotations.ts
│   │   └── use-dashboard-stats.ts
│   ├── mutations/                # TanStack Mutation hooks
│   │   ├── use-create-product.ts
│   │   └── use-update-quotation.ts
│   └── use-debounce.ts           # Generic utility hooks
├── stores/                       # Zustand stores (client-only state)
│   ├── ui.ts                     # Sidebar, modal, toast state
│   ├── quotation-builder.ts      # Complex form state for quote builder
│   └── filters.ts                # Persistent filter state
├── types/                        # Shared TypeScript types
│   ├── database.ts               # Prisma-generated types re-export
│   ├── api.ts                    # API request/response types
│   ├── auth.ts                   # Extended session/user types
│   └── dto.ts                    # Data Transfer Object types
├── styles/                       # Global styles
│   └── globals.css               # Tailwind imports + @theme tokens
├── auth.ts                       # Auth.js main config (providers, adapter)
├── auth.config.ts                # Auth.js edge config (callbacks for middleware)
└── middleware.ts                  # Route protection middleware
```

### Structure Rationale

- **`app/` is thin:** Pages assemble features, they do not implement business logic. Each `page.tsx` calls DAL functions and renders composed components. This keeps the router layer a composition root.
- **`(auth)` vs `(dashboard)` route groups:** Completely separate layout trees. Auth pages get a minimal centered layout. Dashboard pages get the full shell (sidebar, topbar). Navigating between them triggers a full page reload, which is acceptable since login/logout is not a frequent transition.
- **`lib/dal/` is server-only:** Every file imports `'server-only'`. Every function calls `getCurrentUser()` and checks permissions before returning data. Returns DTOs, never raw database rows. This is the primary security boundary, not middleware.
- **`lib/actions/` are thin:** Server Actions validate input with Zod schemas from `lib/validations/`, then delegate to DAL functions. They do not contain business logic or direct database access.
- **`components/ui/` vs `components/aether/`:** shadcn/ui primitives remain as-is for easy updates. Aether components compose shadcn primitives with glassmorphism styles, adding the design system layer without forking upstream components.
- **`hooks/` and `stores/` are explicitly client-side:** Any component importing from these directories is implicitly a Client Component. This makes the server/client boundary visible in the file system.
- **`api/v1/` for external REST:** The PHP bridge, future mobile app, and Subiekt GT integration need stable HTTP endpoints. Server Actions handle internal mutations only.

## Architectural Patterns

### Pattern 1: Data Access Layer (DAL) with Authorization

**What:** A dedicated server-only module that centralizes all database reads with built-in authorization checks. Every data-fetching function verifies the current user's permissions before returning filtered DTOs.

**When to use:** Every data fetch in the application. No exceptions.

**Why critical:** CVE-2025-29927 (March 2025, CVSS 9.1) proved that middleware-only auth is a single point of failure. An attacker could bypass all middleware protection with a single crafted `x-middleware-subrequest` header. The DAL pattern ensures authorization happens at the data boundary, not just the routing boundary.

**Trade-offs:** Slightly more boilerplate per query. Worth it for defense-in-depth. Auditing becomes trivially scoped to `lib/dal/`.

**Example:**
```typescript
// lib/dal/products.ts
import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/dal/auth';
import { ProductListDTO, ProductDetailDTO } from '@/types/dto';

export const getProducts = cache(async (
  page: number = 1,
  perPage: number = 25,
  search?: string
): Promise<{ data: ProductListDTO[]; total: number }> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const where = {
    ...(search ? { name: { contains: search } } : {}),
    // Scope by user permissions if needed
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        price: true,
        // Never select sensitive fields here
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { data: products as ProductListDTO[], total };
});
```

### Pattern 2: Server-First with Client Islands

**What:** All components are Server Components by default. Client Components (`'use client'`) are pushed to leaf nodes of the component tree, wrapping only the interactive parts.

**When to use:** Every page. Default mental model for the entire application.

**Trade-offs:** Requires careful thinking about where to place the `'use client'` boundary. Passing Server Components as `children` to Client Components (composition pattern) is the key technique.

**Decision tree for Server vs Client:**

```
Does this component need:
  - useState, useEffect, useReducer?     -> Client Component
  - onClick, onChange, onSubmit handlers? -> Client Component
  - Browser APIs (window, localStorage)?  -> Client Component
  - Framer Motion animations?             -> Client Component
  - TanStack Query / Zustand?             -> Client Component

Otherwise:
  - Data fetching from DAL?               -> Server Component
  - Static rendering / SEO content?       -> Server Component
  - Layout / page shell?                  -> Server Component
  - Rendering children composition?       -> Server Component
```

**Example:**
```typescript
// app/(dashboard)/products/page.tsx (Server Component - no directive needed)
import { getProducts } from '@/lib/dal/products';
import { ProductTable } from './_components/product-table'; // Client
import { PageHeader } from '@/components/aether/page-header'; // Server

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { data, total } = await getProducts(page, 25, params.search);

  return (
    <>
      <PageHeader title="Produkty" description="Zarządzaj katalogiem" />
      {/* Server data passed as props to Client island */}
      <ProductTable
        initialData={data}
        totalCount={total}
        currentPage={page}
      />
    </>
  );
}

// app/(dashboard)/products/_components/product-table.tsx
'use client';
import { useProducts } from '@/hooks/queries/use-products';
// Client component handles interactivity: sorting, filtering, pagination
```

### Pattern 3: Auth.js v5 Split Config for Middleware RBAC

**What:** Auth.js configuration is split into two files: `auth.config.ts` (Edge-compatible, used by middleware) and `auth.ts` (full Node.js, used by Server Components and Server Actions). Callbacks are defined in `auth.config.ts` so middleware has access to the fully populated session with role data.

**When to use:** Required architecture when using Auth.js v5 with middleware-based route protection and RBAC.

**Trade-offs:** Two config files to maintain. But this is the only reliable way to get role data in middleware. Without this split, `req.auth?.user?.role` is undefined in middleware.

**Example:**
```typescript
// auth.config.ts (Edge-compatible, no Prisma/Node imports)
import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from '@/types/auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboard = nextUrl.pathname.startsWith('/') &&
        !nextUrl.pathname.startsWith('/login') &&
        !nextUrl.pathname.startsWith('/register') &&
        !nextUrl.pathname.startsWith('/forgot-password') &&
        !nextUrl.pathname.startsWith('/api/auth');

      if (isDashboard && !isLoggedIn) {
        return Response.redirect(new URL('/login', nextUrl));
      }
      return true;
    },
  },
  providers: [], // Populated in auth.ts
};

// auth.ts (full Node.js, Prisma access)
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';
import { prisma } from '@/lib/db';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials;
        const user = await prisma.user.findUnique({
          where: { email: email as string },
          select: { id: true, email: true, name: true, password: true, role: true },
        });
        if (!user || !user.password) return null;
        const valid = await bcrypt.compare(password as string, user.password);
        if (!valid) return null;
        return { id: String(user.id), email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});

// middleware.ts
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/((?!login|register|forgot-password|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Pattern 4: Prisma Singleton with MySQL Connection Pooling

**What:** A single PrismaClient instance stored on `globalThis` to survive Next.js hot-reloads in development. In production, a fresh instance per deployment (standard for long-running servers on PM2).

**When to use:** Always. This is the only correct way to use Prisma in Next.js.

**Trade-offs:** None. Not using this pattern causes "Too many connections" errors during development.

**Example:**
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
        // MySQL URL: mysql://user:pass@mail.allbag.pl:3306/allbag?connection_limit=10
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### Pattern 5: Zustand + TanStack Query Separation

**What:** Zustand manages client-only UI state (sidebar open/closed, form drafts, user preferences). TanStack Query manages server state (cached API data, pagination, search, mutations with optimistic updates). They never overlap. Server data never goes into Zustand.

**When to use:** All client-side state management. This is the canonical combination for 2025-2026 React/Next.js apps.

**Trade-offs:** Two libraries to learn. But each is tiny (Zustand ~1KB, TanStack Query ~12KB) and they have zero overlap when used correctly. Combined they are ~70% smaller than Redux alone.

**Example:**
```typescript
// stores/ui.ts (Zustand - client UI state only)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      activeModal: null,
      openModal: (id) => set({ activeModal: id }),
      closeModal: () => set({ activeModal: null }),
    }),
    { name: 'ui-storage' }
  )
);

// hooks/queries/use-products.ts (TanStack Query - server state)
import { useQuery } from '@tanstack/react-query';

export function useProducts(page: number, search?: string) {
  return useQuery({
    queryKey: ['products', { page, search }],
    queryFn: () =>
      fetch(`/api/v1/products?page=${page}&search=${search ?? ''}`).then(
        (r) => r.json()
      ),
    staleTime: 30_000, // 30s before refetch
  });
}
```

### Pattern 6: Server Actions for Internal Mutations + Route Handlers for External API

**What:** Hybrid approach. Server Actions handle form submissions and mutations from Next.js UI (no HTTP endpoint needed). Route Handlers (`app/api/v1/`) provide a stable REST API for the PHP bridge, future mobile clients, and Subiekt GT integration.

**When to use:** Server Actions for everything internal to the Next.js app. Route Handlers for anything that needs a stable URL endpoint accessible from outside Next.js.

**Trade-offs:** Two mutation paths to maintain. Mitigated by sharing the DAL -- both Server Actions and Route Handlers call the same DAL functions.

**Example:**
```typescript
// lib/actions/products.ts (Server Action - internal mutations)
'use server';

import { revalidatePath } from 'next/cache';
import { createProductSchema } from '@/lib/validations/products';
import { createProduct as dalCreateProduct } from '@/lib/dal/products';

export async function createProduct(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const validated = createProductSchema.parse(raw);  // Zod validation
  await dalCreateProduct(validated);  // DAL handles auth + DB
  revalidatePath('/products');
}

// app/api/v1/products/route.ts (Route Handler - external REST)
import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/dal/products';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page')) || 1;
  const data = await getProducts(page);
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // DAL handles auth check internally
  const product = await createProduct(body);
  return NextResponse.json(product, { status: 201 });
}
```

### Pattern 7: Aether Design System with Tailwind CSS 4 @theme Tokens

**What:** A token-driven design system using Tailwind CSS 4's `@theme` directive to define all Aether visual tokens (colors, shadows, blurs, radii) as CSS custom properties. shadcn/ui primitives are wrapped with Aether glassmorphism styles. No hardcoded color values in components -- everything references tokens.

**When to use:** Every visual component in the application. The `@theme` block is the single source of truth for the Aether aesthetic.

**Trade-offs:** Requires discipline to never use raw Tailwind color classes (like `bg-blue-500`). Instead, use semantic tokens (`bg-aether-surface`). Pays off in maintainability and theme consistency.

**Example:**
```css
/* styles/globals.css */
@import "tailwindcss";

@theme {
  /* === Background === */
  --color-aether-bg: #080812;
  --color-aether-bg-elevated: #0a0a1e;
  --color-aether-bg-overlay: #0f0f2a;

  /* === Surface (glassmorphism layers) === */
  --color-aether-surface: rgba(15, 15, 42, 0.6);
  --color-aether-surface-hover: rgba(15, 15, 42, 0.8);
  --color-aether-surface-border: rgba(99, 102, 241, 0.15);

  /* === Accent Colors === */
  --color-aether-primary: #6366f1;
  --color-aether-primary-hover: #818cf8;
  --color-aether-cyan: #06b6d4;
  --color-aether-purple: #8b5cf6;
  --color-aether-success: #10b981;
  --color-aether-warning: #f59e0b;
  --color-aether-danger: #ef4444;

  /* === Text === */
  --color-aether-text: #e2e8f0;
  --color-aether-text-muted: #94a3b8;
  --color-aether-text-bright: #f8fafc;

  /* === Glow/Neon Effects === */
  --shadow-aether-glow-sm: 0 0 10px rgba(99, 102, 241, 0.3);
  --shadow-aether-glow-md: 0 0 20px rgba(99, 102, 241, 0.4);
  --shadow-aether-glow-lg: 0 0 40px rgba(99, 102, 241, 0.5);
  --shadow-aether-glow-cyan: 0 0 20px rgba(6, 182, 212, 0.4);

  /* === Glass Blur === */
  --blur-aether-glass: 16px;
  --blur-aether-glass-heavy: 24px;

  /* === Border Radius === */
  --radius-aether-sm: 8px;
  --radius-aether-md: 12px;
  --radius-aether-lg: 16px;
  --radius-aether-xl: 24px;

  /* === Typography === */
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter Variable', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* === Transitions === */
  --ease-aether: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-aether-fast: 150ms;
  --duration-aether-normal: 250ms;
  --duration-aether-slow: 400ms;
}
```

```typescript
// components/aether/glass-card.tsx
'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function GlassCard({ children, className, glow = false }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'rounded-aether-md border border-aether-surface-border',
        'bg-aether-surface backdrop-blur-[var(--blur-aether-glass)]',
        glow && 'shadow-aether-glow-sm',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
```

## Data Flow

### Request Flow: Server Component Page Load

```
[Browser GET /products]
    |
    v
[Apache ProxyPass] --> [Next.js :3001]
    |
    v
[middleware.ts]
    |-- Check Auth.js session (from auth.config.ts callbacks)
    |-- If no session: redirect to /login
    |-- If session: continue
    |
    v
[(dashboard)/layout.tsx]  (Server Component)
    |-- Renders sidebar, topbar shell
    |-- Passes {children} down
    |
    v
[(dashboard)/products/page.tsx]  (Server Component)
    |-- Calls getProducts() from DAL
    |
    v
[lib/dal/products.ts]  (server-only)
    |-- Calls getCurrentUser() (reads cookie, validates JWT)
    |-- Checks user has 'products:read' permission
    |-- Queries Prisma: prisma.product.findMany(...)
    |-- Returns ProductListDTO[] (safe shape)
    |
    v
[Server Component renders HTML]
    |-- Streams to browser
    |-- ProductTable Client Component hydrates with initialData
    |
    v
[Browser: ProductTable 'use client']
    |-- Uses TanStack Query for subsequent page changes
    |-- Calls GET /api/v1/products?page=2 for next pages
    |-- Zustand stores sidebar state, filter preferences
```

### Mutation Flow: Server Action (Internal)

```
[User submits product form]
    |
    v
['use client' form component]
    |-- Calls Server Action via form action={createProduct}
    |-- Or: startTransition(() => createProduct(formData))
    |
    v
[lib/actions/products.ts]  ('use server')
    |-- Zod validates input (createProductSchema.parse)
    |-- Calls DAL: dalCreateProduct(validated)
    |
    v
[lib/dal/products.ts]
    |-- getCurrentUser() + permission check
    |-- prisma.product.create(...)
    |-- Returns new ProductDTO
    |
    v
[Server Action]
    |-- revalidatePath('/products')  (cache bust)
    |-- Returns success/error to client
    |
    v
[Client Component]
    |-- Shows success toast (via Zustand toast store)
    |-- Page revalidates automatically
```

### Mutation Flow: REST API (External / PHP Bridge)

```
[PHP Bridge / External Client]
    |-- POST /api/v1/products  (JSON body)
    |
    v
[app/api/v1/products/route.ts]
    |-- Parse request body
    |-- Calls same DAL function: dalCreateProduct(body)
    |
    v
[lib/dal/products.ts]
    |-- Same auth + permission check
    |-- Same Prisma query
    |-- Returns DTO
    |
    v
[Route Handler]
    |-- Returns NextResponse.json(product, { status: 201 })
```

### State Management Flow

```
[Server State (TanStack Query)]              [Client State (Zustand)]
    |                                             |
    |-- products list cache                       |-- sidebar collapsed
    |-- quotation items cache                     |-- active modal
    |-- dashboard KPI data                        |-- form drafts
    |-- pagination cursors                        |-- filter preferences
    |-- search results                            |-- theme overrides
    |                                             |
    |   queryKey: ['products', {page, search}]    |   persist to localStorage
    |   staleTime: 30s                            |   via zustand/persist
    |   automatic refetch on focus                |
    |                                             |
    |<-- NEVER overlap -->                        |
    |   Server data stays in TanStack Query       |
    |   UI state stays in Zustand                 |
```

### Key Data Flows

1. **Initial Page Load (SSR + Streaming):** Browser requests page -> middleware checks auth -> Server Component fetches data via DAL -> HTML streams to client -> Client Components hydrate with initial data props. No waterfalls because data fetches happen on server with low latency to DB.

2. **Client-side Navigation:** Browser navigates to new dashboard route -> layout persists (sidebar stays) -> new page's RSC payload streamed -> only new page content updates. TanStack Query caches prevent redundant fetches.

3. **PHP Bridge Coexistence:** Both Next.js (via Prisma) and PHP (via direct MySQL) read/write the same database. No schema migrations without impact analysis. The `api/v1/bridge/[...path]` route proxies to `localhost/kalkulator2025/api/` for endpoints not yet migrated.

4. **Real-time Data (Future):** TanStack Query's `refetchInterval` or WebSocket integration via `queryClient.setQueryData()` for live dashboard updates. Redis pub/sub could push invalidation signals.

## RBAC Architecture Detail

### Permission Model

```
User (users table)
  |
  +-- role: 'admin' | 'user' | 'viewer'
  |
  +-- UserPermission (user_permissions table)
       |
       +-- permission: 'products:read' | 'products:write' | 'products:delete'
       +-- permission: 'quotations:read' | 'quotations:write'
       +-- permission: 'settings:manage'
       +-- ... (granular per-module)
```

### Multi-Layer RBAC Enforcement

```
Layer 1: Middleware (OPTIMISTIC - for UX, not security)
    |-- Redirects unauthenticated users to /login
    |-- Fast: runs on Edge, no DB calls
    |-- Uses JWT session from auth.config.ts
    |-- NEVER the sole security check

Layer 2: Server Component / Layout (GUARD)
    |-- Checks session exists
    |-- Can hide/show nav items based on role
    |-- Calls getCurrentUser() to verify

Layer 3: Data Access Layer (AUTHORITATIVE - primary security)
    |-- Every function checks getCurrentUser()
    |-- Verifies specific permissions: canReadProducts(user)
    |-- Returns only authorized data
    |-- This is where access is truly enforced

Layer 4: Server Actions (MUTATION GUARD)
    |-- Re-validates user permissions before every write
    |-- Checks resource ownership where applicable
    |-- Validates input with Zod before DAL call
```

### RBAC Helper Pattern

```typescript
// lib/permissions.ts
import 'server-only';

export type Permission =
  | 'products:read' | 'products:write' | 'products:delete'
  | 'quotations:read' | 'quotations:write' | 'quotations:delete'
  | 'price-lists:read' | 'price-lists:write'
  | 'containers:read' | 'containers:write'
  | 'analytics:read'
  | 'hr:read' | 'hr:write'
  | 'settings:manage'
  | 'users:manage';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ['*'] as any, // Admins bypass all checks
  user: [
    'products:read', 'products:write',
    'quotations:read', 'quotations:write',
    'price-lists:read',
    'containers:read',
    'analytics:read',
  ],
  viewer: [
    'products:read',
    'quotations:read',
    'price-lists:read',
    'analytics:read',
  ],
};

export function hasPermission(
  user: { role: string; permissions?: string[] },
  permission: Permission
): boolean {
  if (user.role === 'admin') return true;

  // Check explicit user permissions first (from user_permissions table)
  if (user.permissions?.includes(permission)) return true;

  // Fall back to role-based defaults
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}
```

## Anti-Patterns

### Anti-Pattern 1: Middleware-Only Authentication

**What people do:** Put all auth/RBAC checks in `middleware.ts` and trust that no request can bypass it.
**Why it's wrong:** CVE-2025-29927 proved middleware can be completely bypassed by spoofing the `x-middleware-subrequest` header (CVSS 9.1). Middleware runs at the edge, outside the data boundary.
**Do this instead:** Use middleware for optimistic UX redirects only. Real security checks go in the Data Access Layer. Every DAL function must call `getCurrentUser()` and verify permissions independently.

### Anti-Pattern 2: Storing Server Data in Zustand

**What people do:** Fetch data from API, store it in Zustand store, use Zustand as the cache layer.
**Why it's wrong:** Creates synchronization bugs. You now have two sources of truth (server and Zustand). Stale data issues. Manual cache invalidation headaches. TanStack Query already handles all of this.
**Do this instead:** Use TanStack Query for all server data. Zustand is exclusively for client UI state (sidebar open/close, modal state, form drafts).

### Anti-Pattern 3: Fat Route Pages

**What people do:** Put data fetching, business logic, validation, and rendering all in `page.tsx`.
**Why it's wrong:** Impossible to audit security (auth checks scattered across 50+ pages). Cannot reuse logic. Cannot test business logic independently. Violates the thin-route principle.
**Do this instead:** Pages are composition roots. They call DAL functions and render composed components. Business logic lives in `lib/dal/`, validation in `lib/validations/`, mutations in `lib/actions/`.

### Anti-Pattern 4: `'use client'` at the Layout Level

**What people do:** Mark `layout.tsx` with `'use client'` because the sidebar needs interactivity.
**Why it's wrong:** Every child component becomes a Client Component. All data fetching moves to the client. Defeats Server Components entirely. Bundle bloat. Performance regression.
**Do this instead:** Keep layouts as Server Components. Extract interactive parts (sidebar toggle, mobile menu) into small Client Component islands. Use composition pattern: `<Layout><InteractiveSidebar />{children}</Layout>`.

### Anti-Pattern 5: Direct Prisma Calls in Server Components

**What people do:** Import `prisma` directly in `page.tsx` and run queries inline.
**Why it's wrong:** No authorization checks. No DTO shaping (raw DB rows leak to client). Security audit nightmare. Violates Data Access Layer principle.
**Do this instead:** All Prisma calls go through `lib/dal/` functions that enforce auth, filter fields, and return typed DTOs.

### Anti-Pattern 6: Putting Callbacks in `auth.ts` Instead of `auth.config.ts`

**What people do:** Define `jwt` and `session` callbacks in `auth.ts` (the main config file).
**Why it's wrong:** Middleware uses `auth.config.ts` (Edge-compatible). If callbacks are only in `auth.ts`, middleware cannot access the role data. `req.auth?.user?.role` will be `undefined`.
**Do this instead:** Define `jwt`, `session`, and `authorized` callbacks in `auth.config.ts`. Import and spread into `auth.ts`. This ensures middleware sees the fully populated session.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-10 users (current ALLBAG) | Monolith on PM2 is perfect. Single MySQL instance. No caching layer needed beyond TanStack Query. Focus on correctness and developer experience. |
| 10-50 users | Add Redis caching for expensive analytics queries. Consider PM2 cluster mode (2-4 instances). MySQL connection pool `connection_limit=10` per instance. Monitor slow queries with Prisma query logging. |
| 50-200 users | Separate analytics heavy queries with database read replicas. Add Prisma Accelerate or external connection pooler if connection limits become an issue. CDN for static assets. |
| 200+ users | Beyond ALLBAG's likely scale. Would require moving off XAMPP to proper hosting, load balancer, and potentially separating the API into its own service. |

### Scaling Priorities (for ALLBAG)

1. **First bottleneck: Database queries.** Complex analytics joins (sales trends, YoY, packing analytics) will be the first performance issue. Mitigation: pre-compute with cron jobs, cache results in Redis, use `revalidate` ISR for dashboard pages.

2. **Second bottleneck: Connection pool exhaustion.** PHP bridge + Next.js both hitting MySQL simultaneously. Mitigation: Prisma `connection_limit` tuning, PHP connection pooling, and monitoring active connections.

3. **Third bottleneck: Large file uploads.** Product images to MinIO, Excel imports. Mitigation: Direct upload to MinIO with pre-signed URLs, process Excel imports in background with a job queue.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| MySQL 8 (mail.allbag.pl) | Prisma Client direct connection | Shared with PHP; no schema migrations without full impact analysis. `prisma db pull` to introspect existing schema. |
| MinIO | Pre-signed URL uploads from client, server-side URL generation | Product images. Use `@aws-sdk/client-s3` (MinIO is S3-compatible). Upload directly from browser, save URL in DB. |
| Redis | `ioredis` client for caching analytics, session store backup | Used by existing PHP system. Share connection but namespace keys (`next:` prefix). |
| PHP API Bridge | Proxy Route Handler at `api/v1/bridge/[...path]` | Forwards to `localhost/kalkulator2025/api/`. Gradually migrate endpoints to Next.js. |
| Subiekt GT | REST Route Handlers for webhook + sync endpoints | Product/order sync. Needs stable external API URLs (not Server Actions). |
| SendGrid | Server Action or Route Handler wrapping `@sendgrid/mail` | Email campaigns, quotation delivery. |
| AllTask (FastAPI) | iframe embed with SSO token bridge | Pass JWT token via URL param or postMessage for seamless auth. |
| OpenAI / Anthropic | Server-side API calls from Route Handlers | AI Console feature. Stream responses via ReadableStream in Route Handler. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Page -> DAL | Direct function call (same process) | Server Components import DAL functions. No HTTP overhead. |
| Client Component -> Server Action | React Server Action protocol (POST) | Automatic serialization. Encrypted closures. |
| Client Component -> Route Handler | HTTP fetch (TanStack Query) | For paginated lists, search, real-time refresh. |
| Route Handler -> DAL | Direct function call (same process) | Same auth checks as Server Component path. |
| Next.js -> PHP Bridge | HTTP proxy (localhost) | Apache serves both. Eventually all endpoints migrate to Next.js. |
| Dashboard -> AllTask | iframe + postMessage | SSO bridge. Separate deployment. |

## Build Order (Dependencies Between Architectural Layers)

The following build order reflects hard dependencies. Each layer depends on the layers above it being complete.

```
Phase 1: Foundation (must be first)
    ├── Prisma schema introspection (prisma db pull)
    ├── lib/db.ts (singleton)
    ├── Auth.js v5 setup (auth.ts + auth.config.ts)
    ├── middleware.ts (route protection)
    ├── Tailwind CSS 4 @theme tokens (globals.css)
    └── Root layout + (auth)/(dashboard) route groups

Phase 2: Design System + DAL Core (depends on Phase 1)
    ├── shadcn/ui installation + Aether overrides
    ├── components/aether/ (GlassCard, GlowButton, DataTable...)
    ├── lib/dal/auth.ts (getCurrentUser, hasPermission)
    ├── lib/permissions.ts (RBAC model)
    └── (dashboard)/layout.tsx (sidebar, topbar)

Phase 3: First Feature Module (depends on Phase 2)
    ├── Products module (proves the full stack works)
    │   ├── lib/dal/products.ts
    │   ├── lib/actions/products.ts
    │   ├── lib/validations/products.ts
    │   ├── app/(dashboard)/products/ (pages)
    │   ├── app/api/v1/products/ (REST)
    │   └── hooks/queries/use-products.ts
    └── This validates: DAL pattern, Server/Client split,
        Aether design, TanStack Query + Zustand coexistence

Phase 4: Core Business Modules (depends on Phase 3 proving patterns)
    ├── Quotations (complex: builder UI, PDF export)
    ├── Price Lists (complex: margin matrix editor)
    ├── Containers (CRUD + status tracking)
    └── Each follows the same pattern established in Phase 3

Phase 5: Analytics + Advanced Features
    ├── Dashboard KPIs (depends on data from Phases 3-4)
    ├── Sales Analytics
    ├── Packing Analytics
    ├── PHP Bridge for unmigrated endpoints
    └── AllTask iframe integration

Phase 6: Extended Modules
    ├── HR, Debt Collection, Campaigns
    ├── Tradewatch, AI Console, Creator
    ├── Invoices, CRM, B2B Portal
    └── Subiekt GT sync
```

## Sources

### Official Documentation (HIGH confidence)
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) -- File conventions, route groups, parallel routes
- [Next.js Security: Server Components and Actions](https://nextjs.org/blog/security-nextjs-server-components-actions) -- Data Access Layer pattern, audit checklist
- [Next.js CVE-2025-29927 Postmortem](https://nextjs.org/blog/cve-2025-29927) -- Middleware bypass vulnerability
- [Auth.js RBAC Guide](https://authjs.dev/guides/role-based-access-control) -- JWT/Database strategy for roles
- [Prisma Connection Pool](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool) -- Connection management, singleton pattern
- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme) -- @theme directive, CSS custom properties
- [Motion for React](https://motion.dev/docs/react) -- Spring physics, Web Animations API

### Verified Community Sources (MEDIUM confidence)
- [Enterprise Patterns with the Next.js App Router](https://medium.com/@vasanthancomrads/enterprise-patterns-with-the-next-js-app-router-ff4ca0ef04c4) -- Layered architecture patterns
- [Feature-Sliced Design for Next.js](https://feature-sliced.design/blog/nextjs-app-router-guide) -- Folder organization principles
- [Zustand + TanStack Query Architecture](https://javascript.plainenglish.io/zustand-and-tanstack-query-the-dynamic-duo-that-simplified-my-react-state-management-e71b924efb90) -- State management separation
- [Server Actions vs API Routes Decision Guide](https://www.wisp.blog/blog/server-actions-vs-api-routes-in-nextjs-15-which-should-i-use) -- When to use which
- [shadcn-glass-ui](https://dev.to/yhooi2/introducing-shadcn-glass-ui-a-glassmorphism-component-library-for-react-4cpl) -- Glassmorphism component patterns
- [Auth.js v5 Middleware RBAC Discussion](https://github.com/nextauthjs/next-auth/discussions/9609) -- Callback placement fix for middleware
- [Next.js 15 RBAC Tutorial](https://www.jigz.dev/blogs/how-to-use-middleware-for-role-based-access-control-in-next-js-15-app-router) -- Middleware RBAC implementation

### Architecture Patterns (MEDIUM confidence)
- [Battle-Tested NextJS Project Structure 2025](https://medium.com/@burpdeepak96/the-battle-tested-nextjs-project-structure-i-use-in-2025-f84c4eb5f426)
- [MakerKit: Next.js App Router Project Structure](https://makerkit.dev/blog/tutorials/nextjs-app-router-project-structure)
- [Full-Stack Next.js 15 Project Structure 2026](https://www.groovyweb.co/blog/nextjs-project-structure-full-stack)
- [Framer Motion Complete Guide 2026](https://inhaq.com/blog/framer-motion-complete-guide-react-nextjs-developers)
- [Building Scalable Design System with shadcn/ui + Tailwind](https://shadisbaih.medium.com/building-a-scalable-design-system-with-shadcn-ui-tailwind-css-and-design-tokens-031474b03690)

---
*Architecture research for: ALLBAG Kalkulator 2026 -- Enterprise SaaS Admin Panel*
*Researched: 2026-03-23*
