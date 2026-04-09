# CLAUDE.md — Stonecutter AI Platform

## Project

AI-powered Amazon brand intelligence platform. Dashboard + AI chatbot that answers natural language questions by querying a SQL database (sales/ads/subscriptions) and a knowledge base (SOPs, compliance, brand guides) via tool calling.

**Repo:** https://github.com/hyowonbernabe/stonecutter-ai-platform
**Status:** Foundation complete (Layer 1). Building Layer 2 next.

## Architecture

Thin Orchestrator — Qwen 3.6 Plus via OpenRouter decides which tools to call. No custom routing logic.

```
User → Next.js API (/api/chat) → Vercel AI SDK → Qwen 3.6 Plus (tool calling)
                                                    ├── query_database → SQLite
                                                    ├── search_knowledge_base → Orama (hybrid)
                                                    └── check_compliance → Regex
```

Dashboard serves static SQLite queries via `/api/dashboard/*`.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **LLM:** Qwen 3.6 Plus (`qwen/qwen3.6-plus`) via OpenRouter + Vercel AI SDK
- **Search:** Orama (BM25 + vector + hybrid in one library)
- **Embeddings:** nomic-embed-text-v1.5 via Transformers.js v4 (local, no API key)
- **Database:** SQLite via better-sqlite3 (read-only)
- **UI:** ShadCN + Tailwind + GSAP + Lucide + Recharts
- **Testing:** PromptFoo

## Design Docs

Read before implementing. Each file is self-contained with decisions, rationale, and production alternatives.

| File | Read when |
|---|---|
| `docs/design/README.md` | Starting any work — overview + tech stack |
| `docs/design/architecture.md` | Touching API routes, tools, data flow, error handling |
| `docs/design/llm.md` | Touching LLM calls, tool definitions, system prompt, env config |
| `docs/design/rag.md` | Touching search, embeddings, chunking, Orama, source attribution |
| `docs/design/sql.md` | Touching SQL generation, schema, validation, few-shot examples |
| `docs/design/memory.md` | Touching conversation history, message handling |
| `docs/design/compliance.md` | Touching compliance detection, regex, prohibited terms |
| `docs/design/frontend.md` | Touching UI, dashboard, chatbot widget, charts |
| `docs/design/testing.md` | Writing PromptFoo tests — has exact test cases and assertions |
| `docs/design/roadmap.md` | Understanding build order, what's done, what's next |

## Project Structure

```
src/
├── app/
│   ├── api/chat/          # AI chat endpoint (Vercel AI SDK + streamText)
│   ├── api/dashboard/     # Dashboard data endpoints (static SQLite queries)
│   ├── layout.tsx         # Root layout (ShadCN + Tailwind)
│   └── page.tsx           # Dashboard + chatbot page
├── lib/
│   ├── llm/               # OpenRouter + Vercel AI SDK wrapper
│   ├── tools/             # query-database.ts, search-knowledge-base.ts, check-compliance.ts
│   ├── search/            # Orama setup, ingestion, hybrid search
│   ├── embeddings/        # nomic-embed-text-v1.5 via Transformers.js
│   ├── db/                # SQLite connection (read-only, singleton)
│   └── config/env.ts      # Environment variables + validation
├── components/
│   ├── chat/              # Chat widget components
│   ├── dashboard/         # Dashboard components (cards, charts)
│   └── ui/                # ShadCN components (pre-installed)
└── prompts/
    └── system.ts          # System prompt with compliance guide
```

## Data

- `data/sample.db` — SQLite, 5 tables, 3 brands, 15 products, 14 months (Jan 2025 - Feb 2026). Generated via `python3 setup-test-database.py`. Gitignored.
- `data/knowledge/` — 4 markdown docs (SOP, compliance, brand voice, competitive analysis). Committed.

## Key Decisions

- **Orama replaces ChromaDB + MiniSearch** — one library handles vector, BM25, and hybrid search
- **Schema always injected** into SQL prompts — Qwen has ~26.5% code hallucination rate, never let it guess columns
- **nomic task prefixes required** — `search_document:` for docs, `search_query:` for queries
- **Compliance in system prompt** — no separate LLM call, regex is the deterministic safety net
- **Sliding window 20 messages** — follow-ups are sequential deltas, not topic recalls
- **Source attribution** — inline citations + structured metadata (dual approach)
- **Error handling** — graceful user-facing messages per failure type, no raw stack traces

## Env Vars

```
OPENROUTER_API_KEY=sk-or-...          # Required
OPENROUTER_MODEL=qwen/qwen3.6-plus   # Optional, defaults to this
```

## Commands

```
npm run dev          # Start dev server (Turbopack)
npm run setup        # Generate SQLite database
npm run eval         # Run full PromptFoo suite
npm run eval:tier1   # Rubric questions only
```

## Build Order (Roadmap)

See `docs/design/roadmap.md` for full checklist.

1. ~~Foundation~~ (done)
2. **Data Layer** ← next (SQLite connection, embeddings, Orama ingestion)
3. Tools (query_database, search_knowledge_base, check_compliance)
4. AI Orchestration (Vercel AI SDK + tool calling + system prompt)
5. Testing (PromptFoo — verify before UI)
6. Chat UI (core deliverable)
7. Dashboard (additive polish)

## Rules

- Read the relevant design doc before touching any component
- Never commit `.env` or API keys
- SQLite is read-only — SELECT statements only
- Keep files focused — one responsibility per file
- Follow existing patterns in the codebase
- Test before UI — PromptFoo validation comes before frontend work
