# Pitfalls Research

**Domain:** Next.js 15 Enterprise SaaS on XAMPP Windows (ALLBAG Kalkulator 2026)
**Researched:** 2026-03-23
**Confidence:** HIGH (most pitfalls verified across multiple sources including official docs)

---

## Critical Pitfalls

### Pitfall 1: Prisma Connection Pool Exhaustion in Next.js Dev Mode

**What goes wrong:**
Every file save in Next.js dev mode triggers a hot reload. Without a singleton pattern, each reload creates a new `PrismaClient` instance with its own connection pool (default: `num_cpus * 2 + 1` connections). On a 4-core machine, that is 9 connections per reload. After ~11 reloads, MySQL's default `max_connections` (100) is exhausted. The app crashes with `Error: Too many connections`.

**Why it happens:**
Next.js hot reload resets module scope, destroying the old `PrismaClient` reference but NOT closing its connections. The old connections linger in MySQL's connection pool until they timeout. Meanwhile, a new PrismaClient opens fresh connections. This is specific to dev mode because `globalThis` references are cleared on reload.

**How to avoid:**
1. Use the canonical singleton pattern storing PrismaClient on `globalThis`:
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```
2. Limit dev connection pool: append `?connection_limit=3` to `DATABASE_URL` in `.env.development`
3. Monitor with `SHOW PROCESSLIST` in MySQL to detect leaked connections early
4. Since PHP (kalkulator2025) shares the same MySQL instance, reserve headroom -- set MySQL `max_connections` to at least 150 and keep Prisma's pool at 3-5 in dev, 10-15 in production

**Warning signs:**
- `Error: Too many connections` after rapid file saves
- MySQL `SHOW PROCESSLIST` shows dozens of sleeping connections from Node.js
- Prisma queries start timing out intermittently in dev

**Phase to address:** Phase 1 (Project Bootstrap / Database Setup)

---

### Pitfall 2: Next.js Middleware Auth Bypass (CVE-2025-29927)

**What goes wrong:**
A critical vulnerability (CVSS 9.1) allows attackers to completely bypass Next.js middleware by sending the internal `x-middleware-subrequest` header. If authentication is checked only in middleware, an attacker can access any protected route by crafting a single HTTP header. This was publicly disclosed March 2025 and affects all Next.js versions before 15.2.3.

**Why it happens:**
Next.js uses an internal `x-middleware-subrequest` header to prevent recursive middleware loops. Prior to the fix, this header was not stripped from external requests, allowing attackers to impersonate internal subrequests and skip middleware entirely.

**How to avoid:**
1. Use Next.js >= 15.2.3 (mandatory)
2. Never rely solely on middleware for authentication. Implement defense-in-depth: verify auth at the data access layer (in Server Actions, Route Handlers, and data fetching functions)
3. Strip the header at Apache level as an additional safeguard:
```apache
# httpd.conf or .htaccess
RequestHeader unset x-middleware-subrequest
```
4. Build a Data Access Layer (DAL) pattern where every database query verifies the session independently of middleware

**Warning signs:**
- Auth checks exist only in `middleware.ts` with no verification in route handlers
- No `RequestHeader unset` rule in Apache config
- Next.js version < 15.2.3 in `package.json`

**Phase to address:** Phase 1 (Auth Setup -- NextAuth v5 implementation)

---

### Pitfall 3: NextAuth v5 Edge Runtime + bcrypt Incompatibility

**What goes wrong:**
The Credentials provider's `authorize` function uses `bcrypt` (Node.js native C++ module) to verify passwords against the existing `users` table. Next.js middleware runs in the Edge Runtime, which cannot execute native Node.js modules. If auth config is not split, the entire app fails at build time with "Module not found: Can't resolve 'bcrypt'" or similar Edge Runtime errors.

**Why it happens:**
NextAuth v5 (Auth.js) is designed to run in Edge Runtime for performance. The middleware imports the auth config to check sessions. If that config includes `bcrypt` (via the Credentials provider's `authorize` function), the Edge bundler tries to include `bcrypt` and fails. This is the single most common NextAuth v5 migration blocker for projects using password-based auth.

**How to avoid:**
Split auth configuration into two files:
1. `auth.config.ts` -- lightweight, Edge-compatible config (providers list without authorize logic, callbacks, pages). Used by middleware.
2. `auth.ts` -- full config with Prisma adapter, Credentials provider with bcrypt verify, session strategy. Used everywhere else.

```typescript
// auth.config.ts (Edge-safe)
import type { NextAuthConfig } from "next-auth"
export default { providers: [], pages: { signIn: "/login" } } satisfies NextAuthConfig

