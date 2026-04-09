# Frontend

## Overview

A professional analytics dashboard for an Amazon brand management agency, with an AI chatbot widget for natural language queries. The dashboard displays real-time metrics from the SQLite database. The chatbot is a feature within the dashboard — not the entire product.

The users are **agency account managers and analysts** who manage brands (TailWag, PureVita, GlowHaven) on Amazon. This is an internal productivity tool, not a consumer-facing website.

## Tech Stack

| Component | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | SSR, API routes, React — all in one |
| Language | TypeScript | Type safety across frontend and backend |
| UI Components | ShadCN | Pre-built, accessible, Tailwind-styled, fast to ship |
| Charts | ShadCN Charts (built on Recharts) | Integrated with ShadCN design system |
| Styling | Tailwind CSS | Utility-first, rapid iteration |
| Icons | Lucide | Clean, consistent, tree-shakeable |
| Animations | GSAP | Subtle transitions for a premium, polished feel |

## Design Direction

**Internal agency tool / SaaS dashboard aesthetic.** Professional, information-dense, dark or neutral color palette. Not a consumer pet brand website.

Inspiration: Mixpanel, Amplitude, Triple Whale (e-commerce analytics), Helium 10 (Amazon analytics).

## Layout

### Dashboard (main view)

- **Top nav** — platform branding, brand selector (TailWag / PureVita / GlowHaven), date range filter
- **Metric cards** — KPI summary cards (total revenue, ad spend, subscriber count, conversion rate)
- **Charts area** — 1-2 charts showing trends (revenue over time, brand comparison)
- **Chatbot widget** — bottom-right floating button that opens the AI assistant panel

### Chatbot Widget (expanded)

- Slides up from bottom-right or opens as a side panel
- Chat message thread with streaming responses
- Source citations displayed inline and in a collapsible sources section
- SQL queries shown in collapsible code blocks
- Compliance violations highlighted with color coding
- Input box with send button

## Layered Build Approach

The frontend is built in layers. Layer 1 is the priority — it's where all the points are. Layers 2 and 3 are additive polish.

### Layer 1: AI Chat Interface (must ship)

The chatbot works perfectly. This is the core deliverable.

- Chat message thread with streaming responses
- Tool call results displayed (SQL queries, source citations)
- Conversation memory (follow-up questions work)
- Compliance violations flagged in responses
- Clean, professional styling with ShadCN components
- Responsive layout

### Layer 2: Dashboard Shell (high impact)

Enough to make the app feel like a real product.

- 3-4 metric cards with real data from SQLite (total revenue, active subscribers, ad spend, top product)
- 1-2 charts (revenue trend line, brand comparison bar chart)
- Brand selector in the nav
- The chatbot becomes a widget within the dashboard

### Layer 3: Full Dashboard (if time permits)

The full analytics experience.

- Multiple chart types (line, bar, pie)
- Date range filtering
- Brand-level drill-down
- More metric cards (conversion rate, Buy Box %, S&S churn rate)
- Data tables with sorting

### Decision: Why Layered

The rubric scores "Does it work?" at 30 points (AI functionality) and "Particularly elegant UI" at +2 bonus. Layer 1 is worth 30+ points. Layers 2-3 are worth +2 bonus at most. We never sacrifice core AI functionality for UI polish.

**For production:** The dashboard would become the primary interface with more sophisticated visualizations, real-time data refresh, role-based access, saved dashboards, export to PDF/CSV, and Slack/email alert integrations.

## Data for Dashboard

Dashboard charts and metric cards use **static SQLite queries** — not the AI. These are pre-defined queries that run on page load:

- Total revenue (current month, with MoM comparison)
- Active subscribers across all brands
- Total ad spend (current month)
- Top product by units sold
- Revenue trend (last 6 months, line chart)
- Brand comparison (bar chart by revenue)

These queries are served via `/api/dashboard/*` API routes, separate from the `/api/chat` AI route.

## References

- ShadCN docs: https://ui.shadcn.com/docs
- ShadCN Charts: https://ui.shadcn.com/docs/components/chart
- Tailwind CSS docs: https://tailwindcss.com/docs
- Lucide icons: https://lucide.dev
- GSAP docs: https://gsap.com/docs/
- Recharts docs: https://recharts.org/en-US
