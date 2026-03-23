# Stack Research

**Domain:** Enterprise SaaS Admin Panel (Import/Distribution Business Management)
**Researched:** 2026-03-23
**Confidence:** MEDIUM-HIGH (most libraries verified via npm/official docs; some version details from WebSearch only)

---

## Critical Decision: Next.js 15 vs Next.js 16

Next.js 16 (latest: 16.2.1) is now the current major release. However, the project specification calls for **Next.js 15**. This is a valid choice:

- **Next.js 15.5.x** is the last minor in the 15.x line, with security patches through **15.5.11**.
- Next.js 16 removes synchronous access to async Request APIs entirely (which 15 still supports with deprecation warnings).
- Staying on 15 means fewer breaking changes from the existing ecosystem (shadcn/ui, Auth.js, Prisma adapters were all stabilized against 15.x).
- **Recommendation: Use `next@15.5.11`** (latest patched 15.5.x). This gets Turbopack builds (beta), stable Node.js middleware, and all security patches. Pin the version explicitly since `npm install next@latest` now gives 16.x.

**Confidence: HIGH** -- Version numbers verified via npm registry and Next.js security update blog.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.5.11 | Full-stack React framework (App Router) | Last patched 15.5.x; App Router with Server/Client Components, Server Actions, streaming SSR. Stable Turbopack dev, stable Node.js middleware. All security CVEs patched. |
| React | 19.0.4 | UI library | Pinned to 19.0.x for Next.js 15 compatibility (16.x ships with React 19.2 canary). Stable Server Components, Server Actions, `useOptimistic`, `useFormStatus`. |
| React DOM | 19.0.4 | DOM rendering | Must match React version exactly. |
| TypeScript | 5.9.3 | Type safety | Latest stable. Supports `import defer`, all ES2024+ features. Next.js 15 fully compatible. Prisma 6 requires >= 5.1.0. |
| Node.js | 22.x LTS (Jod) | Runtime | Maintenance LTS through April 2027. Active LTS 24.x is available but 22.x has broader ecosystem testing. Next.js 15 targets Node 18.17+; 22.x is safe. Use 22.x unless already on 24.x. |

**Confidence: HIGH** -- Versions verified against npm registry, Next.js docs, and Node.js release schedule.

### Styling & Design System

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tailwind CSS | 4.2.2 | Utility-first CSS framework | CSS-first config with `@theme` directive replaces `tailwind.config.js`. Oxide engine: 2-5x faster builds. Cascade layers, `@property`, `color-mix()`. Required for Aether design tokens. |
| @tailwindcss/postcss | 4.2.2 | PostCSS integration | Replaces the `tailwindcss` PostCSS plugin from v3. Required for Next.js PostCSS pipeline. |
| shadcn/ui (CLI v4) | latest | Component primitives | Copy-paste components built on Radix UI + Tailwind. Full code ownership. Tailwind v4 compatible. March 2026: CLI v4 with project scaffolding, presets, unified `radix-ui` package. |
| radix-ui | unified package | Accessible UI primitives | shadcn/ui new-york style now uses single `radix-ui` package instead of individual `@radix-ui/react-*` packages. Cleaner dependency tree. |
| Framer Motion (motion) | 12.36.x | Animation library | Rebranded as "motion". React 19 fully supported. Import from `motion/react` for new projects. No breaking changes in v12. Spring physics for Aether animations. |
| Space Grotesk | variable | Display typography | Google Font. Load via `next/font/google` for zero layout shift. |
| Inter | variable | Body typography | Google Font. Load via `next/font/google`. Industry standard for UI. |
| JetBrains Mono | variable | Monospace / data typography | Google Font. For numerical data, code, SKUs. |

**Confidence: HIGH** -- Tailwind 4.2.2 verified on npm. shadcn/ui CLI v4 verified via changelog. Motion 12.36.x verified on npm.

### Database & ORM

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| MySQL | 8.x (existing) | Primary database | Existing production database on mail.allbag.pl. No migration to PostgreSQL -- zero risk to production data. |
| Prisma ORM | 6.19.2 | TypeScript ORM | Last stable release in 6.x line. `db pull` introspection for existing MySQL schema. Type-safe client generation. Rust-free Query Compiler GA for MySQL (since 6.16.0): 3.4x faster for large result sets, 90% smaller bundle. |
| @prisma/client | 6.19.2 | Generated query client | Auto-generated from schema. Type-safe queries, relations, transactions. |