// auth.ts (Node.js only)
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import authConfig from "./auth.config"
export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      authorize: async (credentials) => {
        // bcrypt.compare here -- safe, not in Edge
      }
    })
  ],
  adapter: PrismaAdapter(prisma),
})
```

Consider using `bcryptjs` (pure JS) instead of `bcrypt` (native) for broader compatibility, though the split pattern is still needed.

**Warning signs:**
- Build error mentioning Edge Runtime and native modules
- `middleware.ts` importing directly from `auth.ts` that contains bcrypt
- "Dynamic Code Evaluation" warnings during build

**Phase to address:** Phase 1 (Auth Setup)

---

### Pitfall 4: Apache ProxyPass Subpath + Next.js basePath Mismatch

**What goes wrong:**
The project deploys Next.js at `/kalkulator2026` via Apache ProxyPass to `localhost:3001`. Without proper `basePath` configuration, all `/_next/static/*` assets, images, and internal navigation links break with 404 errors. The HTML renders but appears unstyled with broken JavaScript because the browser requests assets from `http://domain/_next/...` instead of `http://domain/kalkulator2026/_next/...`.

**Why it happens:**
Next.js generates all internal links and asset references starting from `/`. When served behind a subpath proxy, the browser resolves these relative to the domain root, missing the `/kalkulator2026` prefix. This affects CSS, JS bundles, images, fonts, API routes, and client-side navigation.

**How to avoid:**
1. Set `basePath` in `next.config.ts`:
```typescript
const nextConfig = {
  basePath: '/kalkulator2026',
  // assetPrefix is usually NOT needed when basePath is set
}
```
2. Configure Apache with BOTH regular and WebSocket proxying:
```apache
# Regular HTTP proxy
ProxyPass /kalkulator2026 http://localhost:3001/kalkulator2026
ProxyPassReverse /kalkulator2026 http://localhost:3001/kalkulator2026

# WebSocket for HMR (dev mode only)
<Location /kalkulator2026/_next/webpack-hmr>
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule /(.*) ws://localhost:3001/kalkulator2026/_next/webpack-hmr [P,L]
    ProxyPass ws://localhost:3001/kalkulator2026/_next/webpack-hmr
</Location>
```
3. Enable required Apache modules in `httpd.conf`: `mod_proxy`, `mod_proxy_http`, `mod_proxy_wstunnel`, `mod_rewrite`
4. Manually prefix `<Image>` `src` attributes: `<Image src="/kalkulator2026/logo.png" />`
5. Keep `ProxyRequests Off` to prevent turning Apache into an open proxy

**Warning signs:**
- Page loads but appears completely unstyled (white page with raw text)
- Browser console shows 404 for `/_next/static/...` resources
- Client-side navigation via `<Link>` goes to wrong URLs
- HMR (hot reload) does not work in dev mode behind proxy

**Phase to address:** Phase 1 (Project Bootstrap / XAMPP Configuration)

---

### Pitfall 5: Tailwind CSS 4 Dark Mode Class Strategy Silently Breaks

**What goes wrong:**
Tailwind v4 changed the default dark mode strategy from `class` to `@media (prefers-color-scheme: dark)`. Projects using the class-based `.dark` toggle (which is required for shadcn/ui's `next-themes` approach) find that dark mode stops working entirely. The `.dark` class gets applied to `<html>` but Tailwind's `dark:` variants have no effect because v4 is listening for the media query instead.

**Why it happens:**
In Tailwind v3, class-based dark mode was common and configured via `darkMode: 'class'` in `tailwind.config.js`. Tailwind v4 removed the JS config file and defaults to media-query dark mode. The migration tool does NOT automatically add the CSS-based dark mode configuration.

**How to avoid:**
Add this custom variant declaration in your main CSS file (e.g., `globals.css`):
```css
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));
```
This tells Tailwind v4 to use the `.dark` class strategy instead of the media query. This single line is the difference between working and broken dark mode in every shadcn/ui project using Tailwind v4.

**Warning signs:**
- Dark mode works only when system preference is dark, ignoring the theme toggle
- `next-themes` `ThemeProvider` with `attribute="class"` has no visible effect
- Dark-mode-specific colors not applying despite `.dark` class on `<html>`

**Phase to address:** Phase 1 (Design System / Tailwind + shadcn/ui Setup)

---

### Pitfall 6: PHP Bridge and Prisma Writing to Same MySQL Tables Without Coordination

**What goes wrong:**
The legacy PHP API (kalkulator2025) and the new Next.js app (kalkulator2026) both read from and write to the same MySQL tables. Without coordination: (a) Prisma migrations can break PHP queries by altering table structures, (b) Row-level locks from PHP `INSERT`/`UPDATE` operations cause Prisma queries to deadlock or timeout, (c) Connection pool exhaustion doubles because both PHP (connection-per-request) and Node.js (connection pool) compete for MySQL's `max_connections`.

**Why it happens:**
The project constraint explicitly states: "Prisma i PHP wspoldziela te sama baze MySQL; zadne migracje schematu bez pelnej analizy wplywu." This dual-write pattern is inherently dangerous. PHP typically opens and closes connections per request (no pooling), while Prisma maintains a persistent pool. Both systems assume they have exclusive write access.

**How to avoid:**
1. NEVER run `prisma migrate dev` or `prisma db push` -- use `prisma db pull` (introspection) only. The PHP app is the schema authority until fully migrated.
2. Baseline the existing schema: `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql` then mark as applied: `npx prisma migrate resolve --applied 0_init`
3. Set MySQL `max_connections = 200` to accommodate both PHP and Node.js pools
4. Use `connection_limit=10` in Prisma's production DATABASE_URL
5. For tables written by both systems, implement optimistic concurrency with `updated_at` timestamps
6. Document which endpoints are migrated vs. still on PHP -- maintain a migration ledger

**Warning signs:**
- Deadlock errors in MySQL error log (`ERROR 1213: Deadlock found`)
- Data inconsistency between PHP and Next.js views of the same record
- Prisma `migrate deploy` ran accidentally in CI, altering the production schema

**Phase to address:** Phase 1 (Database Setup) and ongoing through all migration phases

---

### Pitfall 7: Windows Path Issues in Prisma Schema and Node.js Ecosystem

**What goes wrong:**
Multiple Windows-specific issues compound: (a) Prisma schema validation rejects Windows backslash paths (`file:C:\Users\...`), (b) NTFS path length limits (260 chars) cause failures in deeply nested `node_modules`, (c) Prisma binary engine may not be found when Webpack/Next.js transforms `require()` calls, (d) `EPERM: operation not permitted` errors during Next.js builds scanning protected Windows directories like `Application Data`.

**Why it happens:**
Prisma and most Node.js tooling are developed primarily on Linux/macOS. Windows NTFS has a 260-character path limit by default. Prisma's query engine binary resolution relies on `__dirname` which Webpack transforms. The XAMPP installation at `C:\xampp\htdocs\kalkulator2026` adds significant path prefix length before `node_modules\.prisma\client\...`.

**How to avoid:**
1. Always use forward slashes in Prisma schema: `file:C:/xampp/htdocs/...` (confirmed bug with backslashes)
2. Keep the project path short: `C:\xampp\htdocs\kalkulator2026` is acceptable, but avoid deeper nesting
3. Enable Windows long path support: `reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f`
4. Add webpack ignore for Windows system directories:
```typescript
// next.config.ts
webpack: (config) => {
  config.watchOptions = { ignored: ['**/Application Data', '**/node_modules'] }
  return config
}
```
5. Use Prisma >= 6.8.2 which includes critical Windows-specific fixes
6. If persistent issues: consider WSL for the Node.js dev server while keeping Apache on Windows

**Warning signs:**
- `Schema parsing error: This line is not a valid definition` on datasource url
- `EPERM: operation not permitted, scandir` during `next build`
- `Query engine binary for current platform 'windows' could not be found`
- Prisma generate fails silently or produces incomplete output

**Phase to address:** Phase 1 (Project Bootstrap / Environment Setup)

---

## Moderate Pitfalls

### Pitfall 8: Next.js 15 Async Params -- Silent `undefined` Values

**What goes wrong:**
Next.js 15 changed `params` and `searchParams` from synchronous objects to Promises. Dynamic route pages that worked in Next.js 14 silently return `undefined` for all param values, leading to blank pages, failed database queries, or incorrect data without any error message.

**How to avoid:**
Always `await` params in page components:
```typescript
// WRONG (Next.js 14 pattern)
export default function Page({ params }: { params: { id: string } }) { ... }

