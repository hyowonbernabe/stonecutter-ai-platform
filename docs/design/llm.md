# LLM Integration

## Provider: OpenRouter

OpenRouter is a multi-model gateway. Single API key, access to all major models. The endpoint is OpenAI-compatible, which means the Vercel AI SDK's OpenRouter provider works out of the box.

Configuration via environment variables:

```
# Required
OPENROUTER_API_KEY=sk-or-...

# Optional — defaults to minimax/minimax-m2.7
OPENROUTER_MODEL=minimax/minimax-m2.7
```

The model is configurable via env var so swapping models requires zero code changes. This is the foundation for the production multi-model routing upgrade.

## Model: MiniMax M2.7

| Attribute | Value |
|---|---|
| Model ID | `minimax/minimax-m2.7` |
| Context window | 204,800 tokens |
| Max output tokens | 131,072 |
| Input price | $0.30 / million tokens |
| Output price | $1.20 / million tokens |
| Cache read price | $0.06 / million tokens |
| Tool calling | Native, first-class |
| Structured output | Yes |
| Reasoning | Mandatory chain-of-thought |

### Decision: Why MiniMax M2.7

**Alternatives considered:**

| Model | Strength | Why not chosen |
|---|---|---|
| Claude Opus 4.6 | Strongest reasoning + instruction following | ~$15/$75 per M tokens — 50x more expensive. Best reliability, but overkill for this scope. |
| Claude Sonnet 4.6 | Strong balance of quality and cost | ~$3/$15 per M tokens — still 10x more expensive than MiniMax. |
| GPT-4.1 | Excellent at code/SQL generation | Viable alternative. Competitive pricing. No mandatory CoT. |
| Gemini 2.5 Pro | Natively multimodal (text + images + video) | Best option if the system ever needs to process product images. More expensive. |
| Qwen 3.6 Plus | 1M context window | Higher output price ($1.95/M). MiniMax M2.7 is cheaper and has mandatory CoT. |

**Why MiniMax M2.7 won:**
- Mandatory chain-of-thought reasoning on every response — critical for complex SQL generation, hybrid data + knowledge questions, and multi-step analysis
- 204,800 token context handles full schema + 14 few-shot examples + conversation history + retrieved documents comfortably
- Native tool calling is required for our thin orchestrator pattern
- Cost-effective: $0.30/M input, $1.20/M output — a fraction of Claude pricing
- Cache read pricing ($0.06/M) reduces cost for repeated schema injections across tool calls
- Strong at structured reasoning tasks: 56.2% on SWE-Pro, strong document generation
- Released March 18, 2026 — current generation model

**Known limitations to design around:**
- Mandatory CoT adds token overhead — mitigated by the low per-token cost and the accuracy gains on complex queries
- Closed-source, no self-hosting option
- 204,800 context is generous for this use case but smaller than 1M-context alternatives

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
Usage: createOpenRouter({ apiKey }) → openrouter.chat('minimax/minimax-m2.7')
```

The SDK handles:
- Streaming responses via `streamText`
- Tool call execution loop (call model → execute tools → feed results back → model synthesizes)
- Message formatting and history management

## References

- OpenRouter API docs: https://openrouter.ai/docs
- OpenRouter quickstart: https://openrouter.ai/docs/quickstart
- MiniMax M2.7 model page: https://openrouter.ai/minimax/minimax-m2.7
- Vercel AI SDK docs: https://ai-sdk.dev/docs
- Vercel AI SDK — OpenRouter provider: https://ai-sdk.dev/providers/community-providers/openrouter
- Vercel AI SDK — tool calling: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- Vercel AI SDK — streaming: https://ai-sdk.dev/docs/ai-sdk-core/generating-text
- MiniMax official site: https://www.minimaxi.com
