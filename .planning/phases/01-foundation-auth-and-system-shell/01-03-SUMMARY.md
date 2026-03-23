---
phase: 01-foundation-auth-and-system-shell
plan: "03"
subsystem: ui
tags: [next.js, prisma, tiptap, aether, glassmorphism, rbac, server-actions, zod, shadcn, data-table, admin]

# Dependency graph
requires:
  - phase: 01-foundation-auth-and-system-shell
    provides: "Auth.js v5 split config, DAL with getCurrentUser/requireAdmin/requireAuth, Prisma schema, Aether tokens, GlassCard/GlowButton/PageHeader components, SidebarNav with RBAC"

provides:
  - "Admin user management: getUsers, getUserById, createUser, updateUser, toggleUserActive, deleteUser DAL + Server Actions"
  - "Permission management: getUserPermissions, getAvailablePages, updateUserPermissions, bulkSetPermissions DAL + Server Action"
  - "Access code management: getAccessCodes, createAccessCode, updateAccessCode, deleteAccessCode DAL + Server Actions"
  - "Notepad DAL: getNote, saveNote (versioned, tag extraction), getNoteVersions + saveNoteAction, getNoteVersionsAction"
  - "Activity log viewer: getActivityLog(params) DAL with filtering by type/user/date"
  - "Admin pages: /settings/users, /settings/users/[id], /settings/permissions, /settings/access-codes, /audit-log"
  - "Notepad page: /notepad with TipTap WYSIWYG, auto-save, version history"
  - "Aether DataTable component: sortable, searchable, paginated, glassmorphism"
  - "Aether StatCard component: icon badge, value, trend indicator"
  - "shadcn/ui components: table, dialog, select, badge, tabs, switch, dropdown-menu, separator, pagination"

affects:
  - "02-products (DataTable reused across all list pages)"
  - "all subsequent admin phases (admin panel pattern established)"

# Tech tracking
tech-stack:
  added:
    - "@tiptap/react + @tiptap/starter-kit + @tiptap/extension-placeholder"
    - "shadcn/ui: table, dialog, select, badge, tabs, switch, dropdown-menu, separator, pagination (all @base-ui/react)"
  patterns:
    - "DataTable generic: ColumnDef<T> with render prop, handles sort/search/pagination client-side state + URL sync"
    - "Server Component page + _components/ directory for Client Component interactivity"
    - "Server Action pattern reused: validate with Zod -> DAL -> revalidatePath -> return ActionState"
    - "getNoteVersionsAction: server action wrapper for DAL function accessible from client components"
    - "@base-ui/react render prop pattern: DialogTrigger render={<Button />} instead of asChild"
    - "Notepad auto-save: debounce 2s useRef timer, cancel on unmount"

key-files:
  created:
    - "src/lib/validations/users.ts - createUserSchema, updateUserSchema (Zod v4)"
    - "src/lib/validations/permissions.ts - updatePermissionsSchema"
    - "src/lib/validations/access-codes.ts - createAccessCodeSchema, updateAccessCodeSchema"
    - "src/lib/dal/users.ts - User CRUD with requireAdmin guard + activity logging"
    - "src/lib/dal/permissions.ts - getUserPermissions, updateUserPermissions (UserPermissionsHistory entries)"
    - "src/lib/dal/access-codes.ts - Access code CRUD with requireAdmin guard"
    - "src/lib/dal/notepad.ts - getNote, saveNote (versioned), getNoteVersions with requireAuth"
    - "src/lib/actions/users.ts - createUserAction, updateUserAction, toggleUserActiveAction"
    - "src/lib/actions/permissions.ts - updatePermissionsAction"
    - "src/lib/actions/access-codes.ts - createAccessCodeAction, updateAccessCodeAction, deleteAccessCodeAction"
    - "src/lib/actions/notepad.ts - saveNoteAction, getNoteVersionsAction"
    - "src/components/aether/data-table.tsx - Generic DataTable with Aether glassmorphism"
    - "src/components/aether/stat-card.tsx - StatCard with icon, value, trend"
    - "src/app/(dashboard)/settings/users/page.tsx - User management list with StatCards"
    - "src/app/(dashboard)/settings/users/[id]/page.tsx - User detail with Tabs"
    - "src/app/(dashboard)/settings/permissions/page.tsx - Permissions matrix"
    - "src/app/(dashboard)/settings/access-codes/page.tsx - Access codes with progress bar"
    - "src/app/(dashboard)/audit-log/page.tsx - Activity log with filter bar + expandable rows"
    - "src/app/(dashboard)/notepad/page.tsx - Notepad with TipTap auto-save"
  modified:
    - "src/lib/dal/activity-log.ts - Extended with getActivityLog(params) for admin viewer"
    - "src/lib/actions/notepad.ts - Added getNoteVersionsAction"
    - "package.json - Added @tiptap/* packages + shadcn components"