// CORRECT (Next.js 15 pattern)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}
```
Apply the same pattern to `searchParams`. This affects every dynamic route, layout, and generateMetadata function.

**Warning signs:**
- Pages that previously worked now show blank content or "undefined" in UI
- Database queries return no results despite correct data existing
- No error thrown, just empty or wrong data

**Phase to address:** Phase 1 (if migrating patterns from any Next.js 14 reference code)

---

### Pitfall 9: Framer Motion in Server Components -- Missing `'use client'` Boundary

**What goes wrong:**
Framer Motion's `motion` components require browser DOM APIs. Using them directly in Server Components (the default in App Router) causes build errors or hydration mismatches. The `data-projection-id` attribute generated by Framer Motion differs between server and client renders, causing React hydration warnings in the console even when components are marked as client components.

**How to avoid:**
1. Install the renamed package: `npm install motion` (not `framer-motion`)
2. Import from `motion/react`: `import { motion } from "motion/react"`
3. Create reusable client wrapper components:
```typescript
// components/motion.tsx
'use client'
export { motion, AnimatePresence } from 'motion/react'
```
4. Import these wrappers in Server Components instead of motion directly
5. Use `suppressHydrationWarning` on motion components if `data-projection-id` warnings persist
6. For performance-critical pages, use `LazyMotion` with feature bundles to reduce bundle size

**Warning signs:**
- "You're importing a component that needs useState" errors
- Console hydration warnings about `data-projection-id` mismatch
- Animations not playing on initial page load (SSR mismatch)
- Build failures referencing `window is not defined`

**Phase to address:** Phase 2 (Design System / Animation Framework)

---

### Pitfall 10: Tailwind CSS 4 Utility Class Renames Break Existing Components

**What goes wrong:**
Tailwind v4 renamed several utility classes. Most critically for a dark glassmorphism UI: `shadow-sm` is now `shadow-xs` (old `shadow` became `shadow-sm`), `rounded-sm` is now `rounded-xs` (old `rounded` became `rounded-sm`), `bg-gradient-to-*` is now `bg-linear-to-*`, `outline-none` is now `outline-hidden`, and border color defaults changed from `gray-200` to `currentColor`.

**How to avoid:**
1. Run the automated upgrade tool first: `npx @tailwindcss/upgrade` (requires Node.js 20+)
2. The tool handles ~80% of renames, but manually verify:
   - All gradient classes (`bg-gradient-to-r` -> `bg-linear-to-r`)
   - All shadow/rounded utilities (size scale shifted)
   - Border color: borders now use `currentColor` by default, so add explicit `border-gray-200` where needed
3. For shadcn/ui: re-add components via CLI after migration: `npx shadcn@latest add button` (CLI will use v4-compatible class names)
4. Replace `tailwindcss-animate` with `tw-animate-css` (shadcn/ui dependency change)

**Warning signs:**
- Borders appear black/dark instead of subtle gray
- Rounded corners and shadows look different (slightly smaller)
- Gradients completely disappear
- Animations from `tailwindcss-animate` stop working

**Phase to address:** Phase 1 (Design System Setup)

---

### Pitfall 11: `useFormStatus` Must Be in a Child Component

**What goes wrong:**
React 19's `useFormStatus` hook is used to show loading states during Server Action execution. Developers place it in the same component as the `<form>` and the `useActionState` hook. It returns `{ pending: false }` permanently, so the submit button never shows a loading state.

**How to avoid:**
`useFormStatus` must be called from a component that is a *child* of the `<form>` element -- it cannot be in the same component that renders the form:
```typescript
// WRONG: same component
function MyForm() {
  const { pending } = useFormStatus() // Always { pending: false }
  return <form action={myAction}><button disabled={pending}>Submit</button></form>
}

