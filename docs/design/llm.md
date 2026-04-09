# LLM Integration

## Provider: OpenRouter

OpenRouter is a multi-model gateway. Single API key, access to all major models. The endpoint is OpenAI-compatible, which means the Vercel AI SDK's OpenRouter provider works out of the box.

Configuration via environment variables:

```
# Required
OPENROUTER_API_KEY=sk-or-...

# Optional — defaults to qwen/qwen3.6-plus
OPENROUTER_MODEL=qwen/qwen3.6-plus
```

The model is configurable via env var so swapping models requires zero code changes. This is the foundation for the production multi-model routing upgrade.

## Model: Qwen 3.6 Plus

| Attribute | Value |
|---|---|
| Model ID | `qwen/qwen3.6-plus` |
| Context window | 1,000,000 tokens |
| Max output tokens | 65,536 |
| Input price | $0.325 / million tokens |
| Output price | $1.95 / million tokens |
| Tool calling | Native, first-class |
| Structured output | Yes |
| Reasoning | Always-on chain-of-thought |

### Decision: Why Qwen 3.6 Plus

**Alternatives considered:**

| Model | Strength | Why not chosen |
|---|---|---|
| Claude Opus 4.6 | Strongest reasoning + instruction following | ~$15/$75 per M tokens — 50x more expensive. Best reliability, but overkill for this scope. |
| Claude Sonnet 4.6 | Strong balance of quality and cost | ~$3/$15 per M tokens — still 10x more expensive than Qwen. |
| GPT-4.1 | Excellent at code/SQL generation | Viable alternative. Competitive pricing. No 1M context. |
| Gemini 2.5 Pro / 3.x | Natively multimodal (text + images + video) | Best option if the system ever needs to process product images. Slightly more expensive. |

**Why Qwen won:**
- 1M context window handles full schema + few-shot examples + conversation history + retrieved documents comfortably
- Native tool calling is critical for our orchestration pattern
- Cost-effective — roughly 10x cheaper than Claude Sonnet while competitive in quality (community-validated as "Opus 4.5 levels at 1/10th the price")
- Strong document comprehension (OmniDocBench 91.2)
- Released March 30, 2026 — current generation model

**Known limitations to design around:**
- ~26.5% code hallucination rate for API behaviors — mitigated by always injecting full schema into every SQL prompt (never let it guess table/column names)
- Closed-source, no self-hosting option
- Reports of ignoring instructions in long multi-step agent flows — mitigated by our simple single-turn tool calling pattern (not a multi-agent pipeline)

**For production:** Swap to Claude Opus for maximum reliability, or Gemini for multimodal needs. The LLM service interface is abstracted — changing the model is a config change (`OPENROUTER_MODEL=anthropic/claude-opus-4-6`), not a code change. For cost optimization at scale, implement a multi-model router: classify question difficulty, route simple queries to a cheaper model (Haiku-class) and complex queries to a stronger model (Opus-class). The interface already supports this — it's a routing layer, not a rewrite.

## Tool Definitions

Three tools are exposed to the model:

### `query_database`

- Description: "Query the SQLite database to answer questions about sales, advertising, subscriptions, and customer metrics. Use this for any question involving numbers, trends, comparisons, or data lookups."
- Parameters: `{ question: string }` — the natural language question
- Returns: `{ sql: string, results: object[], rowCount: number, error?: string }`

### `search_knowledge_base`

- Description: "Search the knowledge base documents (SOPs, compliance guides, brand voice guides, competitive analysis) to answer questions about procedures, policies, brand guidelines, or industry context."
- Parameters: `{ query: string }` — the search query
- Returns: `{ chunks: { content: string, source: string, section: string }[], scores: number[] }`

### `check_compliance`

- Description: "Check product listing copy for compliance violations against Amazon's restricted language policy. Use this when a user submits listing text for review or asks about compliance."
- Parameters: `{ text: string }` — the listing copy to check
- Returns: `{ violations: { term: string, context: string, suggestion: string }[], isCompliant: boolean }`

## System Prompt Strategy

The system prompt includes:

1. Role definition — AI assistant for an Amazon brand management agency
2. The full compliance guide (prohibited terms, verbs, approved alternatives) — so the model is always compliance-aware without needing a tool call
3. Instructions for tool use — when to use each tool, how to combine results for hybrid questions
4. Instructions for source attribution — always cite which documents or SQL queries informed the answer
5. Instructions for SQL transparency — always show the generated SQL query in the response

The system prompt does NOT include the database schema — that is injected within the `query_database` tool's internal prompt to keep concerns separated.

## Vercel AI SDK Integration

The OpenRouter provider for the Vercel AI SDK:

```
Package: @openrouter/ai-sdk-provider
Usage: createOpenRouter({ apiKey }) → openrouter.chat('qwen/qwen3.6-plus')
```

The SDK handles:
- Streaming responses via `streamText`
- Tool call execution loop (call model → execute tools → feed results back → model synthesizes)
- Message formatting and history management

## References

- OpenRouter API docs: https://openrouter.ai/docs
- OpenRouter quickstart: https://openrouter.ai/docs/quickstart
- Qwen 3.6 Plus model page: https://openrouter.ai/qwen/qwen3.6-plus
- Vercel AI SDK docs: https://ai-sdk.dev/docs
- Vercel AI SDK — OpenRouter provider: https://ai-sdk.dev/providers/community-providers/openrouter
- Vercel AI SDK — tool calling: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- Vercel AI SDK — streaming: https://ai-sdk.dev/docs/ai-sdk-core/generating-text
- Qwen3 official blog: https://qwen.ai/blog?id=qwen3
