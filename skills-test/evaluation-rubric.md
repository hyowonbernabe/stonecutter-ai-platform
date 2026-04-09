# Evaluation Rubric — Skills Test Scoring

Use this to score each candidate's submission. Total: 100 points.

---

## 1. Does It Work? (30 points)

This is the most important section. Run their system and try these questions:

### Data Questions (10 pts)
- [ ] "What was TailWag's total revenue in January 2026?" → Should return a specific dollar number by querying the database
- [ ] "Which brand had the highest advertising spend last quarter?" → Should query advertising table and compare brands
- [ ] "Show me GlowHaven's top 3 products by units sold" → Should return ranked product list

**Score:**
- 10: All three return correct, specific answers
- 7: Two of three work correctly
- 4: One works, others fail or return vague answers
- 0: Can't answer data questions

### Knowledge Questions (10 pts)
- [ ] "What should I do when S&S cancellation rate hits 3%?" → Should reference the SOP with specific steps
- [ ] "Is it okay to say 'treats joint pain' in a dog supplement listing?" → Should flag this as non-compliant and suggest alternative language
- [ ] "What's TailWag's brand voice like?" → Should reference the brand voice guide accurately

**Score:**
- 10: All three return accurate, sourced answers from the right documents
- 7: Two of three work correctly
- 4: One works, others miss or hallucinate
- 0: Can't answer knowledge questions

### Hybrid Questions (10 pts)
- [ ] "TailWag Calming Treats had a subscription churn spike in September 2025. What happened and what should we do?" → Should pull the churn data from the database AND reference the SOP for response protocol
- [ ] "GlowHaven Retinol Night Cream's Buy Box percentage dropped starting October 2025. How bad is it and what are the likely causes?" → Should pull the actual Buy Box data AND provide context

**Score:**
- 10: Both answers combine data + knowledge intelligently
- 5: One works well, the other is weak
- 0: Can't combine data and knowledge

---

## 2. RAG Implementation (20 points)

Look at how they handle the knowledge documents:

- [ ] **Chunking strategy (5 pts):** Did they thoughtfully split documents into retrievable chunks? Or just dump whole files into context?
- [ ] **Embedding choice (5 pts):** Did they use a real embedding model and vector store? (ChromaDB, FAISS, Pinecone, etc.)
- [ ] **Retrieval quality (5 pts):** When answering, does the system pull the RIGHT chunks? Or irrelevant ones?
- [ ] **Source attribution (5 pts):** Does it show which documents/sections it used? (Bonus — not required, but strong signal)

**Score 0–20 based on above.**

---

## 3. SQL Integration (15 points)

- [ ] **Query correctness (5 pts):** Do the generated SQL queries actually return correct results?
- [ ] **Query sophistication (5 pts):** Can it handle aggregations, date filtering, JOINs, and comparisons?
- [ ] **Error handling (5 pts):** What happens if a question doesn't match the schema? Does it fail gracefully?

---

## 4. Code Quality (15 points)

Look at their GitHub repo:

- [ ] **Readable (5 pts):** Can you follow the code structure? Are files organized logically?
- [ ] **README quality (5 pts):** Could you set up and run this yourself from their instructions?
- [ ] **No hardcoded secrets (5 pts):** API keys in environment variables, not in code?

**Red flags (deduct points):**
- API keys committed to repo: -5
- No README or setup instructions: -5
- Single 500+ line file with no organization: -5

---

## 5. Video Walkthrough (10 points)

- [ ] **Working demo (5 pts):** Does the system actually work in the video? Live, not pre-recorded output.
- [ ] **Clear explanation (5 pts):** Can they explain their architecture decisions in plain English? Do they communicate well?

---

## 6. Bonus Points (up to 10 extra)

- [ ] Compliance auto-detection — flags restricted language proactively (+3)
- [ ] Conversational memory — handles follow-up questions (+3)
- [ ] Deployed somewhere accessible (+2)
- [ ] Particularly elegant architecture or UI (+2)

---

## Scoring Summary

| Section | Max Points |
|---------|-----------|
| Does It Work? | 30 |
| RAG Implementation | 20 |
| SQL Integration | 15 |
| Code Quality | 15 |
| Video Walkthrough | 10 |
| **Total** | **90** |
| Bonus | +10 |

### Thresholds
- **75+ points:** Strong candidate — schedule live interview
- **60–74 points:** Solid foundation — interview if other candidates are weak
- **45–59 points:** Below bar — pass unless exceptional communication skills
- **Below 45:** No interview

---

## Notes for Lee

You don't need to read the code yourself. Here's how to evaluate:

1. **Watch their video first** (5 minutes). If the system doesn't work in the video, stop.
2. **Try running it yourself** — follow their README. If you can't get it running in 10 minutes, that's a code quality problem.
3. **Ask the test questions above** and check the answers against what you know from the documents.
4. **If you want Claude to review their code quality**, paste their repo link and ask: "Review this codebase for quality, architecture, and readability. Score it 0–15."

The best candidates will make you think: "This person could build Ava."