key-decisions:
  - "getNoteVersionsAction server action wrapper: client notepad needs version history but DAL has server-only guard — created server action as bridge"
  - "@base-ui/react render prop for DialogTrigger: asChild is Radix-only pattern, base-ui uses render={<Component />}"
  - "deleteUser as soft delete: sets isActive=false, never hard deletes due to FK constraints (activityLog, etc.)"
  - "Notepad version on every save: every auto-save creates a UserNoteVersion entry for complete history"
  - "Permission change history: every toggle creates UserPermissionsHistory entry with changedBy, IP, action"

patterns-established:
  - "Admin page pattern: Server Component calls requireAdmin() + fetches data, passes to _components/ Client Components"
  - "DataTable pattern: generic ColumnDef<T> with render prop for custom cell rendering"
  - "Select onValueChange pattern: (v) => { if (v !== null) setState(v) } for @base-ui/react null safety"

requirements-completed: [SYST-01, SYST-03, SYST-04, AUTH-06, AUTH-08]

# Metrics
duration: 13min
completed: "2026-03-23"
---

# Phase 1 Plan 03: Admin Panels, Notepad, and Aether Components Summary

**Admin panels (user CRUD, permissions matrix, access codes, audit log) and TipTap notepad with auto-save, built on generic Aether DataTable/StatCard and @base-ui/react shadcn components**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-23T10:41:31Z
- **Completed:** 2026-03-23T10:55:20Z
- **Tasks:** 2 (+ Task 3 is a human verification checkpoint — not executed)
- **Files modified:** 41

## Accomplishments

- Built 5 admin pages (users list, user detail, permissions matrix, access codes, audit log) all guarded by `requireAdmin()` at DAL level, all using `await searchParams`/`await params` per Next.js 15
- Created reusable Aether DataTable (sortable, searchable, paginated, glassmorphism) and StatCard components that establish the pattern for all subsequent admin list pages
- Implemented TipTap notepad with toolbar (bold/italic/headings/lists/code), 2-second debounced auto-save, word/char count, and collapsible version history panel
- Created complete DAL layer (users, permissions, access-codes, notepad, extended activity-log) with server-only guard, requireAdmin/requireAuth gates, and activity logging on all mutations
- Permission changes create `UserPermissionsHistory` entries with changedBy admin email, action (granted/revoked), and per-page toggle state

## Task Commits

Each task was committed atomically:

1. **Task 1: DAL modules, Server Actions, validation schemas** - `a326a4f` (feat)
2. **Task 2: Admin pages, notepad, DataTable/StatCard** - `06b7739` (feat)

## Files Created/Modified

- `src/lib/validations/{users,permissions,access-codes}.ts` - Zod v4 schemas for all three domains
- `src/lib/dal/users.ts` - getUsers (paginated+search), getUserById, createUser (bcrypt cost 12), updateUser, toggleUserActive, deleteUser (soft)
- `src/lib/dal/permissions.ts` - getUserPermissions, getAvailablePages, updateUserPermissions (creates history), bulkSetPermissions
- `src/lib/dal/access-codes.ts` - getAccessCodes, getAccessCodeById, createAccessCode, updateAccessCode, deleteAccessCode
- `src/lib/dal/notepad.ts` - getNote, saveNote (hashtag extraction, versioning, tag upsert), getNoteVersions
- `src/lib/dal/activity-log.ts` - Extended with getActivityLog(params) admin viewer
- `src/lib/actions/{users,permissions,access-codes,notepad}.ts` - All Server Actions with Zod validation + revalidatePath
- `src/components/aether/data-table.tsx` - Generic DataTable<T> with Aether glassmorphism
- `src/components/aether/stat-card.tsx` - StatCard with LucideIcon, trend direction
- All 5 admin pages + notepad page + their _components/ directories
- `src/components/ui/{table,dialog,select,badge,tabs,switch,dropdown-menu,separator,pagination}.tsx` - shadcn base-nova

## Decisions Made

