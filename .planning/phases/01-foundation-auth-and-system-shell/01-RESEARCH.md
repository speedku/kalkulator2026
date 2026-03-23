# Phase 1: Foundation, Auth & System Shell - Research

**Researched:** 2026-03-23
**Domain:** Next.js 15 App Router + Auth.js v5 + Prisma 6 + Tailwind CSS 4 + XAMPP/Apache deployment
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire foundation that every subsequent phase depends on: a working Next.js 15 application deployed on XAMPP behind Apache ProxyPass, with authentication (Auth.js v5 Credentials provider against existing MySQL users table), role-based access control at the DAL level, the Aether design system with glassmorphism tokens, the full app shell (sidebar + topbar), admin user management, audit logging, and the notepad feature. This is the most critical phase because 7 of 17 identified pitfalls must be addressed here, and architectural decisions made now propagate through every subsequent phase.

The existing kalkulator2025 PHP codebase provides a rich reference implementation: the `users` table already has 33+ accounts with bcrypt password hashes (cost 12), the `user_permissions` table uses a page-level access control model (page_id + can_access + can_see), the `activity_log` table has a well-designed enum-based schema, and the `user_notes` table implements a versioned WYSIWYG notepad. The database is hosted on `mail.allbag.pl` (not localhost), which means network latency affects every Server Component render and must be accounted for in the Prisma connection configuration.

A key discovery from examining the existing codebase: the PHP auth system currently has account locking DISABLED (commented out in User.php with note "user request: don't block accounts"), but AUTH-07 requires re-enabling it in the Next.js version with 5 failed attempts / 15-minute lockout. The existing `user_permissions` model is page-based (page_id strings like 'admin-products') rather than action-based (like 'products:read'), and the Prisma schema should preserve this existing model. Email for password reset uses SMTP to `mail.allbag.pl:587` with the `kalkulator@allbag.pl` account.

**Primary recommendation:** Build the foundation in strict dependency order: Prisma db pull + singleton -> Auth.js v5 split config -> middleware + DAL -> Aether theme tokens + shadcn/ui -> app shell (sidebar/topbar) -> admin user management -> audit logging -> notepad. Every layer must be validated before building the next.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can register with email, password, and access code | Existing `users` table schema (bcrypt cost 12, email_verified, access_code_id FK); `access_codes` table with max_uses/current_uses; Auth.js v5 Credentials provider + custom register Server Action |
| AUTH-02 | User can log in with email and password (7-day session) | Auth.js v5 JWT strategy with `maxAge: 7 * 24 * 60 * 60`; split config pattern (auth.config.ts + auth.ts); bcryptjs for password verification |
| AUTH-03 | User can reset password via email link | Existing `reset_token` + `reset_token_expires` columns on users table; Nodemailer SMTP to mail.allbag.pl:587; token generation + hash-then-store pattern from PHP reference |
| AUTH-04 | Session survives browser refresh (JWT) | Auth.js v5 JWT session strategy; `session.strategy: "jwt"` in config; cookies persist across refreshes; AUTH_SECRET env var |
| AUTH-05 | Admin sees admin nav, user sees user nav (RBAC) | Multi-layer RBAC: middleware (optimistic) -> layout (guard) -> DAL (authoritative); existing `user_permissions` table with page_id + can_access + can_see columns |
| AUTH-06 | Admin can manage page-level permissions | Existing `user_permissions` CRUD with `user_permissions_history` audit trail; admin UI for toggling can_access/can_see per user per page |
| AUTH-07 | Account lockout after 5 failed attempts (15 min) | Existing `failed_login_attempts` + `locked_until` columns on users table; currently DISABLED in PHP -- must re-enable in Next.js auth flow |
| AUTH-08 | Admin can create and manage access codes | Existing `access_codes` table with code, description, is_active, max_uses, current_uses, expires_at, created_by; admin CRUD UI |
| SYST-01 | Admin can manage users (CRUD, roles, permissions) | Existing users table; admin panel with user list, role assignment (admin/user enum), activation/deactivation (is_active), permission management |
| SYST-02 | System logs all user activity (audit log) | Existing `activity_log` table with enum activity_type + action, entity tracking, metadata JSON, IP address; ActivityLogger pattern from PHP reference |
| SYST-03 | Admin can view audit log in admin panel | activity_log table with indexes on created_at, activity_type, user_id, entity; paginated list with filtering by type/user/date |
| SYST-04 | System has notepad feature for users | Existing `user_notes` table (one note per user, WYSIWYG), `user_note_versions` (version history), `user_note_tags` (hashtag extraction); sidebar-accessible |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.11 | Full-stack framework (App Router) | Last patched 15.5.x. All CVEs fixed (React2Shell, request smuggling). Pin explicitly -- `npm install next@latest` gives 16.x |
| React | 19.0.4 | UI library | Paired with Next.js 15. Server Components, Server Actions, useOptimistic, useFormStatus |
| React DOM | 19.0.4 | DOM rendering | Must match React version exactly |
| TypeScript | 5.7+ | Type safety | Prisma 6 requires >= 5.1.0. Use whatever ships with create-next-app |
| Node.js | 22.x LTS | Runtime | Maintenance LTS through April 2027. Next.js 15 requires >= 18.17 |