// CORRECT: child component
function SubmitButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>{pending ? 'Saving...' : 'Submit'}</button>
}
function MyForm() {
  return <form action={myAction}><SubmitButton /></form>
}
```
Also note: `useFormStatus` does NOT work with React Hook Form's `handleSubmit`. Use `useActionState`'s `isPending` value instead for React Hook Form-based forms.

**Warning signs:**
- Submit buttons never show loading/pending state
- `useFormStatus().pending` is always `false` despite Server Action running
- Loading indicators only work after extracting button to a child component

**Phase to address:** Any phase implementing forms with Server Actions

---

### Pitfall 12: Prisma `db pull` Introspection Misses Relations Without Foreign Keys

**What goes wrong:**
If the existing MySQL schema uses implicit relations (no `FOREIGN KEY` constraints, just matching column names like `user_id`), `prisma db pull` will introspect the tables but NOT generate relation fields. Models will have raw `Int` fields instead of typed relations. All Prisma relation queries (`include`, `select` with nested models) will fail.

**How to avoid:**
1. After running `prisma db pull`, manually verify the generated schema against the actual database structure
2. For tables without foreign keys, manually add relations in the Prisma schema using `@relation`:
```prisma
model Quotation {
  id      Int  @id @default(autoincrement())
  userId  Int  @map("user_id")
  user    User @relation(fields: [userId], references: [id])
}
```
3. These manual additions survive future `db pull` runs (Prisma merges, not overwrites, by default)
4. Map `snake_case` database columns to `camelCase` with `@map`: `userId Int @map("user_id")`
5. Use `@@map` for table names: `@@map("quotation_items")` on model `QuotationItem`
6. Do NOT use `--force` flag with `db pull` as it overwrites manual relation additions

**Warning signs:**
- Models have `Int` fields where you expect typed relations (e.g., `userId Int` instead of `user User`)
- `include: { user: true }` queries fail with "Unknown field 'user'"
- `prisma db pull` output shows `/// This model lacks a relation` warnings

**Phase to address:** Phase 1 (Database Schema Introspection)

---

### Pitfall 13: PM2 on Windows -- Memory Leaks and Restart Loops

**What goes wrong:**
PM2 on Windows has known memory leak issues where the PM2 daemon itself (not the managed Node.js app) accumulates memory over time. Combined with Next.js production builds that can be memory-hungry, this leads to the server running out of memory after days of operation. PM2 restart loops can also occur when file-watching detects changes in the `.next` build output directory.