- `getNoteVersionsAction` server action wrapper: client component NotepadEditor needs version history but DAL has `server-only` import — server action serves as the bridge (this is the correct Next.js 15 pattern)
- `deleteUser` is soft delete only: sets `isActive: false` instead of hard delete, preserving FK integrity with activityLog, permissions, notes
- `@base-ui/react` render prop for DialogTrigger: `asChild` is a Radix UI-only API; base-nova shadcn uses `render={<Button />}` pattern (same fix already made in Plan 02 for TooltipTrigger)
- Notepad versions on every auto-save: complete history for all edits with version numbers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod v4 enum uses `error` not `errorMap` property**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** `z.enum(["admin", "user"], { errorMap: () => ... })` — `errorMap` not in Zod v4 API, TypeScript error TS2769
- **Fix:** Used `.describe()` for the description instead; removed errorMap
- **Files modified:** src/lib/validations/users.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** a326a4f (Task 1 commit)

**2. [Rule 1 - Bug] `asChild` prop not supported by `@base-ui/react` components**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `DialogTrigger asChild` and `DropdownMenuTrigger asChild` — `asChild` is Radix UI-only, base-ui uses `render` prop
- **Fix:** `DialogTrigger render={<GlowButton>...</GlowButton>}`; `DropdownMenuTrigger` wraps button child directly (no polymorphism needed); `DropdownMenuItem onClick` navigation instead of Link child
- **Files modified:** create-user-dialog.tsx, create-access-code-dialog.tsx, users-table.tsx, access-codes-table.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 06b7739 (Task 2 commit)

**3. [Rule 1 - Bug] `Select.onValueChange` receives `string | null` in @base-ui/react**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `onValueChange={setRole}` — base-ui Select passes `null` when deselected, React setState expects `string`, TS2345 mismatch
- **Fix:** Wrapped: `onValueChange={(v) => { if (v !== null) setState(v) }}`
- **Files modified:** create-user-dialog.tsx, user-detail-tabs.tsx, audit-log-table.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 06b7739 (Task 2 commit)

**4. [Rule 2 - Missing Critical] Client component importing server-only DAL directly**
- **Found during:** Task 2 (notepad editor review)
- **Issue:** `NotepadEditor` (client component) imported `getNoteVersions` from `dal/notepad.ts` which has `import 'server-only'` — would crash at runtime
- **Fix:** Added `getNoteVersionsAction` server action, updated import in notepad-editor.tsx
- **Files modified:** src/lib/actions/notepad.ts, src/app/(dashboard)/notepad/_components/notepad-editor.tsx
- **Verification:** `npx tsc --noEmit` passes, `npx next build` succeeds
- **Committed in:** 06b7739 (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (2 bugs, 1 type fix, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for TypeScript correctness, runtime safety, and build success. No scope creep.

## Issues Encountered

- None beyond the auto-fixed issues above.

## User Setup Required

None - same external service configuration as Plan 01 and Plan 02. The admin pages and notepad require a live database connection (DATABASE_URL with real credentials).

## Task 3: Human Verification Checkpoint

Task 3 is a `type="checkpoint:human-verify"` gate. Per the execution instructions, human verification is deferred and the human will verify manually after plan completion.

**Verification steps for the human:**
1. Start dev server: `cd C:/xampp/htdocs/kalkulator2026 && npm run dev`
2. Visit `http://localhost:3000/kalkulator2026/login` — Aether-styled login
3. Log in with admin credentials from MySQL
4. Navigate to `/kalkulator2026/settings/users` — user list with StatCards
5. Navigate to `/kalkulator2026/settings/permissions` — permissions matrix
6. Navigate to `/kalkulator2026/settings/access-codes` — code list with usage bars
7. Navigate to `/kalkulator2026/audit-log` — activity log with filters
8. Navigate to `/kalkulator2026/notepad` — TipTap editor, type, wait 2s for auto-save
9. Refresh notepad — content should persist
10. Log out and verify redirect to `/kalkulator2026/login`

## Next Phase Readiness

- Phase 1 is functionally complete pending human verification (Task 3)
- All 12 Phase 1 requirements are covered across plans 01-03: AUTH-01 through AUTH-08, SYST-01 through SYST-04
- DataTable, StatCard, and the admin page pattern are ready to reuse in Phase 2 (Products)
- The DAL pattern (server-only, requireAdmin/requireAuth, logActivity) is fully established

## Self-Check: PASSED

- All 19 key files verified on disk
- Task commits a326a4f and 06b7739 exist in git log
- `npx tsc --noEmit` passes (no TypeScript errors)
- `npx next build` passes (all 9 routes generated successfully)

---
*Phase: 01-foundation-auth-and-system-shell*
*Completed: 2026-03-23*
