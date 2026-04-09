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

**Internal agency tool / SaaS dashboard aesthetic.** Professional, information-dense, dark-mode-only color palette. Not a consumer pet brand website.

Inspiration: Mixpanel, Amplitude, Triple Whale (e-commerce analytics), Helium 10 (Amazon analytics).

**Dark mode only** — No light mode toggle. Blue-tinted oklch neutrals (hue 250, chroma 0.01-0.012). Design tokens defined in globals.css using `--background` through `--chart-5`.

## Layout

### Dashboard (main view)

- **Top nav** — platform branding, brand selector (TailWag / PureVita / GlowHaven), date range filter
- **Metric cards** — KPI summary cards (total revenue, ad spend, subscriber count, conversion rate)
- **Charts area** — 1-2 charts showing trends (revenue over time, brand comparison)
- **Chat panel** — 400px right-side collapsible panel with AI assistant (Sheet overlay on mobile)

### Chat Panel (right-side collapsible)

- **400px right-side panel**, not a floating bubble. Collapses via close button. Toggle in top bar re-opens it.
- On mobile (< 768px), renders as a Sheet overlay instead of inline panel.
- Chat message thread with streaming responses via Streamdown
- Tool call chips (collapsible) show loading → complete state for query_database, search_knowledge_base, check_compliance
- Source citations displayed inline. SQL queries shown in collapsible code blocks within tool chips.
- Compliance violations highlighted with red badge and suggested alternatives
- Input with Enter-to-send, Shift+Enter for newline. Focus ring on input container. Stop button during streaming.

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

## Polish & Animations

- **GSAP entrance animations** — KPI cards stagger on page load (fade up, 50ms delay, power2.out). Charts fade in after KPI strip with 0.3s delay.
- **Responsive breakpoints** — KPI grid: 2-col on mobile, 4-col on lg. Charts stack to 1-col on small screens, 12-col grid on lg. Chat panel becomes Sheet overlay on < 768px.
- **Font-variant-numeric** — `tabular-nums` on all numeric displays: KPI values, KPI details, chart axes, date ranges, tool chip row counts.
- **Chart tooltips** — Formatted currency ($XXK or $X.XXM). X-axis shows month abbreviations (Jan, Feb, etc.).
- **Streamdown dark theme** — Custom CSS for code blocks, tables, blockquotes on dark background. Colors match design tokens.
- **Accessibility** — aria-labels on icon-only buttons (close, send, stop, sidebar trigger, chat toggle). focus-visible rings on interactive elements.
- **Empty states** — Subscription chart shows "No subscription data" when brand has no data (GlowHaven).

## References

- ShadCN docs: https://ui.shadcn.com/docs
- ShadCN Charts: https://ui.shadcn.com/docs/components/chart
- Tailwind CSS docs: https://tailwindcss.com/docs
- Lucide icons: https://lucide.dev
- GSAP docs: https://gsap.com/docs/
- Recharts docs: https://recharts.org/en-US