**Why Prisma 6 and not 7:** Prisma 7 has been released (7.1.0+), but it makes the Rust-free architecture the default and introduces breaking changes. For a project introspecting an existing MySQL database shared with PHP, staying on 6.19.2 with the Query Compiler enabled as a preview flag is safer. Upgrade to 7 after PHP bridge is retired.

**Confidence: HIGH** -- Prisma 6.19.2 verified on npm. MySQL connector and db pull documented in official Prisma docs.

### Authentication

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| next-auth | 5.0.0-beta.30 | Authentication | Latest beta. Auth.js v5 rewrite on `@auth/core`. Credentials provider for existing bcrypt password verification against `users` table. Session strategy: JWT (stateless, no DB session table needed). |
| bcryptjs | 2.4.3 | Password hashing | Pure JS bcrypt for verifying existing password hashes. Avoids native C++ build issues on Windows/XAMPP. Use cost factor 12+ for new hashes. |

**Important note on Auth.js v5 beta:** Despite the "beta" label, Auth.js v5 has been in extended beta since 2023 and is used in production by thousands of projects (3.3M weekly npm downloads). The API is stable. The team has not released a non-beta tag. Install with `npm install next-auth@beta`.

**Confidence: MEDIUM** -- Auth.js v5 stable release status is uncertain (still beta after 2+ years). API is stable but version tag is not. bcryptjs version from training data; verify on npm.

### Data Fetching & State Management

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @tanstack/react-query | 5.95.x | Server state management / caching | Standard for client-side data fetching with caching, deduplication, background refetch. Works with Next.js App Router streaming. Prefetch in Server Components, consume in Client Components. |
| @tanstack/react-query-devtools | 5.95.x | Dev tools | Query inspector during development. Tree-shaken in production. |
| zustand | 5.x | Client state management | Lightweight (1.16KB gzip), no Provider wrapper needed, selector-based re-renders. For UI state: sidebar toggle, modal state, notification queue, theme preferences. Not for server data (use TanStack Query). |

**Confidence: HIGH** -- TanStack Query 5.95.x verified on npm. Zustand well-documented for Next.js App Router.

### Data Tables

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @tanstack/react-table | 8.21.3 | Headless data table | TypeScript-first, headless (full styling control for Aether theme). Sorting, filtering, pagination, pinning, row selection. shadcn/ui provides pre-built table components on top of TanStack Table. |

**Confidence: HIGH** -- Version verified on npm. shadcn/ui data-table pattern well documented.

### Forms & Validation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-hook-form | 7.56.4 | Form state management | Uncontrolled components for performance (critical with 30+ field forms). Integrates with shadcn/ui form components. |
| zod | 4.3.0 | Schema validation | Single schema reused on client (via `zodResolver`) and server (via `safeParse()` in Server Actions). Type inference with `z.infer<>`. |
| @hookform/resolvers | 5.2.2 | RHF resolver bridge | Connects Zod schemas to react-hook-form. |

**Warning:** Do NOT use react-hook-form v8 beta yet (v8.0.0-beta.1, Jan 2026). It has breaking changes and is not production-ready.

**Confidence: MEDIUM-HIGH** -- Versions from WebSearch (Jan 2026 data). Verify exact latest on npm before installing. Zod 4.x is a major version jump from Zod 3.x used in most tutorials.

### Charts & Analytics

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| recharts | 3.7.x | Dashboard charts | 13.8M weekly downloads, composable React component API (each axis/line/bar is a component). Lower learning curve than Nivo. Works with SVG for clean Aether-styled charts. shadcn/ui provides chart wrappers around Recharts. |

**Confidence: HIGH** -- Recharts dominance verified via npm trends. shadcn/ui chart integration documented.

### File Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| minio | 8.0.7 | S3-compatible object storage client | Existing MinIO instance for product images. JS SDK active (updated Mar 2026). Use presigned URLs for uploads > 4MB. Server-side operations in API routes/Server Actions only. |

**Note:** MinIO server repo was archived Feb 2026, but JS SDK remains actively maintained. The existing MinIO instance continues to work.

**Confidence: MEDIUM** -- MinIO SDK version verified on npm. Server archival status from WebSearch.

