# Foundation Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a runnable Next.js project with all dependencies installed, database generated, folder structure scaffolded, and Git initialized — ready for Layer 2 (Data Layer) implementation.

**Architecture:** Single Next.js app (App Router + TypeScript) with API routes for the AI chat and dashboard endpoints. All backend logic lives in `src/lib/`, all UI in `src/components/`, system prompts in `src/prompts/`.

**Tech Stack:** Next.js 15+, TypeScript, Orama, Transformers.js v4, better-sqlite3, Vercel AI SDK, OpenRouter, ShadCN, Tailwind CSS, GSAP, Lucide, Recharts, PromptFoo

**Pre-requisites:**
- Node.js 18+ installed
- Python 3 installed (for database generation script)
- An OpenRouter API key (get one at https://openrouter.ai/)

**Design docs:** `docs/design/` — read `README.md` for the overview, individual files for each component's design decisions.

---

### Task 1: Initialize Git Repository

**Files:**
- Create: `.git/` (via `git init`)

- [ ] **Step 1: Initialize git repo at project root**

```bash
cd "C:/Projects/AI Platform Engineer Application"
git init
```

Expected: `Initialized empty Git repository in ...`

---

### Task 2: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts` (or `@tailwind` via CSS)

- [ ] **Step 1: Create the Next.js project**

Run from the project root. We use `--yes` to accept defaults and `--src-dir` to use the `src/` directory layout, `--app` for App Router, `--tailwind` for Tailwind CSS, `--typescript` for TypeScript, `--eslint` for ESLint.

Since the project root already has files (`docs/`, `data/`, `skills-test/`), we need to initialize Next.js IN the existing directory, not create a new subdirectory.

```bash
cd "C:/Projects/AI Platform Engineer Application"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

When prompted:
- Would you like to use Turbopack? → **Yes**

Expected: Next.js project initializes in the current directory. `package.json`, `tsconfig.json`, `next.config.ts`, and `src/` directory are created.

- [ ] **Step 2: Verify the project starts**

```bash
npm run dev
```

Expected: Server starts at `http://localhost:3000`. Open in browser to verify the default Next.js page loads. Then stop the server (Ctrl+C).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with App Router + TypeScript + Tailwind"
```

---

### Task 3: Install Backend Dependencies

**Files:**
- Modify: `package.json` (dependencies added)

- [ ] **Step 1: Install AI/LLM dependencies**

```bash
npm install ai @openrouter/ai-sdk-provider
```

- `ai` — Vercel AI SDK (streaming, tool calling, message management)
- `@openrouter/ai-sdk-provider` — OpenRouter provider for Vercel AI SDK

Expected: Both packages added to `dependencies` in `package.json`.

- [ ] **Step 2: Install search and embedding dependencies**

```bash
npm install @orama/orama @orama/plugin-data-persistence @huggingface/transformers
```

- `@orama/orama` — TypeScript-native search engine (BM25 + vector + hybrid)
- `@orama/plugin-data-persistence` — disk persistence for Orama
- `@huggingface/transformers` — Transformers.js v4 for local embeddings

Expected: All three packages added to `dependencies`.

- [ ] **Step 3: Install database dependency**

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

- `better-sqlite3` — synchronous SQLite driver for Node.js
- `@types/better-sqlite3` — TypeScript type definitions

Expected: `better-sqlite3` in `dependencies`, types in `devDependencies`.

- [ ] **Step 4: Install testing dependency**

```bash
npm install -D promptfoo
```

- `promptfoo` — LLM evaluation framework (dev dependency only)

Expected: `promptfoo` added to `devDependencies`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install backend dependencies (AI SDK, Orama, Transformers.js, SQLite, PromptFoo)"
```

---

### Task 4: Install Frontend Dependencies

**Files:**
- Modify: `package.json` (dependencies added)
- Create: `src/components/ui/` (ShadCN components directory)
- Create: `components.json` (ShadCN config)

- [ ] **Step 1: Initialize ShadCN**

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Neutral** (professional dashboard aesthetic)
- CSS variables: **Yes**

Expected: `components.json` created, `src/components/ui/` directory created, Tailwind config updated with ShadCN presets.

- [ ] **Step 2: Install ShadCN components we'll need**

```bash
npx shadcn@latest add button card input scroll-area separator sheet badge tabs chart
```

Expected: Component files created in `src/components/ui/`. The `chart` component installs `recharts` as a dependency automatically.

- [ ] **Step 3: Install animation and icon dependencies**

```bash
npm install gsap lucide-react
```

- `gsap` — animation library for subtle transitions
- `lucide-react` — icon set

Expected: Both packages added to `dependencies`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: install frontend dependencies (ShadCN, GSAP, Lucide, Recharts)"
```

---

### Task 5: Create Folder Structure

**Files:**
- Create: `src/lib/llm/` directory
- Create: `src/lib/tools/` directory
- Create: `src/lib/search/` directory
- Create: `src/lib/embeddings/` directory
- Create: `src/lib/db/` directory
- Create: `src/lib/config/` directory
- Create: `src/components/chat/` directory
- Create: `src/components/dashboard/` directory
- Create: `src/prompts/` directory
- Create: `src/app/api/chat/` directory
- Create: `src/app/api/dashboard/` directory

- [ ] **Step 1: Create all directories with placeholder .gitkeep files**

Each directory gets a `.gitkeep` so Git tracks the empty folders. These will be replaced by real files in later layers.

```bash
cd "C:/Projects/AI Platform Engineer Application"

mkdir -p src/lib/llm
mkdir -p src/lib/tools
mkdir -p src/lib/search
mkdir -p src/lib/embeddings
mkdir -p src/lib/db
mkdir -p src/lib/config
mkdir -p src/components/chat
mkdir -p src/components/dashboard
mkdir -p src/prompts
mkdir -p src/app/api/chat
mkdir -p src/app/api/dashboard

touch src/lib/llm/.gitkeep
touch src/lib/tools/.gitkeep
touch src/lib/search/.gitkeep
touch src/lib/embeddings/.gitkeep
touch src/lib/db/.gitkeep
touch src/lib/config/.gitkeep
touch src/components/chat/.gitkeep
touch src/components/dashboard/.gitkeep
touch src/prompts/.gitkeep
touch src/app/api/chat/.gitkeep
touch src/app/api/dashboard/.gitkeep
```

Expected: All directories created. Each has a `.gitkeep` file.

- [ ] **Step 2: Create the config module with environment variable definitions**

Create `src/lib/config/env.ts`:

```typescript
export const env = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? '',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL ?? 'qwen/qwen3.6-plus',
} as const;