### Authentication & Security

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-auth | 5.0.0-beta.30 | Auth.js v5 | Install with `next-auth@beta`. Credentials provider + JWT sessions. Split config for Edge middleware |
| @auth/prisma-adapter | latest | Prisma adapter for Auth.js | NOT `@next-auth/prisma-adapter` (old package). Optional with JWT strategy but useful for user lookup |
| bcryptjs | 2.4.3 | Password hashing (pure JS) | Verifies existing PHP bcrypt hashes. No C++ build tools needed on Windows. NOT native `bcrypt` |

### Database

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| prisma | 6.19.2 | CLI + schema management | `db pull` for introspection. CLI and client versions MUST match |
| @prisma/client | 6.19.2 | Generated query client | Type-safe queries. Singleton pattern mandatory |

### Styling & Design System

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | 4.2.2 | Utility CSS | CSS-first @theme config for Aether tokens. No tailwind.config.js |
| @tailwindcss/postcss | 4.2.2 | PostCSS integration | Replaces old tailwindcss PostCSS plugin from v3 |
| shadcn/ui CLI | v4 (latest) | Component primitives | `npx shadcn@latest init`. Generates Tailwind v4 compatible components |
| motion | 12.36.x | Animation | Import from `motion/react`. Client components only. For Aether entrance animations |
| lucide-react | latest | Icons | Tree-shakeable. Import individually: `import { Search } from 'lucide-react'` |
| sonner | 2.x | Toast notifications | shadcn/ui's official toast. Zero dependencies |

### Email (for password reset)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nodemailer | 6.x | SMTP email sending | Send password reset and verification emails via mail.allbag.pl:587 |

### Fonts

| Font | Type | Purpose |
|------|------|---------|
| Space Grotesk | Variable (next/font/google) | Display / headings |
| Inter | Variable (next/font/google) | Body text |
| JetBrains Mono | Variable (next/font/google) | Data / monospace |

### Development & Deployment

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| PM2 | 6.0.14 | Process manager | `watch: false` in production. `max_memory_restart: '1G'` |
| Turbopack | built-in | Dev server bundler | `next dev --turbopack` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| bcryptjs | bcrypt (native) | Native is 3x faster but requires C++ build tools on Windows. Pure JS is fast enough for single-digit concurrent logins |
| next-auth (Auth.js v5) | Better Auth | Better Auth is gaining traction but Auth.js has 3.3M weekly downloads and official Next.js integration |
| Nodemailer | @sendgrid/mail | SendGrid is easier but adds external dependency. SMTP to existing mail.allbag.pl is zero-cost and already proven in PHP |

**Installation (Phase 1 only):**
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

# Animation + icons + toast
npm install motion@12 lucide-react sonner@2

# Email
npm install nodemailer
npm install -D @types/nodemailer

# shadcn/ui (CLI, not npm)
npx shadcn@latest init

# Dev dependencies
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D prettier prettier-plugin-tailwindcss
npm install -D eslint eslint-config-next@15
```

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope)

```
src/
  app/
    (auth)/                   # Auth route group (no sidebar)
      layout.tsx              # Centered card layout, particle bg
      login/page.tsx
      register/page.tsx
      forgot-password/page.tsx
      reset-password/page.tsx
    (dashboard)/              # Dashboard route group (full shell)
      layout.tsx              # Sidebar + Topbar + main
      page.tsx                # Placeholder dashboard
      settings/
        users/page.tsx        # Admin: user management
        permissions/page.tsx  # Admin: permission management
        access-codes/page.tsx # Admin: access code management
      audit-log/page.tsx      # Admin: activity log viewer
      notepad/page.tsx        # User: personal notepad
    api/
      auth/[...nextauth]/route.ts  # Auth.js catch-all
    layout.tsx                # Root layout (html, body, fonts, providers)
    not-found.tsx
  components/
    ui/                       # shadcn/ui primitives
    aether/                   # Aether design system wrappers
      glass-card.tsx
      glow-button.tsx
      page-header.tsx
      sidebar-nav.tsx
      stat-card.tsx
    shared/
      providers.tsx           # Client providers wrapper
  lib/
    db.ts                     # Prisma singleton (globalThis)
    dal/
      auth.ts                 # getCurrentUser(), verifySession()
      users.ts                # getUsers(), createUser(), updateUser()
      permissions.ts          # getUserPermissions(), updatePermissions()
      access-codes.ts         # getAccessCodes(), createAccessCode()
      activity-log.ts         # logActivity(), getActivityLog()
      notepad.ts              # getNote(), saveNote(), getNoteVersions()
    actions/
      auth.ts                 # login, logout, register, resetPassword
      users.ts                # CRUD user actions
      permissions.ts          # permission management actions
      access-codes.ts         # access code management actions
      notepad.ts              # save note action
    validations/
      auth.ts                 # loginSchema, registerSchema, resetSchema
      users.ts                # createUserSchema, updateUserSchema
      permissions.ts          # updatePermissionsSchema
      access-codes.ts         # createAccessCodeSchema
    permissions.ts            # RBAC helpers (hasPageAccess, isAdmin)
    utils/
      format.ts               # Date, number formatting
  hooks/
    queries/                  # TanStack Query hooks (Phase 2+)
  stores/
    ui.ts                     # Sidebar collapse, modal state
  types/
    auth.ts                   # Extended session/user types
    database.ts               # Prisma types re-export
  styles/
    globals.css               # Tailwind + @theme Aether tokens
  auth.ts                     # Auth.js full config (Node.js)
  auth.config.ts              # Auth.js edge config (callbacks)
  middleware.ts               # Route protection