### PDF & Excel

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @react-pdf/renderer | 4.1.x | PDF generation (invoices, quotes, labels) | Vector-based PDFs from React components. React 19 compatible (since v4.1.0). Render on client with dynamic import (`ssr: false`). |
| exceljs | latest | Excel file generation | Styled Excel creation with column widths, formatting, multiple sheets. Runs in API routes for server-side generation. More control than SheetJS for formatted exports. |
| xlsx (SheetJS) | latest | Excel file parsing (import) | Lightweight parser for importing Excel uploads. Use in Server Actions or API routes. `XLSX.read()` + `utils.sheet_to_json()`. |

**Confidence: MEDIUM** -- @react-pdf/renderer React 19 compatibility verified via official docs. ExcelJS/SheetJS versions from training data.

### Toast Notifications

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| sonner | 2.0.7 | Toast notifications | Zero dependencies. shadcn/ui's official toast component. Promise toasts, async operations, rich colors. Dark mode native. Works with Server Components via cookie-based approach. |

**Confidence: HIGH** -- Version verified on npm. shadcn/ui integration documented.

### Internationalization

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| next-intl | 4.8.3 | i18n (Polish primary, English secondary) | 2KB bundle, native Server Component support, ICU message syntax, type-safe translation keys. App Router middleware for locale detection. |

**Confidence: HIGH** -- Version verified on npm. App Router integration well documented.

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| Turbopack | built into Next.js 15.5 | Dev server bundler | `next dev --turbopack`. 5-10x faster HMR than Webpack. Stable in 15.5. |
| ESLint | 9.x | Linting | Next.js 15.5 deprecates `next lint` in favor of standard ESLint config. Use flat config. |
| Prettier | 3.x | Code formatting | With `prettier-plugin-tailwindcss` for class sorting. |
| prettier-plugin-tailwindcss | latest | Tailwind class sorting | Automatic utility class ordering in templates. |
| PM2 | 6.0.14 | Node.js process manager | Manages Next.js process on Windows. No native Windows service support -- use NSSM or WinSW wrapper for auto-start. AGPL-3.0 license. |

**Confidence: HIGH** -- PM2 version verified on npm.

---

## Infrastructure Stack (XAMPP / Windows Deployment)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Apache (XAMPP) | 2.4.x | Reverse proxy | ProxyPass `/kalkulator2026` to `http://localhost:3001`. Handles SSL, serves PHP bridge endpoints. |
| Node.js | 22.x LTS | Next.js runtime | Runs standalone server on port 3001. |
| PM2 | 6.0.14 | Process management | Auto-restart on crash, log management, cluster mode if needed. |
| MySQL | 8.x | Database | Existing instance on mail.allbag.pl. Shared with PHP backend. |
| MinIO | existing | Object storage | Product images, document attachments. |
| Redis | existing | Cache/sessions | Used by existing PHP system. Can be leveraged for Next.js caching via `ioredis` if needed. |

---

## XAMPP / Windows Deployment Configuration

### Apache httpd.conf Configuration

```apache
# Enable required modules (uncomment in httpd.conf)
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so

# Next.js reverse proxy
ProxyRequests Off
ProxyPreserveHost On

<Location /kalkulator2026>
    ProxyPass http://127.0.0.1:3001/kalkulator2026
    ProxyPassReverse http://127.0.0.1:3001/kalkulator2026
</Location>

# WebSocket support for HMR in development (optional)
# LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
# ProxyPass /kalkulator2026/_next/webpack-hmr ws://127.0.0.1:3001/kalkulator2026/_next/webpack-hmr
```

### next.config.ts Configuration

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/kalkulator2026',
  output: 'standalone',
  // React 19 + Next.js 15 specific
  reactStrictMode: true,
  // Turbopack is used in dev; this is for production builds
  experimental: {
    // Enable if using Prisma Query Compiler (Rust-free)
    // serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'minio.allbag.pl', // adjust to actual MinIO hostname
      },
    ],
  },
};

export default nextConfig;
```

**Critical: `basePath` must match the Apache ProxyPass path.** This value is baked into the client bundle at build time. All internal `<Link>` hrefs auto-prefix. `<Image>` src needs manual prefix.

### PM2 Ecosystem File (ecosystem.config.cjs)

```javascript
module.exports = {
  apps: [{
    name: 'kalkulator2026',
    script: '.next/standalone/server.js',
    cwd: 'C:/xampp/htdocs/kalkulator2026',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOSTNAME: '127.0.0.1',
    },
    instances: 1,          // single instance; increase for cluster mode
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
  }],
};
```

### Production Build & Deploy Script

```bash
# Build
npm run build