**How to avoid:**
1. Set memory limits in PM2 ecosystem config:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'kalkulator2026',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false, // CRITICAL: disable file watching in production
    ignore_watch: ['.next', 'node_modules', '.git'],
    env: { NODE_ENV: 'production' }
  }]
}
```
2. Set `watch: false` for production -- file watching causes restart loops when `.next` cache updates
3. Use `max_memory_restart` to auto-restart before OOM
4. Schedule a daily PM2 restart via Windows Task Scheduler as a safety net
5. Monitor with `pm2 monit` and set up alerts for rapid restart patterns
6. Use PM2 >= 6.0.5 (March 2025) which fixes several restart-related issues

**Warning signs:**
- PM2 process memory steadily climbing in `pm2 monit`
- App restarting every few seconds (check `pm2 logs` for rapid restart timestamps)
- Windows Task Manager showing PM2 God Daemon using >200MB RAM

**Phase to address:** Phase 1 (Deployment Configuration)

---

## Minor Pitfalls

### Pitfall 14: shadcn/ui Color Variables Need OKLCH Wrapping in Tailwind v4

**What goes wrong:**
In Tailwind v3 with shadcn/ui, CSS variables used raw space-separated HSL values like `222.2 47.4% 11.2%`. Tailwind v4 requires full color function notation: `oklch(0.145 0 0)` or `hsl(222.2 47.4% 11.2%)`. Using the old raw format causes colors to silently fail -- elements render transparent or with wrong colors.

**How to avoid:**
1. When defining Aether theme colors, always wrap values:
```css
:root {
  --background: oklch(0.05 0.02 270);    /* Near-black #080812 */
  --primary: oklch(0.55 0.25 275);        /* Electric indigo #6366f1 */
  --accent: oklch(0.65 0.15 200);         /* Cyan #06b6d4 */
}
```
2. Map to Tailwind with `@theme inline`:
```css
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
}
```
3. For every `:root` color, define a `.dark` counterpart
4. Use the tweakcn.com editor to generate OKLCH-compatible shadcn themes visually

**Warning signs:**
- Components appear transparent or with wrong colors
- Browser devtools show CSS variable values without `oklch()`/`hsl()` wrapper
- Tailwind utilities like `bg-primary` produce no visual effect

**Phase to address:** Phase 1 (Design System / Aether Theme)

---

### Pitfall 15: Next.js Caching Defaults Changed in v15

**What goes wrong:**
Next.js 15 flipped caching defaults: `fetch` requests, `GET` Route Handlers, and client navigations are NO longer cached by default (they were in v14). This means pages that were fast in v14 prototypes might become slow in v15 because every navigation triggers a fresh server request.

**How to avoid:**
1. Explicitly configure caching strategy for data-heavy pages:
```typescript
// For Route Handlers that should cache
export const revalidate = 3600 // Cache for 1 hour

// For fetch calls
fetch(url, { next: { revalidate: 3600 } })
```
2. Use `unstable_cache` or React's `cache()` for expensive database queries
3. For the Aether dashboard with KPIs, implement ISR (Incremental Static Regeneration) with appropriate revalidation intervals
4. Document caching strategy per route in the codebase

**Warning signs:**
- Pages that were fast become noticeably slow after upgrading to Next.js 15
- Database query count increases dramatically (every page visit = fresh query)
- Network tab shows full page reloads on client navigation

**Phase to address:** Phase 2+ (Performance Optimization)

---

### Pitfall 16: Server Actions Are Public HTTP Endpoints

**What goes wrong:**
Server Actions marked with `'use server'` look like private functions but are actually exposed as POST endpoints that anyone can call. Developers assume the `'use server'` directive adds authentication. Without explicit auth checks inside each action, any user (or automated script) can invoke them directly.

**How to avoid:**
1. Validate, authenticate, and authorize in EVERY Server Action:
```typescript
'use server'
export async function updateProduct(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  if (session.user.role !== 'admin') throw new Error('Forbidden')
  // ... actual logic
}
```
2. Build a reusable `withAuth` wrapper for common authorization patterns
3. Use Zod for input validation in every action -- never trust FormData directly
4. Rate-limit Server Actions for sensitive operations (password changes, payment actions)

**Warning signs:**
- Server Actions that mutate data without calling `auth()` first
- No input validation on FormData in action functions
- Actions accepting user IDs from the client instead of deriving from session

**Phase to address:** All phases (establish pattern in Phase 1)

---

### Pitfall 17: NextAuth v5 Environment Variable Prefix Change

**What goes wrong:**
NextAuth v5 requires `AUTH_` prefix for environment variables. The old `NEXTAUTH_SECRET` and `NEXTAUTH_URL` no longer work. Auth silently fails or throws cryptic errors about missing configuration. `AUTH_URL` is auto-detected in most environments but may need explicit setting behind the Apache ProxyPass.

**How to avoid:**
1. Rename all env vars: `NEXTAUTH_SECRET` -> `AUTH_SECRET`, etc.
2. For the XAMPP ProxyPass setup, explicitly set `AUTH_URL=http://localhost/kalkulator2026` because auto-detection may resolve to `localhost:3001` (the internal port) instead of the proxied URL
3. Set `AUTH_TRUST_HOST=true` since the app runs behind Apache reverse proxy
4. Provider-specific vars follow the pattern `AUTH_[PROVIDER]_ID` and `AUTH_[PROVIDER]_SECRET`

