# Design Overview

An AI-powered Amazon brand intelligence platform. A dashboard with real-time metrics and an AI assistant that answers natural language questions by pulling from both a SQL database (Amazon marketplace data) and a knowledge base (markdown documents). It uses tool calling to route questions to the right data source and combines results intelligently.

## Tech Stack

| Component | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | Single app: API routes + React UI |
| LLM Orchestration | Vercel AI SDK | Streaming, tool calling, message management — built for Next.js |
| LLM Provider | OpenRouter | Multi-model gateway, single API key |
| LLM Model | Qwen 3.6 Plus (`qwen/qwen3.6-plus`) | 1M context, native tool calling, $0.325/M input |
| Embeddings | nomic-embed-text-v1.5 via Transformers.js v4 | Local, zero API keys, 8K context, community standard |
| Search & Vector Store | Orama | TypeScript-native, BM25 + vector + hybrid search in one library |
| Database | SQLite via better-sqlite3 | Given by the test — 5 tables, 14 months of data |
| UI Components | ShadCN | Pre-built, accessible, Tailwind-styled components |
| Charts | ShadCN Charts (Recharts) | Integrated with ShadCN design system |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Icons | Lucide | Clean, consistent icon set |
| Animations | GSAP | Subtle transitions for premium feel |
| Testing | PromptFoo | LLM evaluation, regression testing |

## Architecture Pattern

**Thin Orchestrator** — the LLM receives the user question and decides which tools to call via native function calling. No custom routing logic. The system provides three tools:

- `query_database` — generates and executes SQL against SQLite
- `search_knowledge_base` — hybrid vector + BM25 search over knowledge documents
- `check_compliance` — regex scan for restricted language in listing copy

See [architecture.md](architecture.md) for the full system diagram and data flow.

## Design Documents

| Document | Covers |
|---|---|
| [architecture.md](architecture.md) | System architecture, data flow, component boundaries, error handling |
| [llm.md](llm.md) | LLM provider, model choice, tool calling, system prompt, env config |
| [rag.md](rag.md) | Chunking, embeddings, Orama, hybrid search, source attribution |
| [sql.md](sql.md) | Text-to-SQL, schema augmentation, validation pipeline |
| [memory.md](memory.md) | Conversation context management |
| [compliance.md](compliance.md) | Compliance detection approach |
| [frontend.md](frontend.md) | Dashboard + chatbot UI, tech stack, layered build approach |
| [testing.md](testing.md) | PromptFoo evaluation suite, test tiers, assertions |
| [roadmap.md](roadmap.md) | Build order, layers, execution checklist |

Each document is self-contained: it includes the decision, the research rationale, alternatives considered, and production-grade upgrade paths. An agent or developer reading any single file gets full context without cross-referencing other docs.

## Environment Variables

```
# Required
OPENROUTER_API_KEY=sk-or-...

# Optional (defaults provided)
OPENROUTER_MODEL=qwen/qwen3.6-plus
```

One API key. That's it. Everything else runs locally.

## Key Design Principles

1. **Clean interfaces** — every component (LLM, search, DB) is abstracted behind an interface so the concrete implementation is swappable via config
2. **Zero-friction setup** — `npm run dev` auto-initializes everything (search index, embeddings). No external services required beyond an OpenRouter API key
3. **KISS** — simplest solution that meets requirements. No over-engineering
4. **Production-ready thinking** — designed for simple implementation now, with a clear upgrade path documented in each design file
