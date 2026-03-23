---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - .gitignore
autonomous: true
requirements: [QUICK-01]

must_haves:
  truths:
    - "GitHub repo 'kalkulator2026' exists and is public"
    - "All 5 local commits are visible on GitHub"
    - "Local remote 'origin' points to the new GitHub repo"
    - ".gitignore prevents committing node_modules, .next, .env.local"
  artifacts:
    - path: ".gitignore"
      provides: "Node.js/Next.js ignore rules"
      contains: "node_modules"
  key_links:
    - from: "local git repo"
      to: "github.com/kalkulator2026"
      via: "git remote origin + git push"
      pattern: "git push origin main"
---

<objective>
Create a public GitHub repository named "kalkulator2026", add a .gitignore for the Next.js/Node.js stack, and push all existing local commits so the project is backed up and accessible on GitHub.

Purpose: Establish remote source control before Phase 1 development begins.
Output: Public GitHub repo with full commit history and a proper .gitignore.
</objective>

<execution_context>
@C:/Users/mgwaj/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/mgwaj/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add .gitignore for Next.js/Node.js project</name>
  <files>C:/xampp/htdocs/kalkulator2026/.gitignore</files>
  <action>
Create a .gitignore file at the repo root covering standard Next.js and Node.js build artifacts and secrets. Include at minimum:

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js build output
.next/
out/

# Environment variables (secrets — never commit)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE / OS
.DS_Store
Thumbs.db
.idea/
.vscode/

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

Stage and commit with message: `chore: add .gitignore for Next.js project`
  </action>
  <verify>
    <automated>git -C C:/xampp/htdocs/kalkulator2026 log --oneline | head -1 | grep -q "gitignore" && echo "OK: .gitignore committed" || echo "FAIL: commit not found"</automated>
  </verify>
  <done>.gitignore exists at repo root and its commit appears in git log.</done>
</task>

<task type="auto">
  <name>Task 2: Create GitHub repo and push all commits</name>
  <files></files>
  <action>
Run the following commands in sequence inside C:/xampp/htdocs/kalkulator2026:

1. Create a public GitHub repository named exactly "kalkulator2026":
   `gh repo create kalkulator2026 --public --description "ALLBAG Kalkulator 2026 — zunifikowany system ERP/CRM z Aether UI" --source . --remote origin --push`

   This single command: creates the repo, sets remote origin, and pushes all branches.

2. If the above fails because remote was already set, use the two-step approach instead:
   a. `gh repo create kalkulator2026 --public --description "ALLBAG Kalkulator 2026 — zunifikowany system ERP/CRM z Aether UI"`
   b. `git -C C:/xampp/htdocs/kalkulator2026 remote add origin https://github.com/$(gh api user --jq .login)/kalkulator2026.git`
   c. `git -C C:/xampp/htdocs/kalkulator2026 push -u origin main`

Do NOT force-push. The repo has no prior history on GitHub, so a regular push suffices.
  </action>
  <verify>
    <automated>gh repo view kalkulator2026 --json name,isPrivate,url --jq '"Name: \(.name) | Public: \(.isPrivate | not) | URL: \(.url)"' && git -C C:/xampp/htdocs/kalkulator2026 remote get-url origin</automated>
    <manual>Visit the URL printed above and confirm all 6 commits (including the new .gitignore commit) are visible in the GitHub commit history.</manual>
  </verify>
  <done>
    - `gh repo view kalkulator2026` returns repo info with isPrivate=false
    - `git remote get-url origin` returns the GitHub URL
    - All commits visible at github.com/{username}/kalkulator2026
  </done>
</task>

</tasks>

<verification>
After both tasks complete:

1. `gh repo view kalkulator2026 --json name,isPrivate` — confirms repo is public
2. `git -C C:/xampp/htdocs/kalkulator2026 log --oneline` — shows 6 commits (5 original + .gitignore)
3. `git -C C:/xampp/htdocs/kalkulator2026 remote -v` — shows origin pointing to GitHub
4. `cat C:/xampp/htdocs/kalkulator2026/.gitignore` — file exists with node_modules entry
</verification>

<success_criteria>
- Public GitHub repo "kalkulator2026" exists and accessible without authentication
- `git remote get-url origin` returns the GitHub repo URL
- All planning files (PROJECT.md, ROADMAP.md, STATE.md, REQUIREMENTS.md, research/) visible on GitHub
- .gitignore committed and present at repo root
- No force pushes, no history rewrite
</success_criteria>

<output>
After completion, create `.planning/quick/1-utw-rz-repozytorium-github-kalkulator202/1-SUMMARY.md` with:
- What was done (repo created, URL, commit count)
- Remote origin URL
- Any issues encountered
</output>