# Copy static assets into standalone (CRITICAL - standalone does not include these)
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save

# For Windows auto-start, use NSSM:
# nssm install PM2-Kalkulator2026 "C:/Program Files/nodejs/node.exe" "C:/Users/mgwaj/AppData/Roaming/npm/node_modules/pm2/bin/pm2" resurrect
```

---

## Tailwind CSS 4 @theme Configuration for Aether Design

```css
@import "tailwindcss";

/* Reset default colors to prevent conflicts with Aether palette */
@theme {
  --color-*: initial;
  --font-*: initial;

  /* === Aether Color Tokens === */
  --color-background: #080812;
  --color-surface: #0a0a1e;
  --color-surface-elevated: #111133;
  --color-surface-glass: rgba(17, 17, 51, 0.6);

  --color-accent-blue: #6366f1;
  --color-accent-cyan: #06b6d4;
  --color-accent-purple: #8b5cf6;
  --color-accent-emerald: #10b981;
  --color-accent-rose: #f43f5e;

  --color-text-primary: #f0f0ff;
  --color-text-secondary: #a0a0c0;
  --color-text-muted: #606080;

  --color-border: rgba(99, 102, 241, 0.15);
  --color-border-glow: rgba(99, 102, 241, 0.4);

  /* === Typography === */
  --font-display: "Space Grotesk", sans-serif;
  --font-body: "Inter Variable", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* === Spacing (extends default) === */
  --spacing-18: 4.5rem;
  --spacing-88: 22rem;

  /* === Border Radius === */
  --radius-glass: 1rem;
  --radius-card: 0.75rem;

  /* === Shadows (neon glows) === */
  --shadow-glow-sm: 0 0 10px rgba(99, 102, 241, 0.15);
  --shadow-glow-md: 0 0 20px rgba(99, 102, 241, 0.2);
  --shadow-glow-lg: 0 0 40px rgba(99, 102, 241, 0.3);
  --shadow-glow-cyan: 0 0 20px rgba(6, 182, 212, 0.2);

  /* === Animations === */
  --animate-glow-pulse: glow-pulse 3s ease-in-out infinite;
}

/* Glassmorphism utility layer */
@layer utilities {
  .glass {
    background: var(--color-surface-glass);
    backdrop-filter: blur(12px);
    border: 1px solid var(--color-border);
  }

  .glass-hover:hover {
    border-color: var(--color-border-glow);
    box-shadow: var(--shadow-glow-sm);
  }

  .neon-glow {
    box-shadow: var(--shadow-glow-md);
  }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.1); }
  50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
}
```

**Key Tailwind 4 differences from v3:**
- `@import "tailwindcss"` replaces `@tailwind base/components/utilities`
- `@theme {}` replaces `tailwind.config.js` `extend.colors`, `extend.fontFamily`, etc.
- `--color-*: initial` is the v4 way to clear default colors (like overriding a namespace)
- CSS variables in `@theme` automatically generate utility classes (e.g., `bg-accent-blue`, `text-text-primary`)
- `@layer utilities` still works for custom utilities
- No `tailwind.config.js` needed at all (use `@config` directive only for backward compatibility)

---

## Prisma Configuration for Existing MySQL

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// Models generated by: npx prisma db pull
// Then customize with @map / @@map for camelCase
```

### Introspection Workflow

```bash
# 1. Pull existing schema
npx prisma db pull

# 2. Customize generated schema (rename snake_case to camelCase with @map)
# 3. Generate client
npx prisma generate

# IMPORTANT: Do NOT run prisma db push or prisma migrate
# The PHP backend shares this database. Schema changes must be manual SQL
# coordinated with the PHP bridge retirement.
```

### Prisma Query Compiler (Rust-Free) -- Optional Performance Boost

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["queryCompiler", "driverAdapters"]
}
```

This enables the Rust-free Query Compiler: 3.4x faster for large result sets, 90% smaller client bundle. GA for MySQL since Prisma 6.16.0.

---

## Auth.js v5 Configuration Pattern

### auth.ts

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;

        const isValid = await bcryptjs.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role;
      return session;
    },
  },
});
```

