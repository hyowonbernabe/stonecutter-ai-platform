# AI Platform Engineer — Skills Test

## Context

You're applying to build the AI platform for an Amazon brand management agency. The agency manages multiple brands across supplements, skincare, and pet wellness — generating $220M+ in annual Amazon revenue.

The agency has two types of data:
1. **Structured data** — a SQL database with daily sales, advertising, subscription, and customer metrics across all client brands
2. **Unstructured knowledge** — SOPs, compliance guides, brand voice documents, and competitive analyses stored as markdown files

Today, these two worlds are disconnected. The team queries the database for numbers, then manually references documents for context. Your job is to connect them.

## The Task

Build a system where a user can ask a natural language question and get an answer that intelligently pulls from **both** the SQL database and the knowledge base documents.

### Setup

1. **Database:** Run `python3 setup-test-database.py` to generate `data/sample.db` (SQLite). This creates 5 tables with 14 months of data across 3 brands and 15 products.
2. **Knowledge base:** 4 markdown documents in `data/knowledge/` — an SOP, a compliance guide, a brand voice guide, and a competitive analysis.

### Requirements

Your system must be able to answer questions like:

- **Data questions:** "What was TailWag's total revenue last month? How does it compare to the prior month?"
- **Knowledge questions:** "What should I do if a product's Subscribe & Save cancellation rate spikes above 3%?"
- **Hybrid questions:** "TailWag Calming Treats had a subscription churn spike in September 2025. Based on our SOP, what's the likely cause and what should we do?"
- **Compliance questions:** "Review this bullet point for our joint supplement: 'Treats hip and joint pain in dogs of all ages.' Is this compliant?"

### Technical Requirements

- Use any programming language (Python or TypeScript preferred)
- Use any LLM API (Claude, OpenAI, etc.)
- Use a vector database or embedding-based retrieval for the knowledge documents (ChromaDB, FAISS, Pinecone, pgvector, or similar)
- The system should have a usable interface — this can be a CLI, a web UI, or an API with example requests. It does not need to be polished.
- Include error handling for API failures and edge cases

### What We're Looking For

1. **RAG implementation** — How well do you chunk, embed, and retrieve from the knowledge documents?
2. **SQL integration** — Can you translate natural language questions into correct SQL queries against the database?
3. **Hybrid reasoning** — When a question needs both data and knowledge, does your system combine them intelligently?
4. **Code quality** — Is the code readable, well-structured, and maintainable? Could another developer pick this up?
5. **LLM integration** — Are you handling prompts, context windows, and API calls thoughtfully?

### Bonus Points

- Detect and flag compliance violations automatically (using the restricted language guide)
- Show the sources used to generate each answer (which documents, which SQL queries)
- Handle follow-up questions (conversational memory)
- Deploy it somewhere accessible (even a simple cloud deployment counts)

## Deliverables

1. **Source code** in a GitHub repository with a clear README (setup instructions, dependencies, how to run)
2. **A 5-minute screen recording** walking through:
   - How you set up the system
   - A live demo answering at least 3 different types of questions (data, knowledge, and hybrid)
   - A brief explanation of your architecture choices
3. **Your API key handling** — do NOT commit API keys. Use environment variables.

## Timeline

Submit within **3 days** of receiving this test.

## Questions?

If anything is unclear, email your point of contact. We'd rather you ask than assume.

Good luck.