**Warning signs:**
- Auth works in development but fails behind Apache proxy
- Session/token errors mentioning invalid URL or host mismatch
- `NEXTAUTH_URL` still present in `.env` (not renamed)

**Phase to address:** Phase 1 (Auth Setup)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip Prisma relations, use raw SQL for complex joins | Faster initial setup, avoids manual schema work | Loses type safety, bypasses Prisma's query optimization, makes future migrations harder | Never for new code; OK temporarily for the 176 PHP bridge endpoints during migration |
| Use `any` types for PHP API bridge responses | Quick integration with untyped PHP endpoints | Propagates type unsafety through the codebase, hides bugs | Only during initial bridge setup; create typed interfaces incrementally |
| Inline auth checks instead of middleware + DAL pattern | Faster feature development | Inconsistent security, easy to forget checks on new routes | Never -- establish DAL pattern in Phase 1 |
| Skip WebSocket proxy config (disable HMR in dev) | Faster initial XAMPP setup | Painful dev experience, manual page reloads on every change | First day only -- fix WebSocket config immediately |
| Use `suppressHydrationWarning` globally | Silences Framer Motion warnings | Hides real hydration bugs that cause UI inconsistencies | Never globally; OK on specific motion wrapper components only |
| Store session in JWT only (skip database sessions) | Simpler setup, no session table needed | Cannot revoke sessions server-side, logout is client-only | Acceptable for MVP if session revocation is not critical |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| PHP Bridge (`/kalkulator2025/api/`) | Calling PHP endpoints from Server Components without error handling; PHP returns HTML error pages instead of JSON | Always wrap PHP bridge calls in try/catch, validate response Content-Type is JSON, implement circuit-breaker pattern for degraded PHP service |
| MinIO (Product Images) | Using MinIO SDK in client components; hardcoding MinIO URLs that differ between dev/prod | Access MinIO only from Server Components or API Routes; use env vars for endpoint URLs; generate presigned URLs server-side |
| Subiekt GT (ERP Sync) | Running sync in the main request/response cycle, blocking user interactions | Implement sync as background jobs (cron via PM2 or separate worker); use database queues for sync tasks |
| SendGrid (Email) | Importing SendGrid SDK in client bundles; not handling rate limits | Use Route Handlers or Server Actions for email sending; implement exponential backoff for SendGrid API limits |
| Redis (Cache/Sessions) | Assuming Redis is always available; no fallback when Redis is down | Implement graceful degradation: fall back to MySQL sessions if Redis is unavailable; use try/catch on all Redis operations |
| MySQL `mail.allbag.pl` | Assuming local MySQL latency; not accounting for network latency to remote database | Implement connection health checks; use Prisma's `connection_limit` and `pool_timeout` settings; consider read replicas for analytics queries |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Prisma N+1 queries in Server Components | Page load time increases linearly with data volume; dozens of SQL queries for a single page | Use `include` and `select` in Prisma queries; implement DataLoader pattern for lists; review SQL logs in dev (`log: ['query']`) | >50 items on any list page |
| Importing entire icon library | Bundle size explodes to 500KB+; slow initial page loads | Import icons individually: `import { Search } from 'lucide-react'` not `import * as Icons from 'lucide-react'` | Any page with multiple icons |
| Framer Motion bundle without LazyMotion | Full motion bundle (~30KB) loaded on every page even if only one component animates | Use `LazyMotion` with `domAnimation` feature bundle; code-split animation-heavy pages | When targeting mobile users or slow connections |
| Unoptimized glassmorphism (Aether design) | `backdrop-blur` causes GPU compositing on every scroll; janky animations on mid-range hardware | Limit `backdrop-blur` to max 3-4 overlapping layers; use `will-change: transform` sparingly; test on Intel integrated graphics | Any page with >3 overlapping glass elements |
| Server Components re-fetching on every navigation | Dashboard KPIs and charts reload fully on each visit; visible loading spinners | Implement proper caching with `revalidate`; use `React.cache()` for deduplication; consider `loading.tsx` skeletons with streamed data | Dashboard with >5 data-fetching components |
| Large Excel import in main thread | Browser and server freeze during product import; timeout errors | Stream Excel processing with Server Action progress; use worker threads for large files; chunk inserts into 500-row batches | Excel files >1000 rows |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Auth only in middleware (CVE-2025-29927 pattern) | Complete authentication bypass; unauthorized access to all protected routes | Implement defense-in-depth: verify auth in Data Access Layer, not just middleware |
| Server Actions without input validation | SQL injection via Prisma raw queries; XSS via stored user input; prototype pollution | Use Zod schemas for ALL Server Action inputs; never pass raw FormData to Prisma |
| PHP bridge credentials in client-accessible env vars | API keys exposed in browser bundle | Prefix server-only vars with nothing or custom prefix; use `NEXT_PUBLIC_` ONLY for truly public values; verify with `next build` output |
| Shared MySQL user for PHP and Prisma with full privileges | Compromised PHP or Node app can drop/alter any table | Create separate MySQL users: one for PHP (existing), one for Prisma with restricted permissions |
| JWT secret shared between PHP and NextAuth | If PHP's secret is compromised, all NextAuth sessions are compromised | Use separate `AUTH_SECRET` for NextAuth; validate PHP sessions via PHP bridge API call, not shared secret |
| Rate limiting absent on login endpoint | Brute-force password attacks against bcrypt-verified credentials | Implement rate limiting in Server Action or Route Handler (e.g., `upstash/ratelimit`); add exponential backoff after failed attempts |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Full-page loading skeleton for every navigation | App feels slow even when data loads fast; constant visual disruption | Use `loading.tsx` with partial skeletons; implement optimistic updates for mutations; cache dashboard data |
| Glassmorphism overuse (Aether theme) | Text becomes hard to read on transparent backgrounds; accessibility failures | Ensure WCAG 2.1 AA contrast ratios (4.5:1 for text); limit glass effect to decorative panels, not content areas; provide solid fallback backgrounds |
| Animation on every component mount | Page feels chaotic; users with motion sensitivity get nauseous | Respect `prefers-reduced-motion` media query; use `motion.reduce` in Framer Motion; animate only meaningful state transitions, not every mount |
| Dark-only UI without light mode option | Users in bright environments struggle to read; some users have medical conditions requiring light mode | While Aether is dark-first, provide a light theme option from the start; even if dark is default, the CSS variable system makes this trivial |
| Polish-only UI without i18n hooks | Future internationalization requires rewriting every string reference | Even if not translating now, use a string constant pattern or i18n library from day 1; this is nearly free to set up but expensive to retrofit |