prisma/
  schema.prisma               # Introspected + manually enhanced
ecosystem.config.cjs          # PM2 configuration
```

### Pattern 1: Auth.js v5 Split Config (MANDATORY)

**What:** Two auth config files -- `auth.config.ts` (Edge-safe, used by middleware) and `auth.ts` (full Node.js with Prisma + bcryptjs)
**When to use:** Always. This is the only way to use Credentials provider with middleware.

```typescript
// auth.config.ts (Edge-compatible -- NO Prisma, NO bcryptjs imports)
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/register') ||
        nextUrl.pathname.startsWith('/forgot-password') ||
        nextUrl.pathname.startsWith('/reset-password');

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }
      if (!isLoggedIn) return Response.redirect(new URL('/login', nextUrl));
      return true;
    },
  },
  providers: [], // Populated in auth.ts
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 }, // 7 days
} satisfies NextAuthConfig;
```

```typescript
// auth.ts (Full Node.js -- Prisma + bcryptjs safe here)
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcryptjs from 'bcryptjs';
import { authConfig } from './auth.config';
import { prisma } from '@/lib/db';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const email = (credentials.email as string).toLowerCase();
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true, email: true, name: true, passwordHash: true,
            role: true, isActive: true, emailVerified: true,
            failedLoginAttempts: true, lockedUntil: true,
          },
        });
        if (!user || !user.passwordHash) return null;
        if (!user.isActive) return null;
        if (!user.emailVerified) return null;

        // AUTH-07: Check lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        const valid = await bcryptjs.compare(password, user.passwordHash);
        if (!valid) {
          // Increment failed attempts, lock if >= 5
          const newAttempts = user.failedLoginAttempts + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newAttempts,
              ...(newAttempts >= 5 ? {
                lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
              } : {}),
            },
          });
          return null;
        }

        // Reset on success
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null, lastLogin: new Date() },
        });

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
```

```typescript
// middleware.ts
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login|register|forgot-password|reset-password).*)',
  ],
};
```

### Pattern 2: Prisma Singleton with Connection Limit

**What:** Single PrismaClient stored on `globalThis` to survive hot reloads.
**When to use:** Always.

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
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**DATABASE_URL format:**
```
mysql://user:pass@mail.allbag.pl:3306/allbag_kalkulator?connection_limit=5
```
- Dev: `connection_limit=3` (PHP shares the same MySQL)
- Prod: `connection_limit=10`

### Pattern 3: Data Access Layer (DAL) with Page-Level RBAC

**What:** Server-only module where every function verifies the current user before returning data.
**When to use:** Every data access. No exceptions.

```typescript
// lib/dal/auth.ts
import 'server-only';
import { auth } from '@/auth';
import { cache } from 'react';
import { prisma } from '@/lib/db';

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: {
      id: true, email: true, name: true, role: true, isActive: true,
    },
  });
  if (!user || !user.isActive) return null;
  return user;
});

// Page-level permission check (matches existing user_permissions model)
export async function hasPageAccess(pageId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.role === 'admin') return true;

  const permission = await prisma.userPermission.findUnique({
    where: { userId_pageId: { userId: user.id, pageId } },
    select: { canAccess: true },
  });
  return permission?.canAccess ?? false;
}
```

### Pattern 4: Aether Design System with Tailwind CSS 4 @theme

**What:** All Aether visual tokens defined in `@theme` directive. shadcn/ui primitives wrapped with glassmorphism styles.

```css
/* styles/globals.css */
@import "tailwindcss";

/* Class-based dark mode for shadcn/ui + next-themes */
@custom-variant dark (&:is(.dark *));

@theme {
  /* Aether Backgrounds */
  --color-aether-void: #080812;
  --color-aether-sidebar: #0a0a1e;
  --color-aether-elevated: #111133;
  --color-aether-surface: rgba(17, 17, 51, 0.6);

  /* Neon Accents */
  --color-aether-blue: #6366f1;
  --color-aether-cyan: #06b6d4;
  --color-aether-purple: #8b5cf6;
  --color-aether-emerald: #10b981;
  --color-aether-rose: #f43f5e;

  /* Text */
  --color-aether-text: #f0f0ff;
  --color-aether-text-secondary: #a0a0c0;
  --color-aether-text-muted: #606080;

  /* Borders */
  --color-aether-border: rgba(99, 102, 241, 0.15);
  --color-aether-border-glow: rgba(99, 102, 241, 0.4);

  /* Typography */
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter Variable', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Shadows / Glows */
  --shadow-glow-sm: 0 0 10px rgba(99, 102, 241, 0.15);
  --shadow-glow-md: 0 0 20px rgba(99, 102, 241, 0.2);
  --shadow-glow-lg: 0 0 40px rgba(99, 102, 241, 0.3);
  --shadow-glow-cyan: 0 0 20px rgba(6, 182, 212, 0.2);
}

