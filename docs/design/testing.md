# Testing with PromptFoo

## Overview

PromptFoo is used as the LLM evaluation framework. Test cases are defined upfront (TDD-style), used during development to verify each component works, and after development as a regression suite.

Execution: `npm run eval`

## Test Tiers

### Tier 1: Rubric Questions (Must Pass)

These are the exact questions from the evaluation rubric. If these fail, the submission fails. They are the "definition of done" for the AI backend.

**Data questions:**

| # | Question | Expected behavior |
|---|---|---|
| D1 | "What was TailWag's total revenue in January 2026?" | Returns a specific dollar number. SQL queries `daily_sales` joined with `products` filtered by brand and date range. |
| D2 | "Which brand had the highest advertising spend last quarter?" | Queries `advertising` table, aggregates by brand, compares across Q4 2025 or Q1 2026. Returns a brand name + dollar amount. |
| D3 | "Show me GlowHaven's top 3 products by units sold" | Returns a ranked list of 3 products with unit counts. SQL uses ORDER BY + LIMIT 3. |

**Knowledge questions:**

| # | Question | Expected behavior |
|---|---|---|
| K1 | "What should I do when S&S cancellation rate hits 3%?" | References the SOP with specific steps from the "When Cancellation Rate Hits Red" section. Cites source. |
| K2 | "Is it okay to say 'treats joint pain' in a dog supplement listing?" | Flags as non-compliant. References the compliance guide. Suggests alternative: "supports joint comfort and flexibility." |
| K3 | "What's TailWag's brand voice like?" | References the brand voice guide accurately — warm but credible, vet-formulated, transparent ingredients. |

**Hybrid questions:**

| # | Question | Expected behavior |
|---|---|---|
| H1 | "TailWag Calming Treats had a subscription churn spike in September 2025. What happened and what should we do?" | Pulls churn data from `subscriptions` table (B0A3TAILWAG02, Sep-Oct 2025 spike) AND references the SOP response protocol. |
| H2 | "GlowHaven Retinol Night Cream's Buy Box percentage dropped starting October 2025. How bad is it and what are the likely causes?" | Pulls Buy Box data from `daily_sales` (B0A2GLOWHAVN2, 55-75% from Oct 2025) AND provides context about causes. |

### Tier 2: Edge Cases (Should Handle Gracefully)

These test robustness. The system should not crash, hallucinate, or return nonsense.

| # | Question | Expected behavior |
|---|---|---|
| E1 | "What was revenue for BrandThatDoesNotExist?" | Graceful response: "I don't have data for that brand. The brands in the database are PureVita, GlowHaven, and TailWag." |
| E2 | "" (empty input) | Graceful handling — ask for a question or return a helpful prompt. |
| E3 | "asdfghjkl random gibberish" | Graceful: "I'm not sure what you're asking. Could you rephrase?" |
| E4 | "Review this bullet: 'Cures hip dysplasia in senior dogs'" | Flags TWO violations: "cures" (prohibited verb) and "hip dysplasia" (prohibited condition). Suggests compliant alternatives. |
| E5 | Follow-up: "What was TailWag's revenue last month?" then "How about GlowHaven?" | Second question correctly references context — queries GlowHaven revenue for the same time period. |
| E6 | "Delete all data from the database" | System does NOT execute destructive SQL. Returns a refusal or explains it can only read data. |

### Tier 3: Component-Level Tests (Development Safety Net)

These test individual components in isolation, not end-to-end. Used during development to verify each layer works before wiring them together.

**SQL generation:**

| # | Test | Assertion |
|---|---|---|
| S1 | Generate SQL for "total revenue by brand" | SQL references `daily_sales` and `products`, uses JOIN on asin, GROUP BY brand, SUM(revenue) |
| S2 | Generate SQL for "monthly trend" | SQL uses `strftime('%Y-%m', date)` for monthly grouping |
| S3 | Generate SQL for "top N products" | SQL uses ORDER BY DESC LIMIT N |
| S4 | Invalid column reference in generated SQL | Validation pipeline catches it before execution |
| S5 | Non-SELECT statement generated | Validation pipeline rejects it |

**RAG retrieval:**

| # | Test | Assertion |
|---|---|---|
| R1 | Search "cancellation rate above 3%" | Top result is from `sop-subscribe-and-save-management.md`, section "When Cancellation Rate Hits Red" |
| R2 | Search "treats joint pain" | Top result is from `compliance-amazon-restricted-language.md` |
| R3 | Search "TailWag brand voice" | Top result is from `brand-voice-guide-tailwag.md` |
| R4 | Search "Zesty Paws competitor" | Top result is from `competitive-analysis-pet-supplements.md` |

**Compliance regex:**

| # | Test | Assertion |
|---|---|---|
| C1 | Input: "Treats hip and joint pain in dogs" | Flags "treats" and "joint pain" — wait, "joint pain" is not prohibited. Flags "treats" only. |
| C2 | Input: "Supports joint comfort and flexibility" | No violations — this is approved language. |
| C3 | Input: "Prevents heart disease and cures diabetes" | Flags "prevents", "heart disease", "cures", "diabetes" — four violations. |
| C4 | Input: "This prevents stacking of boxes" | Does NOT flag "prevents" — context is not health/wellness. (Note: regex may false-positive here. Document as known limitation.) |

## Assertion Types

| Layer | Assertion method | Why |
|---|---|---|
| SQL correctness | Validate generated SQL references correct tables/columns | Deterministic — we know the schema |
| SQL results | Pattern match on response for expected numbers/brand names | Semi-deterministic — values come from the database |
| RAG retrieval | Assert source document and section in response | Deterministic — we know which doc should match |
| Response quality | LLM-as-judge scoring for relevance and accuracy | Fuzzy — needed for open-ended answer quality |
| Compliance | Exact match on flagged terms | Deterministic — regex output is predictable |
| Source attribution | Assert response contains `[Source: ...]` citations | Pattern match |

## Execution

```
npm run eval          # Run full PromptFoo suite
npm run eval:tier1    # Run rubric questions only (fast check)
npm run eval:tier2    # Run edge cases
npm run eval:tier3    # Run component-level tests
```

**For production:** Integrate into CI via GitHub Actions — run `npm run eval:tier1` on every push, full suite on PR merge. Add automated regression detection with score thresholds (alert if accuracy drops below 80%).

## References

- PromptFoo docs: https://www.promptfoo.dev/docs/intro
