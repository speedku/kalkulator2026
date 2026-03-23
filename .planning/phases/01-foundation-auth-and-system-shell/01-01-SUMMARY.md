---
phase: 01-foundation-auth-and-system-shell
plan: "01"
subsystem: auth
tags: [next.js, auth.js, prisma, tailwind, jwt, bcryptjs, typescript, mysql, pm2, aether]

requires: []
provides:
  - "Next.js 15.5.11 project with App Router, TypeScript, Tailwind CSS 4 running at basePath /kalkulator2026"
  - "Prisma 6.19.2 client with 10-model schema mapping existing MySQL tables on mail.allbag.pl"
  - "Auth.js v5 split config: Edge-safe auth.config.ts + Node.js auth.ts with Credentials provider"
  - "JWT session strategy with 7-day maxAge and account lockout (5 attempts, 15 min)"
  - "Route protection middleware using Edge-safe auth.config.ts"
  - "DAL pattern with getCurrentUser() (cached), hasPageAccess(), requireAuth(), requireAdmin()"
  - "Activity logging function matching existing activity_log table enum structure"
  - "Aether design tokens via @theme directive (bg-aether-void, text-aether-text, etc.)"
  - "Glassmorphism utilities (.glass, .glass-hover, .neon-glow)"
  - "PM2 ecosystem config for standalone server.js deployment"
  - "Zod v4 validation schemas for all auth forms"
affects:
  - "02-login-and-auth-ui"
  - "03-app-shell-sidebar-topbar"
  - "all subsequent phases (auth DAL, Prisma types, design tokens)"

tech-stack:
  added:
    - "next@15.5.11 (pinned to last patched 15.5.x)"
    - "react@19.0.4 + react-dom@19.0.4"
    - "next-auth@5.0.0-beta.30 (Auth.js v5)"
    - "@auth/prisma-adapter@2.11.1"
    - "bcryptjs@3.0.3 (pure JS, no native build tools)"
    - "prisma@6.19.2 + @prisma/client@6.19.2"
    - "tailwindcss@4.2.2 + @tailwindcss/postcss@4.2.2"
    - "motion@12.38.0 (was framer-motion, import from motion/react)"
    - "lucide-react@0.577.0"
    - "sonner@2.0.7"
    - "nodemailer@7.0.13"
    - "zod@4.3.6"
    - "server-only@0.0.1"
  patterns:
    - "Auth.js v5 split config: auth.config.ts (Edge-safe) + auth.ts (Node.js with Prisma)"
    - "Middleware imports ONLY from auth.config.ts to prevent Edge runtime bcryptjs/Prisma crash"
    - "Prisma singleton with globalThis pattern to prevent connection pool exhaustion on hot reload"
    - "DAL server-only pattern with React cache() for getCurrentUser deduplication"
    - "Tailwind v4 @theme directive for design tokens (no tailwind.config.js)"
    - "@custom-variant dark (&:is(.dark *)) for class-based dark mode"
    - "basePath: /kalkulator2026 for Apache ProxyPass reverse proxy deployment"

key-files:
  created:
    - "src/auth.config.ts - Edge-safe Auth.js config with JWT/session callbacks"
    - "src/auth.ts - Full Auth.js config with Credentials provider + account lockout"
    - "src/middleware.ts - Route protection (Edge runtime safe)"
    - "src/app/api/auth/[...nextauth]/route.ts - Auth.js catch-all handler"
    - "src/lib/db.ts - Prisma singleton with globalThis pattern"
    - "src/lib/dal/auth.ts - getCurrentUser, hasPageAccess, requireAuth, requireAdmin"
    - "src/lib/dal/activity-log.ts - logActivity() for audit trail"
    - "src/lib/permissions.ts - ADMIN_ONLY_PAGES, isAdminPage() RBAC helpers"
    - "src/lib/validations/auth.ts - Zod v4 schemas (login, register, forgotPassword, resetPassword)"
    - "src/styles/globals.css - Aether @theme tokens + shadcn/ui dark mode CSS variables"
    - "src/app/layout.tsx - Root layout with Space Grotesk, Inter, JetBrains Mono fonts"
    - "src/components/shared/providers.tsx - SessionProvider + Sonner Toaster"
    - "src/app/not-found.tsx - 404 page with Aether styling"
    - "src/types/auth.ts - ExtendedUser, AuthUser, UserRole types"
    - "src/types/next-auth.d.ts - Module augmentation for session.user.id and role"
    - "prisma/schema.prisma - 10 models: User, AccessCode, UserPermission, UserPermissionsHistory, ActivityLog, UserNote, UserNoteVersion, LoginLog, UserWidgetPermission, UserNoteTag"
    - "ecosystem.config.cjs - PM2 config for standalone server.js on port 3001"
    - ".env.example - All required environment variables documented"
  modified:
    - "next.config.ts - basePath, output standalone, reactStrictMode, serverExternalPackages bcryptjs"
    - "package.json - all Phase 1 dependencies pinned, postinstall prisma generate"
    - "src/app/globals.css - now imports from src/styles/globals.css"

key-decisions:
  - "bcryptjs 3.0.3 installed (plan specified 2.4.3 but 3.x is backward compatible, same API)"
  - "nodemailer@7 instead of latest 8 (auth/core requires peerOptional ^7.0.7)"
  - "src/app/globals.css kept but delegates to src/styles/globals.css via @import for compatibility"
  - "Prisma postinstall hook added (prisma generate) to prevent client initialization errors in deployments"
  - "Auth.js split config pattern enforced: middleware.ts imports ONLY auth.config.ts"
  - "Aether dark mode CSS variables overlay shadcn/ui variables for consistent dark-only theme"