## "Looks Done But Isn't" Checklist

- [ ] **Auth system:** Often missing session revocation, password reset email flow, and CSRF protection on Server Actions -- verify all three work end-to-end
- [ ] **RBAC:** Often missing middleware + Server Action + UI triple-check for role-based access -- verify admin-only actions are blocked at all three layers
- [ ] **Apache ProxyPass:** Often missing WebSocket upgrade headers -- verify HMR works in dev, and check `mod_proxy_wstunnel` is loaded
- [ ] **Dark mode:** Often missing consistent dark styles on modals, dropdowns, and toast notifications that render via portals -- verify dark mode in every shadcn component
- [ ] **Prisma schema:** Often missing manual relations for tables without foreign keys -- verify `include` works for all critical entity relationships
- [ ] **PDF export (quotations):** Often works in dev but fails in production due to missing fonts or Puppeteer/Chrome binary path on Windows -- verify PDF generation on the actual XAMPP server
- [ ] **File upload (MinIO):** Often missing file type validation, size limits, and virus scanning -- verify that malicious file uploads are rejected
- [ ] **Form validation:** Often validates on client only, not server -- verify every Server Action validates with Zod before database operations
- [ ] **Error boundaries:** Often missing for Server Component errors -- verify `error.tsx` exists for all route segments
- [ ] **Mobile responsive:** Often forgotten for enterprise internal tools -- verify dashboard and critical workflows work on tablets (common in warehouse use at ALLBAG)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Prisma connection pool exhaustion | LOW | Restart Next.js dev server; implement singleton pattern; set connection_limit in DATABASE_URL |
| Middleware auth bypass (CVE-2025-29927) | MEDIUM | Upgrade Next.js immediately; add Apache header stripping; audit all routes for defense-in-depth auth |
| Wrong Tailwind v4 dark mode strategy | LOW | Add `@custom-variant dark` line to CSS; rebuild; no code changes needed |
| basePath not set (404 on all assets) | LOW | Add `basePath` to next.config.ts; rebuild; update Apache ProxyPass config |
| Prisma schema lost manual relations | MEDIUM | Re-run `db pull` without `--force`; re-add relations from git history; implement schema review in PR process |
| PHP bridge schema conflict | HIGH | Restore MySQL from backup; coordinate schema changes in both systems; implement migration freeze policy |
| bcrypt Edge Runtime crash | LOW | Split auth config into auth.config.ts + auth.ts; rebuild |
| PM2 memory leak crash | LOW | Restart PM2 daemon (`pm2 kill && pm2 resurrect`); configure max_memory_restart; schedule daily restarts |
| Framer Motion hydration failures | LOW | Add 'use client' to motion wrapper components; use suppressHydrationWarning on specific elements |
| Server Actions without auth checks | HIGH | Security audit all actions; implement withAuth wrapper; add automated tests verifying unauthorized access is blocked |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Prisma connection pool exhaustion | Phase 1: Database Setup | `SHOW PROCESSLIST` shows <= connection_limit connections from Node |
| CVE-2025-29927 middleware bypass | Phase 1: Auth Setup | Penetration test with `x-middleware-subrequest` header returns 403 |
| NextAuth v5 bcrypt/Edge split | Phase 1: Auth Setup | `next build` succeeds; middleware runs without native module errors |
| Apache ProxyPass + basePath | Phase 1: XAMPP Config | All `/_next/static` assets load via browser; HMR works in dev |
| Tailwind v4 dark mode strategy | Phase 1: Design System | Toggle dark/light mode; all components respect class-based switching |
| PHP bridge schema coordination | Phase 1: Database Setup | `prisma db pull` matches production schema; no Prisma migrate commands in CI |
| Windows path issues | Phase 1: Environment Setup | `prisma generate` and `next build` succeed on Windows without path errors |
| Async params (Next.js 15) | Phase 1: First Route | Dynamic routes return correct param values |
| Framer Motion RSC boundary | Phase 2: Animation System | Motion components render without hydration errors |
| Tailwind v4 class renames | Phase 1: Design System | Visual audit shows correct shadows, borders, gradients |
| useFormStatus child component | Phase 2+: First Form | Submit button shows loading state during Server Action execution |
| Prisma introspection missing relations | Phase 1: Schema Setup | All critical entity relationships queryable via Prisma `include` |
| PM2 memory management | Phase 1: Deployment | PM2 monit shows stable memory after 24h operation |
| OKLCH color values | Phase 1: Aether Theme | All theme colors render correctly in both light and dark mode |
| Caching defaults changed | Phase 2+: Performance | Dashboard pages use explicit caching; response times are acceptable |
| Server Actions auth | All Phases | No Server Action is callable without valid session |
| NextAuth env var prefix | Phase 1: Auth Setup | Auth works both directly and via Apache ProxyPass |

