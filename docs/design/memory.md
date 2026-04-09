# Conversation Memory

## Approach: Sliding Window (Last 20 Messages)

The conversation history is stored as a message array in the Next.js client state. The last 20 messages (10 full Q&A cycles) are passed to each LLM call.

### Decision: Why Sliding Window

**The key insight:** Follow-up questions in this system are **sequential deltas** — "What was TailWag's revenue?" then "How about last month?" — each depends on the immediately prior exchange. This is a critical constraint that rules out several alternatives.

**Alternatives considered:**

| Approach | Why not chosen |
|---|---|
| **Full message history** | Cost scales linearly. Beyond ~40 turns, models exhibit "context distraction" — over-relying on history rather than reasoning. OpenAI's o3 dropped from 98.1% to 64.1% accuracy in multi-turn benchmarks. |
| **Hybrid buffer + summary** | Keeps recent messages verbatim, summarizes older ones. Our sessions won't exceed 20 messages in a demo. Adds a summarization LLM call for no benefit at this scale. |
| **Anthropic's compaction API** | Server-side auto-summarization at 150k tokens. Requires Claude as the LLM provider, and our sessions are tiny (~8,500 tokens for 10 cycles). |
| **RAG-based conversation memory** | Embeds past messages, retrieves by similarity. Would FAIL for our use case because "how about last month?" doesn't semantically match "what was TailWag's revenue?" — follow-ups are sequential deltas, not topic recalls. Mem0 benchmarks: 61% accuracy vs 72.9% for full context. |
| **Fact extraction (Mem0)** | Extracts discrete facts across sessions. 93% token reduction. No cross-session need for this test — evaluator runs one session. |
| **Graph memory (Zep/Graphiti)** | Temporal knowledge graph. +15pts over Mem0 on temporal reasoning. Massive overhead (600K+ token memory footprint per conversation). Enterprise pattern for tracking changing facts over time. |
| **Three-tier hierarchy** (ChatGPT's pattern) | Working memory + short-term summaries + long-term facts. The gold standard at scale, but we have one user doing one session. |

**Why sliding window won:**
- 20 messages = ~10 full Q&A cycles, covering virtually all realistic follow-up chains
- Zero infrastructure, zero external dependencies, zero latency added
- Tool call results naturally carry forward in message history — the model sees its previous `query_database` calls and can reference those results
- With MiniMax M2.7's 204,800-token context, 8,500 tokens of history is under 4.2% of available context

**For production at scale:** Implement a three-tier hierarchy: (1) recent messages verbatim (last 15-20), (2) older context summarized with domain-specific instructions ("preserve all SQL queries, schema references, and user-stated constraints"), (3) cross-session fact extraction via Mem0 (`@mem0/vercel-ai-provider`) for user preferences and frequently-queried patterns. Target metrics: Recall@50 > 90%, contradiction rate < 5%, memory retrieval latency < 200ms. Keep memory writes asynchronous — never block the response on memory storage.

### Message Structure

Each message in the array includes:

```
{
  role: 'user' | 'assistant' | 'tool',
  content: string,
  metadata: {
    toolCalls?: { name, arguments, result }[],
    timestamp: string
  }
}
```

Tool call results (SQL queries executed, documents retrieved) are naturally preserved in the message history. When the model sees it previously called `query_database` and got specific results, it can reference those results in follow-up answers without re-querying.

### Behavior

- New messages are appended to the array
- When the array exceeds 20 messages, the oldest messages are dropped
- The system prompt is always included (not counted in the 20-message window)
- Tool call messages (function calls + results) count toward the 20-message limit

### Token Budget

Rough estimate per Q&A cycle:
- User message: ~50 tokens
- Tool calls + results: ~500 tokens
- Assistant response: ~300 tokens
- Total per cycle: ~850 tokens
- 10 cycles (20 messages): ~8,500 tokens

With MiniMax M2.7's 204,800-token context window, this is negligible. The system prompt + schema + few-shot examples (~3,000 tokens) plus 8,500 tokens of history is well under 6% of available context.

## References

- Vercel AI SDK — message handling: https://ai-sdk.dev/docs/ai-sdk-core/generating-text
- Mem0 Vercel AI SDK integration: https://docs.mem0.ai/integrations/vercel-ai-sdk
- Anthropic compaction API: https://platform.claude.com/docs/en/build-with-claude/compaction