requirements-completed: [AUTH-02, AUTH-04, AUTH-07, SYST-02]

duration: 13min
completed: "2026-03-23"
---

# Phase 1 Plan 01: Foundation Bootstrap Summary

**Next.js 15.5.11 with Auth.js v5 split config (Credentials+JWT), Prisma 6 schema for 10 existing MySQL tables, Aether design tokens, and PM2/Apache deployment config**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-23T10:07:42Z
- **Completed:** 2026-03-23T10:20:42Z
- **Tasks:** 2
- **Files modified:** 22

## Accomplishments
- Scaffolded Next.js 15.5.11 with all Phase 1 dependencies pinned (next-auth@beta, prisma@6.19.2, tailwindcss@4.2.2, zod@4)
- Built Auth.js v5 split config with account lockout (AUTH-07): Edge-safe auth.config.ts + Node.js auth.ts with bcryptjs Credentials provider
- Created Prisma schema with all 10 models matching existing MySQL tables on mail.allbag.pl with @map annotations and @relation directives
- Established DAL pattern (server-only guard + React cache) with getCurrentUser, hasPageAccess, requireAuth, requireAdmin
- Applied Aether design tokens via Tailwind v4 @theme directive with glassmorphism utilities and dark mode CSS variables

## Task Commits

1. **Task 1: Scaffold Next.js 15 project** - `fffdc6b` (feat)
2. **Task 2: Auth.js v5 split config, middleware, DAL, activity logging** - `cb9ee38` (feat)

## Files Created/Modified
- `src/auth.config.ts` - Edge-safe Auth.js config with JWT callbacks and authorized guard
- `src/auth.ts` - Full Auth.js with Credentials provider, bcryptjs verify, account lockout logic
- `src/middleware.ts` - Route protection importing ONLY auth.config.ts (Edge runtime safe)
- `src/app/api/auth/[...nextauth]/route.ts` - Auth.js catch-all GET/POST handler
- `src/lib/db.ts` - Prisma singleton using globalThis (prevents connection exhaustion on hot reload)
- `src/lib/dal/auth.ts` - getCurrentUser (React cache), hasPageAccess, requireAuth, requireAdmin
- `src/lib/dal/activity-log.ts` - logActivity() matching existing activity_log table enum structure
- `src/lib/permissions.ts` - ADMIN_ONLY_PAGES array and isAdminPage() helper
- `src/lib/validations/auth.ts` - Zod v4 schemas for login, register, forgotPassword, resetPassword
- `src/styles/globals.css` - Aether @theme tokens + shadcn/ui dark mode CSS variables
- `src/app/layout.tsx` - Root layout with Space Grotesk/Inter/JetBrains Mono via next/font/google
- `src/components/shared/providers.tsx` - SessionProvider + Sonner Toaster client component
- `prisma/schema.prisma` - 10 models with @map and @relation annotations

## Decisions Made
- Used bcryptjs 3.0.3 (latest compatible 3.x) instead of pinned 2.4.3 - API is identical, backward compatible
- Used nodemailer@7 to satisfy @auth/core peerOptional constraint (8.x caused ERESOLVE conflicts)
- Kept `src/app/globals.css` as a re-export of `src/styles/globals.css` for Next.js App Router convention compatibility
- Added `postinstall: prisma generate` to package.json to prevent client initialization errors after npm install
- Aether dark mode CSS variables overlay the shadcn/ui default variables in `.dark` class, so shadcn components automatically use Aether palette

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Ran prisma generate after schema creation**
- **Found during:** Task 2 (Auth.js config imports prisma client)
- **Issue:** `@prisma/client did not initialize yet` build error - prisma generate must run before build
- **Fix:** Ran `npx prisma generate`, added `postinstall` hook and `prisma generate &&` to build script
- **Files modified:** package.json
- **Verification:** Build succeeded after generation, client import works
- **Committed in:** cb9ee38 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for correct build - no scope creep.

## Issues Encountered
- `create-next-app` refused non-empty directory: moved .claude, .planning, .playwright-mcp temporarily, scaffolded, restored. No data lost.
- `@next/swc-win32-x64-msvc@15.5.11` not published on npm (only up to 15.5.7 for Windows); warning is benign - build succeeds with Next.js 15.5.11.

## User Setup Required
The following environment variables need real values in `.env` before the app can connect to the database or authenticate:
- `DATABASE_URL` - MySQL connection string for mail.allbag.pl (replace placeholder credentials)
- `AUTH_SECRET` - Generate with `openssl rand -base64 32`
- `AUTH_URL` - Set to your actual deployment URL (default: `http://localhost/kalkulator2026`)
- `SMTP_PASS` - Get from existing PHP config on the server

## Next Phase Readiness
- Foundation is complete. Auth.js v5 + Prisma are configured but cannot connect until DATABASE_URL has real credentials.
- Next plan (01-02) can build the login UI and auth Server Actions on top of this foundation.
- The DAL pattern is established and ready for use in all subsequent pages.
- Concern: `prisma db pull` has not been run yet to validate schema against actual DB - this should be done when DATABASE_URL is configured.

---
*Phase: 01-foundation-auth-and-system-shell*
*Completed: 2026-03-23*