**Key v5 differences from v4:**
- Single `auth()` function replaces `getServerSession()`
- Export `handlers` for API route (`app/api/auth/[...nextauth]/route.ts`)
- `AUTH_SECRET` env var required (auto-detected with `AUTH_` prefix)
- `authorize` callback in Credentials provider returns user or null
- JWT strategy recommended for Credentials (adapter is optional but useful for user lookup)

---

## Installation Commands

```bash
# Core framework
npm install next@15.5.11 react@19.0.4 react-dom@19.0.4

# Authentication
npm install next-auth@beta @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs

# Database
npm install prisma@6.19.2 @prisma/client@6.19.2

# Styling
npm install tailwindcss@4.2.2 @tailwindcss/postcss@4.2.2

# UI Components (shadcn/ui - installed via CLI, not npm)
npx shadcn@latest init
# Then add components as needed:
# npx shadcn@latest add button card dialog table form input ...

# Animation
npm install motion@12.36.0

# Data fetching & state
npm install @tanstack/react-query@5 @tanstack/react-query-devtools@5
npm install zustand@5

# Data tables
npm install @tanstack/react-table@8

# Forms & validation
npm install react-hook-form@7 zod@4 @hookform/resolvers@5

# Charts
npm install recharts@3

# Notifications
npm install sonner@2

# i18n
npm install next-intl@4

# File handling
npm install minio@8.0.7
npm install @react-pdf/renderer@4
npm install exceljs xlsx

# Dev dependencies
npm install -D typescript@5.9.3 @types/node @types/react @types/react-dom
npm install -D prettier prettier-plugin-tailwindcss
npm install -D eslint eslint-config-next@15
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not the Alternative |
|----------|-------------|-------------|-------------------------|
| Framework | Next.js 15.5.11 | Next.js 16.2.1 | Project spec says 15. 16 removes sync Request API support entirely. Ecosystem (Auth.js, Prisma adapters) stabilized against 15.x. Upgrade to 16 after MVP. |
| CSS | Tailwind CSS 4 | Tailwind CSS 3 | v4 is stable, faster, CSS-first config matches Aether design token approach. No reason to use v3 for a greenfield project. |
| ORM | Prisma 6.19.2 | Drizzle ORM | Prisma's `db pull` introspection is critical for mapping 20+ existing MySQL tables. Drizzle has `drizzle-kit introspect` but Prisma's mapping + `@map` system is more mature for legacy schemas. |
| ORM | Prisma 6.19.2 | Prisma 7.x | Prisma 7 makes Rust-free default and has breaking changes. Risky for a shared-DB project. Safer to stay on 6 with Query Compiler preview flag. |
| Auth | Auth.js v5 | Better Auth | Better Auth is gaining traction but Auth.js has 3.3M weekly downloads and official Next.js integration. Credentials provider pattern well-documented. |
| Auth | Auth.js v5 | Lucia Auth | Lucia deprecated itself in early 2025, recommending Auth.js instead. |
| State | Zustand | Redux Toolkit | 15KB (with react-redux) vs 1.16KB. Redux's action/reducer boilerplate is unnecessary for UI state in an admin panel. |
| State | Zustand | Jotai | Jotai is atomic (bottom-up), better for form state or fine-grained reactivity. Zustand is store-based (top-down), better fit for global UI state (sidebar, theme, user). Use Jotai alongside if needed for complex form scenarios. |
| Charts | Recharts | Nivo | Nivo has better aesthetics out-of-box and Canvas mode for large datasets. But Recharts has 6000x more npm downloads, composable API, and shadcn/ui provides chart wrappers for it. For an admin dashboard, Recharts' simplicity wins. |
| Tables | TanStack Table | AG Grid | AG Grid is enterprise-grade but adds 300KB+ and requires commercial license for features like row grouping. TanStack Table is headless (full Aether styling control) and free. |
| PDF | @react-pdf/renderer | Puppeteer | Puppeteer requires a headless Chrome binary (~300MB). @react-pdf/renderer generates vector PDFs from React components, lighter and more maintainable. |
| Toast | Sonner | react-hot-toast | Both are good. Sonner is shadcn/ui's official choice, zero dependencies, better promise toast API. |
| Process Mgr | PM2 | Forever | Forever is unmaintained. PM2 is actively developed with 100M+ downloads. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `tailwind.config.js` | Deprecated pattern in Tailwind 4. CSS-first `@theme` is the new standard. Only use `@config` directive for backward compat with v3 plugins. | `@theme` directive in CSS |
| `@tailwind base/components/utilities` | Removed in Tailwind 4. | `@import "tailwindcss"` |
| `next-auth@4.x` (stable) | v4 is the old API. v5 rewrites for App Router, `@auth/core`, and new provider patterns. v4 does not support Next.js 15 App Router properly. | `next-auth@beta` (v5) |
| `bcrypt` (native) | Requires C++ compilation (`node-gyp`, Python, Visual Studio Build Tools) on Windows. Build failures common on XAMPP environments. | `bcryptjs` (pure JS, identical API) |
| `Buffer` for Prisma Bytes | Prisma 6 replaces `Buffer` with `Uint8Array` for `Bytes` fields. Code using `Buffer` will break. | `Uint8Array` |
| `getServerSession()` | Auth.js v5 API. Replaced by single `auth()` function. | `auth()` from `@/auth` |
| `pages/` directory routing | Legacy Pages Router. The project uses App Router exclusively. | `app/` directory with layouts, loading, error boundaries |
| `getServerSideProps` / `getStaticProps` | Pages Router data fetching. Replaced by Server Components and `fetch()` in App Router. | Server Components, Server Actions, `fetch()` with caching |
| `react-hook-form@8.0.0-beta.*` | Breaking changes, not production-ready. | `react-hook-form@7.56.x` |
| `zod@3.x` | Zod 4 has breaking changes from 3.x. Tutorials showing Zod 3 patterns may not work. Use `zod@4` with `@hookform/resolvers@5`. | `zod@4.3.x` with compatible resolver |
| `framer-motion` (old package) | Package renamed to `motion`. `framer-motion` still works but is legacy. | `import { motion } from "motion/react"` |
| `pm2-windows-startup` | Unreliable on newer Windows versions. | NSSM or WinSW to wrap PM2 as a Windows service |
| React Context for global state | Causes full re-renders on any state change. Not suitable for frequently changing UI state. | Zustand with selectors |
| `prisma migrate` / `prisma db push` | DANGEROUS: PHP backend shares the MySQL database. Any schema change must be coordinated manually to avoid breaking the PHP bridge. | Manual SQL migrations, coordinated with PHP bridge retirement |

---

## Version Compatibility Matrix

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| next@15.5.11 | react@19.0.x, react-dom@19.0.x | Next.js 15 ships with React 19.0.x. Do NOT use React 19.1 or 19.2 (those are for Next.js 16). |
| tailwindcss@4.2.x | @tailwindcss/postcss@4.2.x | Must match major.minor. Do NOT mix with old `tailwindcss` PostCSS plugin. |
| prisma@6.19.2 | @prisma/client@6.19.2, TypeScript >= 5.1 | prisma CLI and @prisma/client versions MUST match exactly. |
| next-auth@5.0.0-beta.30 | next@14+, @auth/prisma-adapter@latest | PrismaAdapter must be from `@auth/prisma-adapter`, not old `@next-auth/prisma-adapter`. |
| zod@4.3.x | @hookform/resolvers@5.x | Resolvers v5 added Zod v4 support. Do NOT use `@hookform/resolvers@3` with Zod v4. |
| react-hook-form@7.56.x | @hookform/resolvers@5.x | Resolvers v5 is backward-compatible with RHF v7. |
| @tanstack/react-table@8.21.x | react@19.x | Compatible with React 19 but may not work with React Compiler. Table renders are client-side only. |
| motion@12.36.x | react@19.x | Full React 19 support. Client-side only ("use client" directive required). |
| shadcn/ui CLI v4 | tailwindcss@4.x, radix-ui (unified), react@19.x | CLI generates components compatible with Tailwind v4 and unified Radix package. |

---

## Stack Patterns by Variant

**Server Component (default for all pages/layouts):**
- Data fetching with Prisma directly (no API layer needed)
- No JavaScript shipped to client
- Use for: page layouts, data display, server-side PDF generation, initial page loads

**Client Component ("use client" directive):**
- Interactive UI: forms, modals, dropdowns, animations
- TanStack Query for client-side data fetching/mutation
- Framer Motion animations
- react-hook-form
- Use for: form builders, real-time dashboards, drag-and-drop, chart interactions

**Server Action (form submissions, mutations):**
- Zod validation with `safeParse()`
- Prisma write operations
- Revalidation with `revalidatePath()` / `revalidateTag()`
- Use for: CRUD operations, file uploads (< 4MB), form submissions

**API Route (app/api/):**
- Webhook endpoints
- File upload processing (> 4MB via presigned URLs)
- PHP bridge proxy endpoints
- External service integrations (SendGrid, Subiekt GT)
- Use for: anything that needs a traditional REST endpoint

---

## Security Patches to Apply Immediately

| CVE | Severity | Affected | Fix |
|-----|----------|----------|-----|
| CVE-2025-55182 (React2Shell) | CRITICAL (10.0) | Next.js 15.x RSC deserialization | Upgrade to next@15.5.11 (patched) |
| CVE-2026-29057 | HIGH | Next.js http-proxy request smuggling | Included in next@15.5.11 |
| CVE-2026-27978 | MEDIUM | Server Action submissions from sensitive contexts | Included in next@15.5.11 |

---

## Sources

- [Next.js Releases](https://github.com/vercel/next.js/releases) -- Version history and security patches (HIGH confidence)
- [Next.js Security Update Dec 2025](https://nextjs.org/blog/security-update-2025-12-11) -- CVE patches (HIGH confidence)
- [Next.js basePath docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath) -- Subdirectory deployment (HIGH confidence)
- [Next.js standalone output](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output) -- Production deployment (HIGH confidence)
- [Tailwind CSS v4.0 blog](https://tailwindcss.com/blog/tailwindcss-v4) -- v4 architecture and @theme syntax (HIGH confidence)
- [Tailwind CSS theme docs](https://tailwindcss.com/docs/theme) -- @theme directive reference (HIGH confidence)
- [Tailwind v4 shadcn/ui](https://ui.shadcn.com/docs/tailwind-v4) -- shadcn/ui Tailwind v4 integration (HIGH confidence)
- [Prisma 6 release blog](https://www.prisma.io/blog/prisma-6-better-performance-more-flexibility-and-type-safe-sql) -- Prisma 6 features (HIGH confidence)
- [Prisma db pull docs](https://www.prisma.io/docs/cli/db/pull) -- Introspection workflow (HIGH confidence)
- [Prisma MySQL introspection](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases/introspection-typescript-mysql) -- MySQL-specific setup (HIGH confidence)
- [Prisma Query Compiler benchmarks](https://www.prisma.io/blog/prisma-orm-without-rust-latest-performance-benchmarks) -- Performance data (HIGH confidence)
- [Auth.js migration guide](https://authjs.dev/getting-started/migrating-to-v5) -- v5 setup (MEDIUM confidence -- still beta)
- [Auth.js Credentials provider](https://authjs.dev/getting-started/providers/credentials) -- Credentials config (MEDIUM confidence)
- [TanStack Query SSR docs](https://tanstack.com/query/v5/docs/react/guides/advanced-ssr) -- Next.js App Router integration (HIGH confidence)
- [TanStack Table npm](https://www.npmjs.com/package/@tanstack/react-table) -- Version verification (HIGH confidence)
- [Motion upgrade guide](https://motion.dev/docs/react-upgrade-guide) -- Framer Motion to Motion migration (HIGH confidence)
- [shadcn/ui changelog](https://ui.shadcn.com/docs/changelog) -- CLI v4, Tailwind v4 support (HIGH confidence)
- [PM2 npm](https://www.npmjs.com/package/pm2) -- Version verification (HIGH confidence)
- [MinIO JS SDK](https://github.com/minio/minio-js) -- SDK status (MEDIUM confidence)
- [react-pdf compatibility](https://react-pdf.org/compatibility) -- React 19 support (HIGH confidence)
- [Node.js releases](https://nodejs.org/en/about/previous-releases) -- LTS schedule (HIGH confidence)
- [React 19.2 blog](https://react.dev/blog/2025/10/01/react-19-2) -- React version history (HIGH confidence)

---
*Stack research for: ALLBAG Kalkulator 2026 -- Enterprise SaaS Admin Panel*
*Researched: 2026-03-23*