## Sources

- [Prisma Database Connections Docs](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections) -- HIGH confidence
- [How to Fix Too Many Database Connections in Prisma with Next.js Hot Reload](https://www.timsanteford.com/posts/how-to-fix-too-many-database-connections-opened-in-prisma-with-next-js-hot-reload/) -- MEDIUM confidence
- [CVE-2025-29927: Next.js Middleware Bypass (Picus Security)](https://www.picussecurity.com/resource/blog/cve-2025-29927-nextjs-middleware-bypass-vulnerability) -- HIGH confidence
- [Vercel Postmortem on CVE-2025-29927](https://nextjs.org/blog/cve-2025-29927) -- HIGH confidence
- [Auth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5) -- HIGH confidence
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) -- HIGH confidence
- [shadcn/ui Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) -- HIGH confidence
- [shadcn/ui Theming Docs](https://ui.shadcn.com/docs/theming) -- HIGH confidence
- [App Router Pitfalls (imidef.com)](https://imidef.com/en/2026-02-11-app-router-pitfalls) -- MEDIUM confidence
- [Next.js behind Apache Proxy (GitHub Discussion)](https://github.com/vercel/next.js/discussions/24165) -- MEDIUM confidence
- [Next.js basePath Configuration (Official Docs)](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath) -- HIGH confidence
- [Framer Motion / Motion Upgrade Guide](https://motion.dev/docs/react-upgrade-guide) -- HIGH confidence
- [How to use Framer Motion with Next.js Server Components](https://www.hemantasundaray.com/blog/use-framer-motion-with-nextjs-server-components) -- MEDIUM confidence
- [React 19 Release Blog](https://react.dev/blog/2024/12/05/react-19) -- HIGH confidence
- [useActionState React Docs](https://react.dev/reference/react/useActionState) -- HIGH confidence
- [Server Actions vs Route Handlers (MakerKit)](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers) -- MEDIUM confidence
- [Prisma Windows Path Bug (GitHub #6472)](https://github.com/prisma/prisma/issues/6472) -- HIGH confidence
- [Prisma MySQL 8.4 Support (GitHub #27066)](https://github.com/prisma/prisma/issues/27066) -- MEDIUM confidence
- [Prisma Introspection Docs](https://www.prisma.io/docs/orm/prisma-schema/introspection) -- HIGH confidence
- [PM2 Memory Limit Docs](https://pm2.keymetrics.io/docs/usage/memory-limit/) -- HIGH confidence
- [WorkOS Next.js App Router Auth Guide](https://workos.com/blog/nextjs-app-router-authentication-guide-2026) -- MEDIUM confidence

---
*Pitfalls research for: ALLBAG Kalkulator 2026 -- Next.js 15 Enterprise SaaS on XAMPP Windows*
*Researched: 2026-03-23*