export function validateEnv(): void {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error(
      'OPENROUTER_API_KEY is not set. Copy .env.example to .env and add your key.'
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: create project folder structure and config module"
```

---

### Task 6: Create .env.example

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create the environment variable template**

Create `.env.example` at the project root:

```
# Required — get your key at https://openrouter.ai/
OPENROUTER_API_KEY=sk-or-your-key-here

# Optional — defaults to qwen/qwen3.6-plus
# OPENROUTER_MODEL=qwen/qwen3.6-plus
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "feat: add .env.example with required environment variables"
```

---

### Task 7: Create .gitignore

**Files:**
- Modify: `.gitignore` (Next.js creates one, we extend it)

- [ ] **Step 1: Extend the existing .gitignore**

Next.js already created a `.gitignore`. Append these entries to it:

```
# Environment variables (real keys)
.env
.env.local
.env.production

# Generated database
data/sample.db

# Orama persistence files
data/orama/

# Transformers.js model cache
.transformers-cache/
node_modules/.cache/

# PromptFoo output
.promptfoo/
promptfoo-output/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "feat: extend .gitignore for env files, generated DB, model cache, Orama persistence"
```

---

### Task 8: Generate SQLite Database

**Files:**
- Create: `data/sample.db` (generated, gitignored)

- [ ] **Step 1: Run the database generation script**

```bash
cd "C:/Projects/AI Platform Engineer Application"
python3 setup-test-database.py
```

Expected output:
```
Creating tables...
Seeding products...
Seeding daily sales (14 months of data)...
Seeding advertising data...
Seeding subscription data...
Seeding customer metrics...

=== Database Summary ===

  products: 15 rows
  daily_sales: 6,585 rows
  advertising: [large number] rows
  subscriptions: [large number] rows
  customer_metrics: 1,314 rows

  Brands: PureVita Supplements, GlowHaven Skincare, TailWag Pet Wellness
  Date range: 2025-01-01 to 2026-02-28

  Database saved to: data/sample.db
  Ready for skills test!
```

- [ ] **Step 2: Verify the database exists and is readable**

```bash
ls -la data/sample.db
```

Expected: File exists, non-zero size (several MB).

- [ ] **Step 3: Do NOT commit** — `data/sample.db` is gitignored. It's generated from the script, which IS committed.

---

### Task 9: Verify Everything Works

- [ ] **Step 1: Create .env from the template**

```bash
cp .env.example .env
```

Then edit `.env` and replace `sk-or-your-key-here` with your actual OpenRouter API key.

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```

Expected: Server starts at `http://localhost:3000` without errors. The default Next.js page loads in the browser.

- [ ] **Step 3: Verify the folder structure**

```bash
find src -type f | sort
```

Expected output should show:
```
src/app/api/chat/.gitkeep
src/app/api/dashboard/.gitkeep
src/app/layout.tsx
src/app/page.tsx
src/components/chat/.gitkeep
src/components/dashboard/.gitkeep
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/chart.tsx
src/components/ui/input.tsx
src/components/ui/scroll-area.tsx
src/components/ui/separator.tsx
src/components/ui/sheet.tsx
src/components/ui/tabs.tsx
src/lib/config/env.ts
src/lib/db/.gitkeep
src/lib/embeddings/.gitkeep
src/lib/llm/.gitkeep
src/lib/search/.gitkeep
src/lib/tools/.gitkeep
src/prompts/.gitkeep
```

(Plus any additional ShadCN utility files like `src/lib/utils.ts`)

- [ ] **Step 4: Add npm scripts for later use**

Add these scripts to `package.json` under `"scripts"`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "setup": "python3 setup-test-database.py",
    "eval": "promptfoo eval",
    "eval:tier1": "promptfoo eval --filter-pattern 'tier1'",
    "eval:tier2": "promptfoo eval --filter-pattern 'tier2'",
    "eval:tier3": "promptfoo eval --filter-pattern 'tier3'"
  }
}
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete foundation setup — project ready for Layer 2 implementation"
```

- [ ] **Step 6: Push to remote**

After the user sets up the GitHub repo:

```bash
git remote add origin https://github.com/<username>/amazon-brand-intelligence.git
git branch -M main
git push -u origin main
```

---

## Verification Checklist

After completing all 9 tasks, verify:

- [ ] `npm run dev` starts without errors
- [ ] `data/sample.db` exists and is non-empty
- [ ] `data/knowledge/` contains 4 markdown files
- [ ] `.env.example` exists in the repo (committed)
- [ ] `.env` exists locally (not committed)
- [ ] `.gitignore` blocks `.env`, `data/sample.db`, `node_modules/`, model cache, Orama persistence
- [ ] All `src/` directories exist per the folder structure
- [ ] `src/lib/config/env.ts` exports env vars with validation
- [ ] `package.json` has all dependencies listed
- [ ] `package.json` has `setup`, `eval`, `eval:tier1`, `eval:tier2`, `eval:tier3` scripts
- [ ] Git has clean working tree (no untracked files that should be committed)