@layer utilities {
  .glass {
    background: var(--color-aether-surface);
    backdrop-filter: blur(12px);
    border: 1px solid var(--color-aether-border);
  }
  .glass-hover:hover {
    border-color: var(--color-aether-border-glow);
    box-shadow: var(--shadow-glow-sm);
  }
}
```

### Pattern 5: Activity Logging (matching existing schema)

**What:** Activity log entries matching the existing `activity_log` table enum structure.

```typescript
// lib/dal/activity-log.ts
import 'server-only';
import { prisma } from '@/lib/db';
import { getCurrentUser } from './auth';

type ActivityType = 'product' | 'container' | 'sync' | 'delivery' | 'auth' | 'system' | 'quotation' | 'user';
type Action = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'complete' | 'error' | 'view' | 'export' | 'import';

export async function logActivity(params: {
  activityType: ActivityType;
  action: Action;
  description: string;
  entityType?: string;
  entityId?: number;
  entityName?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const user = await getCurrentUser();
  await prisma.activityLog.create({
    data: {
      userId: user?.id ?? null,
      activityType: params.activityType,
      action: params.action,
      description: params.description,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}
```

### Anti-Patterns to Avoid

- **Middleware-only auth:** CVE-2025-29927 proved middleware can be bypassed. Always verify in DAL.
- **Direct Prisma calls in page.tsx:** All data access through `lib/dal/`. No exceptions.
- **'use client' on layout.tsx:** Keep layouts as Server Components. Extract interactive parts (sidebar toggle) into small Client Component islands.
- **Callbacks in auth.ts only:** JWT + session callbacks MUST be in `auth.config.ts` so middleware sees role data.
- **Storing server data in Zustand:** For Phase 1, data flows are simple (Server Components -> DAL -> Prisma). TanStack Query comes in Phase 2.
- **Running prisma migrate:** NEVER. Use `prisma db pull` only. PHP shares the database.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom hash function | bcryptjs with cost 12 | Timing-safe comparison, salt generation, proven crypto |
| JWT session management | Custom JWT implementation | Auth.js v5 JWT strategy | Token rotation, CSRF protection, cookie security |
| Form validation | Manual if/else checks | Zod schemas + safeParse | Shared client/server validation, TypeScript type inference |
| Toast notifications | Custom notification system | sonner (via shadcn/ui) | Animations, promise toasts, accessibility |
| Email sending | Custom SMTP socket code | nodemailer | Connection pooling, TLS, error handling, template support |
| WYSIWYG editor | Custom contenteditable wrapper | TipTap (recommended for notepad) | Collaborative extensions, markdown shortcuts, schema validation |
| Data tables | Custom table component | @tanstack/react-table + shadcn wrapper | Sorting, filtering, pagination, column pinning -- all headless |
| Rate limiting | Custom counter | `failed_login_attempts` + `locked_until` columns | Already in DB schema; simple increment + timestamp comparison |

**Key insight:** The existing PHP codebase already solved most of these problems. The Next.js version should replicate the same behavior using modern libraries, not re-invent the business logic.

## Common Pitfalls

### Pitfall 1: Prisma Connection Pool Exhaustion
**What goes wrong:** Each hot reload in dev creates a new PrismaClient with ~9 connections. After ~11 reloads, MySQL's max_connections is exhausted. Extra dangerous because PHP shares the same MySQL instance.
**Why it happens:** Next.js hot reload resets module scope but doesn't close old connections.
**How to avoid:** globalThis singleton pattern in lib/db.ts + `connection_limit=3` in dev DATABASE_URL. Set MySQL `max_connections >= 200`.
**Warning signs:** `Error: Too many connections` after rapid file saves.

### Pitfall 2: CVE-2025-29927 Middleware Auth Bypass
**What goes wrong:** Attackers bypass all middleware by sending `x-middleware-subrequest` header.
**Why it happens:** Next.js internal header was not stripped from external requests before 15.2.3.
**How to avoid:** Use Next.js >= 15.5.11 (patched). Add Apache header stripping: `RequestHeader unset x-middleware-subrequest`. Verify auth in DAL, not just middleware.
**Warning signs:** Auth checks only in middleware.ts with no DAL verification.

### Pitfall 3: Auth.js v5 bcrypt + Edge Runtime
**What goes wrong:** Build fails with "Module not found: Can't resolve 'bcrypt'" because middleware runs in Edge Runtime.
**Why it happens:** Credentials provider with bcryptjs is imported transitively by middleware if not split.
**How to avoid:** Split config: auth.config.ts (Edge-safe) + auth.ts (Node.js with bcryptjs). Middleware imports ONLY auth.config.ts.
**Warning signs:** Build error mentioning Edge Runtime and native modules.

### Pitfall 4: Apache ProxyPass + basePath Mismatch
**What goes wrong:** HTML renders but all CSS/JS/images return 404 -- page appears unstyled.
**Why it happens:** Without `basePath: '/kalkulator2026'`, Next.js generates asset URLs starting from `/` instead of `/kalkulator2026/`.
**How to avoid:** Set `basePath: '/kalkulator2026'` in next.config.ts. Apache: `ProxyPass /kalkulator2026 http://127.0.0.1:3001/kalkulator2026`. Enable mod_proxy + mod_proxy_http.
**Warning signs:** Page loads but white/unstyled. Browser console shows 404 for /_next/static resources.

### Pitfall 5: Tailwind CSS 4 Dark Mode Strategy
**What goes wrong:** Dark mode stops working. The `.dark` class on `<html>` has no effect.
**Why it happens:** Tailwind v4 defaults to media-query dark mode. Class-based dark mode (needed for next-themes/shadcn) requires explicit config.
**How to avoid:** Add `@custom-variant dark (&:is(.dark *));` in globals.css immediately after `@import "tailwindcss"`.
**Warning signs:** Dark mode only works when system preference is dark, ignoring toggle.

### Pitfall 6: Prisma db pull Missing Relations
**What goes wrong:** `prisma db pull` generates flat Int fields instead of typed relations because the MySQL schema lacks some FOREIGN KEY constraints.
**Why it happens:** Prisma only generates relations for columns with actual FK constraints.
**How to avoid:** After `db pull`, manually verify and add `@relation` annotations. Use `@map("snake_case")` for camelCase. Do NOT use `--force` flag (overwrites manual additions).
**Warning signs:** `include: { user: true }` queries fail.

### Pitfall 7: NextAuth v5 Environment Variable Prefix
**What goes wrong:** Auth silently fails or throws cryptic errors.
**Why it happens:** v5 requires `AUTH_` prefix. `NEXTAUTH_SECRET` no longer works.
**How to avoid:** Use `AUTH_SECRET`, `AUTH_URL=http://localhost/kalkulator2026`, `AUTH_TRUST_HOST=true` (behind reverse proxy).
**Warning signs:** Auth works direct but fails behind Apache proxy.

### Pitfall 8: Next.js 15 Async Params
**What goes wrong:** Dynamic route pages silently return undefined for all param values.
**Why it happens:** Next.js 15 changed params from sync objects to Promises.
**How to avoid:** Always `await params` in page components: `const { id } = await params;`
**Warning signs:** Pages show blank content or "undefined" without errors.

### Pitfall 9: Windows Path Issues
**What goes wrong:** Prisma schema validation rejects backslash paths. EPERM errors during builds.
**Why it happens:** Prisma/Node.js tooling developed primarily on Linux/macOS.
**How to avoid:** Use forward slashes everywhere. Enable Windows long path support. Keep project path short (C:/xampp/htdocs/kalkulator2026 is acceptable).
**Warning signs:** "Schema parsing error" or "EPERM: operation not permitted".

### Pitfall 10: PM2 on Windows Memory Leaks
**What goes wrong:** PM2 daemon accumulates memory over days; restart loops when watching .next directory.
**Why it happens:** PM2 Windows support is less battle-tested than Linux.
**How to avoid:** Set `watch: false`, `max_memory_restart: '1G'`, use standalone output (`server.js` not `next start`). Schedule daily restart via Task Scheduler.
**Warning signs:** PM2 daemon using >200MB RAM; rapid restarts in logs.

## Code Examples

### next.config.ts
```typescript
// Source: Next.js docs + STACK.md research
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/kalkulator2026',
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
```

### Apache httpd.conf Addition
```apache
# Enable required modules
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule headers_module modules/mod_headers.so

# CVE-2025-29927 mitigation
RequestHeader unset x-middleware-subrequest

# Next.js reverse proxy
ProxyRequests Off
ProxyPreserveHost On

<Location /kalkulator2026>
    ProxyPass http://127.0.0.1:3001/kalkulator2026
    ProxyPassReverse http://127.0.0.1:3001/kalkulator2026
</Location>

# Dev only: WebSocket for HMR
# LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
# <Location /kalkulator2026/_next/webpack-hmr>
#     ProxyPass ws://127.0.0.1:3001/kalkulator2026/_next/webpack-hmr
# </Location>
```

### PM2 Ecosystem Config
```javascript
// ecosystem.config.cjs
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
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['.next', 'node_modules', '.git'],
  }],
};
```

### .env File Template
```bash
# Database (mail.allbag.pl -- remote, not localhost!)
DATABASE_URL="mysql://nextjs_user:password@mail.allbag.pl:3306/allbag_kalkulator?connection_limit=5"

# Auth.js v5 (AUTH_ prefix, NOT NEXTAUTH_)
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost/kalkulator2026"
AUTH_TRUST_HOST=true

# Email (SMTP for password reset)
SMTP_HOST="mail.allbag.pl"
SMTP_PORT=587
SMTP_USER="kalkulator@allbag.pl"
SMTP_PASS="[from existing config]"
SMTP_FROM="kalkulator@allbag.pl"
```

### Prisma Schema (expected after db pull + manual enhancement)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id                    Int       @id @default(autoincrement())
  email                 String    @unique
  passwordHash          String    @map("password_hash")
  name                  String?
  role                  String    @default("user") // enum: admin, user
  accessCodeId          Int?      @map("access_code_id")
  isActive              Boolean   @default(true) @map("is_active")
  emailVerified         Boolean   @default(false) @map("email_verified")
  verificationToken     String?   @map("verification_token")
  verificationTokenExpires DateTime? @map("verification_token_expires")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  lastLogin             DateTime? @map("last_login")
  failedLoginAttempts   Int       @default(0) @map("failed_login_attempts")
  lockedUntil           DateTime? @map("locked_until")
  resetToken            String?   @map("reset_token")
  resetTokenExpires     DateTime? @map("reset_token_expires")

  // Relations
  accessCode            AccessCode? @relation(fields: [accessCodeId], references: [id])
  permissions           UserPermission[]
  activityLogs          ActivityLog[]
  notes                 UserNote[]
  permissionsHistory    UserPermissionsHistory[] @relation("changed_user")

  @@map("users")
}

model AccessCode {
  id          Int       @id @default(autoincrement())
  code        String    @unique
  description String?
  isActive    Boolean   @default(true) @map("is_active")
  maxUses     Int       @default(1) @map("max_uses")
  currentUses Int       @default(0) @map("current_uses")
  createdAt   DateTime  @default(now()) @map("created_at")
  expiresAt   DateTime? @map("expires_at")
  createdBy   Int?      @map("created_by")

  users       User[]

  @@map("access_codes")
}

model UserPermission {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  pageId    String   @map("page_id")
  canAccess Boolean  @default(false) @map("can_access")
  canSee    Boolean  @default(true) @map("can_see")
  grantedAt DateTime @default(now()) @map("granted_at")
  grantedBy Int?     @map("granted_by")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, pageId], name: "unique_user_page")
  @@map("user_permissions")
}

model UserPermissionsHistory {
  id             Int      @id @default(autoincrement())
  userId         Int      @map("user_id")
  pageId         String   @map("page_id")
  canAccess      Boolean  @map("can_access")
  canSee         Boolean? @map("can_see")
  changedBy      Int      @map("changed_by")
  changedByEmail String   @map("changed_by_email")
  action         String   // enum: granted, revoked
  changedAt      DateTime @default(now()) @map("changed_at")
  ipAddress      String?  @map("ip_address")
  userAgent      String?  @map("user_agent")
  sessionId      String?  @map("session_id")

  user           User     @relation("changed_user", fields: [userId], references: [id])

  @@map("user_permissions_history")
}

model ActivityLog {
  id           Int      @id @default(autoincrement())
  userId       Int?     @map("user_id")
  activityType String   @map("activity_type") // enum: product,container,sync,delivery,auth,system,quotation,user
  action       String   // enum: create,update,delete,login,logout,complete,error,view,export,import
  entityType   String?  @map("entity_type")
  entityId     Int?     @map("entity_id")
  entityName   String?  @map("entity_name")
  description  String
  metadata     String?  // JSON string
  ipAddress    String?  @map("ip_address")
  userAgent    String?  @map("user_agent")
  createdAt    DateTime @default(now()) @map("created_at")

  user         User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("activity_log")
}

model UserNote {
  id             Int      @id @default(autoincrement())
  userId         Int      @unique @map("user_id")
  content        String?  @db.LongText
  contentPlain   String?  @map("content_plain") @db.Text
  tags           String?  @db.LongText // JSON
  wordCount      Int      @default(0) @map("word_count")
  characterCount Int      @default(0) @map("character_count")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  versions       UserNoteVersion[]

  @@map("user_notes")
}

model UserNoteVersion {
  id            Int      @id @default(autoincrement())
  noteId        Int      @map("note_id")
  userId        Int      @map("user_id")
  content       String   @db.LongText
  contentPlain  String?  @map("content_plain") @db.Text
  tags          String?  @db.LongText // JSON
  wordCount     Int      @default(0) @map("word_count")
  characterCount Int     @default(0) @map("character_count")
  versionNumber Int      @map("version_number")
  createdAt     DateTime @default(now()) @map("created_at")

  note          UserNote @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@map("user_note_versions")
}

model LoginLog {
  id              Int      @id @default(autoincrement())
  userId          Int?     @map("user_id")
  email           String
  loginStatus     String   @map("login_status") // enum: success, failed, locked
  ipAddress       String?  @map("ip_address")
  userAgent       String?  @map("user_agent") @db.Text
  sessionId       String?  @map("session_id")
  loginAt         DateTime @default(now()) @map("login_at")
  logoutAt        DateTime? @map("logout_at")
  durationSeconds Int?     @map("duration_seconds")
  failedReason    String?  @map("failed_reason")

  @@map("login_logs")
}

model UserWidgetPermission {
  id                 Int      @id @default(autoincrement())
  userId             Int      @unique @map("user_id")
  widgetPacker       Boolean  @default(true) @map("widget_packer")
  widgetSales        Boolean  @default(false) @map("widget_sales")
  widgetOrders       Boolean  @default(false) @map("widget_orders")
  widgetPackingQueue Boolean  @default(true) @map("widget_packing_queue")
  widgetEfficiency   Boolean  @default(false) @map("widget_efficiency")
  widgetSystemStatus Boolean  @default(false) @map("widget_system_status")
  grantedBy          Int?     @map("granted_by")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  @@map("user_widget_permissions")
}

model UserNoteTag {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  tagName    String   @map("tag_name")
  usageCount Int      @default(1) @map("usage_count")
  lastUsedAt DateTime @updatedAt @map("last_used_at")

  @@unique([userId, tagName], name: "idx_user_tag")
  @@map("user_note_tags")
}
```

**IMPORTANT:** This is the expected schema after manual enhancement. The actual `prisma db pull` output will have raw column names. Manual @map annotations and @relation additions are required.

### Sidebar Navigation Config (migrated from PHP)

The existing `admin-sidebar-config.php` has 15 top-level menu items. For Phase 1, the sidebar should show all items but filter visibility based on `user_permissions.can_see`. The page_id values from the PHP config map directly to the `page_id` column in `user_permissions`:

```typescript
// Phase 1 sidebar items (subset -- full list from PHP config)
export const sidebarItems = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard', pageId: 'admin-panel' },
  { label: 'Produkty', href: '/products', icon: 'Package', pageId: 'admin-products' },
  { label: 'Dostawy', href: '/deliveries', icon: 'Truck', pageId: 'admin-deliveries-hub', children: [...] },
  { label: 'Cenniki i marze', href: '/price-lists', icon: 'Tags', pageId: 'admin-price-lists' },
  { label: 'Wyceny', href: '/quotations', icon: 'FileText', pageId: 'admin-quotations' },
  { label: 'Notatnik', href: '/notepad', icon: 'StickyNote', pageId: 'admin-notepad' },
  { label: 'Uzytkownicy', href: '/settings/users', icon: 'Users', pageId: 'admin-users' },
  { label: 'Raporty', href: '/analytics', icon: 'BarChart3', pageId: 'admin-reports', children: [...] },
  { label: 'Ustawienia', href: '/settings', icon: 'Settings', pageId: 'admin-settings' },
  // ... more items added in later phases
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@tailwind base/components/utilities` | `@import "tailwindcss"` | Tailwind v4 (Jan 2025) | Single import replaces three directives |
| `tailwind.config.js` | `@theme {}` in CSS | Tailwind v4 | No JS config file. Tokens are CSS custom properties |
| `darkMode: 'class'` in config | `@custom-variant dark (&:is(.dark *))` | Tailwind v4 | Must add explicitly or dark mode breaks |
| `getServerSession()` | `auth()` | Auth.js v5 | Single function for session access |
| `NEXTAUTH_SECRET` | `AUTH_SECRET` | Auth.js v5 | Prefix changed; old vars silently ignored |
| `framer-motion` package | `motion` package | Motion 12 (2024) | Import from `motion/react` |
| `import { motion } from "framer-motion"` | `import { motion } from "motion/react"` | Motion 12 | New package name, new import path |
| Sync `params` in pages | `await params` (Promise) | Next.js 15 | Silent undefined if not awaited |
| Cached by default (fetch, routes) | Uncached by default | Next.js 15 | Must explicitly opt into caching |
| `Buffer` for Prisma Bytes | `Uint8Array` | Prisma 6 | Breaking change for binary data |
| `shadow-sm` | `shadow-xs` (size scale shifted) | Tailwind v4 | All shadow/rounded classes shifted one size down |

**Deprecated/outdated:**
- `@next-auth/prisma-adapter`: Use `@auth/prisma-adapter` instead
- `next-auth@4.x`: Does not support Next.js 15 App Router properly
- `framer-motion` package: Renamed to `motion`, still works but is legacy
- `tailwindcss-animate`: Replaced by `tw-animate-css` for shadcn/ui + Tailwind v4
- `react-hook-form@8.0.0-beta`: Not production-ready, stay on v7

## Existing Database Schema Details

The following tables already exist in MySQL on `mail.allbag.pl` and are relevant to Phase 1:

| Table | Rows (Jan 2026) | Key Details |
|-------|-----------------|-------------|
| `users` | 33+ | bcrypt cost 12 hashes, email_verified flag, failed_login_attempts + locked_until (lockout currently DISABLED in PHP) |
| `access_codes` | 1 | code 'ALLBAG2025' with max_uses=1000, current_uses=11 |
| `user_permissions` | ~2749 | page_id + can_access + can_see model. One row per user per page. FK to users ON DELETE CASCADE |
| `user_permissions_history` | ~252 | Audit trail for permission changes with changed_by, action (granted/revoked), ip_address |
| `activity_log` | 20+ | Enum-based activity_type and action. JSON metadata. FK to users ON DELETE SET NULL |
| `login_logs` | 1785+ | Login/logout tracking with session_id, duration_seconds, failed_reason |
| `user_notes` | ~10 | One note per user (UNIQUE on user_id). WYSIWYG content + plaintext. FK CASCADE |
| `user_note_versions` | ~160 | Version history with version_number. FK CASCADE to user_notes |
| `user_note_tags` | ~855 | Extracted hashtags with usage_count |
| `user_widget_permissions` | ~95 | Widget-level visibility per user (packer, sales, orders, etc.) |

**CRITICAL: No `permission_groups`, `group_permissions`, or `user_group_memberships` tables exist in the database** despite being referenced in Session.php. The PHP code handles their absence gracefully (queries wrapped in try/catch). The Next.js implementation should use only the existing `user_permissions` model (direct user-to-page mapping, no groups).

## Open Questions

1. **Database user credentials for Prisma**
   - What we know: PHP uses credentials defined in config.php to connect to `mail.allbag.pl`
   - What's unclear: Should Prisma use the same MySQL user or a separate one with restricted permissions?
   - Recommendation: Create a separate `nextjs_kalkulator` MySQL user with SELECT/INSERT/UPDATE/DELETE on `allbag_kalkulator` (no ALTER, DROP, CREATE). More secure if one system is compromised.

2. **Email verification flow in Next.js**
   - What we know: PHP has email_verified flag and verification_token columns. Users in DB already have email_verified=1.
   - What's unclear: Should new registrations in kalkulator2026 require email verification (as PHP does)?
   - Recommendation: Yes, replicate the PHP behavior -- registration sends verification email, user must click link before first login. Existing verified users are unaffected.

3. **Notepad WYSIWYG editor choice**
   - What we know: PHP notepad uses a WYSIWYG editor storing HTML in content column.
   - What's unclear: Which React WYSIWYG editor to use.
   - Recommendation: Use TipTap (based on ProseMirror). It is the de facto standard for React WYSIWYG editors, has excellent headless architecture for Aether styling, and supports markdown shortcuts. Alternative: BlockNote (simpler, Notion-like). Do NOT use draft.js (deprecated) or Quill (limited React 19 support).

4. **Network latency to mail.allbag.pl**
   - What we know: Database is on mail.allbag.pl (remote), not localhost.
   - What's unclear: Actual network latency from the XAMPP server to mail.allbag.pl.
   - Recommendation: Measure with `ping mail.allbag.pl` from the XAMPP server. If > 10ms, consider implementing React.cache() aggressively for getCurrentUser() and other frequently-called DAL functions. If > 50ms, consider a Redis caching layer.

## Sources

### Primary (HIGH confidence)
- [Auth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5) - Split config pattern, env var changes
- [Auth.js Edge Compatibility Guide](https://authjs.dev/guides/edge-compatibility) - Edge runtime workarounds for database adapters
- [Next.js basePath docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath) - Subdirectory deployment
- [Next.js standalone output docs](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output) - PM2 deployment
- [Tailwind CSS v4 theme docs](https://tailwindcss.com/docs/theme) - @theme directive
- [Tailwind CSS v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide) - Dark mode, class renames
- [Prisma Connection Management docs](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections) - Singleton, connection pool
- [CVE-2025-29927 Vercel Postmortem](https://nextjs.org/blog/cve-2025-29927) - Middleware bypass
- [Next.js Proxy Configuration (Dec 2025)](https://nextjs.org/docs/app/getting-started/proxy) - Official reverse proxy guidance
- Existing MySQL database backup (allbag_kalkulator, Jan 2026) - Table schemas verified directly
- kalkulator2025/includes/auth/Session.php - RBAC contract, page access model
- kalkulator2025/includes/auth/User.php - Registration, authentication, password reset
- kalkulator2025/includes/auth/Mailer.php - SMTP configuration (mail.allbag.pl:587)
- kalkulator2025/includes/admin-sidebar-config.php - Navigation structure with page_ids

### Secondary (MEDIUM confidence)
- [Auth.js v5 Next.js Reference](https://authjs.dev/reference/nextjs) - NextAuth() API
- [Next.js behind Apache proxy (GitHub)](https://github.com/vercel/next.js/discussions/52426) - Community configuration examples
- [Apache Reverse Proxy for Next.js (Medium)](https://medium.com/@tapanrachchh/configure-apache-reverse-proxy-for-next-js-subdir-deployment-acd634e2603f) - Step-by-step Apache config
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) - Component library Tailwind v4 integration

### Tertiary (LOW confidence)
- Auth.js v5 stable release timeline - Still beta after 2+ years. API stable, tag is not.
- TipTap for notepad WYSIWYG - Recommendation based on ecosystem dominance; verify React 19 compatibility before selecting.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified via npm registry and official docs
- Architecture: HIGH - DAL pattern verified against CVE postmortem; split config verified against Auth.js Edge Compatibility guide; project structure validated against existing PHP codebase contracts
- Pitfalls: HIGH - 10 phase-relevant pitfalls catalogued with specific prevention strategies; all verified across multiple sources
- Database schema: HIGH - Actual table definitions read from January 2026 database backup; column names and types confirmed
- Existing codebase contracts: HIGH - PHP auth system read directly; sidebar config, activity logger, notepad migration all verified

**Research date:** 2026-03-23
**Valid until:** 2026-04-22 (30 days -- stable ecosystem, all libraries are released versions)
