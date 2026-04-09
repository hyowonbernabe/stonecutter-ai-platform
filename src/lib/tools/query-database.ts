import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { env } from '../config/env';
import { queryDb, getSchema, getSampleRows } from '../db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueryDatabaseResult {
  sql: string;
  results: Record<string, unknown>[];
  rowCount: number;
  warning?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Schema whitelist for validation
// ---------------------------------------------------------------------------

const VALID_TABLES: Record<string, string[]> = {
  products: [
    'asin', 'title', 'brand', 'category', 'price', 'rating',
    'review_count', 'is_subscribe_save_eligible', 'launch_date',
  ],
  daily_sales: [
    'date', 'asin', 'units_ordered', 'revenue', 'sessions',
    'page_views', 'buy_box_percentage', 'unit_session_percentage',
  ],
  advertising: [
    'date', 'asin', 'campaign_type', 'impressions', 'clicks',
    'spend', 'ad_sales', 'ad_units',
  ],
  subscriptions: [
    'date', 'asin', 'active_subscribers', 'new_subscribers',
    'cancelled_subscribers', 'subscription_revenue', 'subscription_units',
  ],
  customer_metrics: [
    'date', 'brand', 'new_customers', 'returning_customers',
    'new_to_brand_orders', 'repeat_orders',
  ],
};

const ALL_COLUMNS = new Set(Object.values(VALID_TABLES).flat());
const ALL_TABLES = new Set(Object.keys(VALID_TABLES));

// ---------------------------------------------------------------------------
// Annotated schema — injected into every SQL prompt for maximum accuracy
// Research: column descriptions are the #1 accuracy lever for text-to-SQL
// ---------------------------------------------------------------------------

const ANNOTATED_SCHEMA = `
CREATE TABLE products (
  asin TEXT PRIMARY KEY,                           -- Amazon Standard Identification Number (unique product ID)
  title TEXT NOT NULL,                              -- Full product listing title
  brand TEXT NOT NULL,                              -- Brand name: 'PureVita Supplements', 'GlowHaven Skincare', 'TailWag Pet Wellness'
  category TEXT NOT NULL,                           -- Product category: 'Health & Household', 'Beauty & Personal Care', 'Pet Supplies'
  price REAL NOT NULL,                              -- Retail price in USD
  rating REAL,                                      -- Average star rating (range: 3.8 - 4.8)
  review_count INTEGER,                             -- Total number of customer reviews
  is_subscribe_save_eligible INTEGER DEFAULT 1,     -- Subscribe & Save eligible: 1 = yes, 0 = no
  launch_date TEXT                                  -- Product launch date (ISO format: 'YYYY-MM-DD')
);

CREATE TABLE daily_sales (
  date TEXT NOT NULL,                               -- Sale date (ISO format: 'YYYY-MM-DD')
  asin TEXT NOT NULL,                               -- FK → products.asin
  units_ordered INTEGER,                            -- Units sold that day
  revenue REAL,                                     -- Revenue in USD (units × price, may include discounts)
  sessions INTEGER,                                 -- Listing page sessions (unique visitors)
  page_views INTEGER,                               -- Listing page views (total, including repeat views)
  buy_box_percentage REAL,                          -- Buy Box win rate as percentage (e.g., 95.3 means 95.3%)
  unit_session_percentage REAL,                     -- Conversion rate as percentage (e.g., 12.5 means 12.5%)
  PRIMARY KEY (date, asin)
);
-- NOTE: GlowHaven Retinol Night Cream (B0A2GLOWHAVN2) buy_box_percentage drops to 55-75% from Oct 2025 onward

CREATE TABLE advertising (
  date TEXT NOT NULL,                               -- Ad report date (ISO format: 'YYYY-MM-DD')
  asin TEXT NOT NULL,                               -- FK → products.asin
  campaign_type TEXT NOT NULL,                      -- Campaign type (e.g., 'Sponsored Products - Brand', 'Sponsored Display - Retargeting')
  impressions INTEGER,                              -- Number of ad impressions
  clicks INTEGER,                                   -- Number of ad clicks
  spend REAL,                                       -- Ad spend in USD
  ad_sales REAL,                                    -- Sales attributed to ads in USD
  ad_units INTEGER,                                 -- Units attributed to ads
  PRIMARY KEY (date, asin, campaign_type)
);

CREATE TABLE subscriptions (
  date TEXT NOT NULL,                               -- Report date (ISO format: 'YYYY-MM-DD')
  asin TEXT NOT NULL,                               -- FK → products.asin
  active_subscribers INTEGER,                       -- Current active Subscribe & Save subscribers
  new_subscribers INTEGER,                          -- New subscribers added that day
  cancelled_subscribers INTEGER,                    -- Subscribers who cancelled that day
  subscription_revenue REAL,                        -- Subscription revenue in USD (after S&S discount)
  subscription_units INTEGER,                       -- Units sold via subscription
  PRIMARY KEY (date, asin)
);
-- NOTE: GlowHaven Skincare products have NO subscription data (skincare has low S&S adoption)
-- NOTE: TailWag Calming Treats (B0A3TAILWAG02) cancelled_subscribers spikes 3.5x during Sep 1 - Oct 15, 2025

CREATE TABLE customer_metrics (
  date TEXT NOT NULL,                               -- Report date (ISO format: 'YYYY-MM-DD')
  brand TEXT NOT NULL,                              -- Brand name (matches products.brand)
  new_customers INTEGER,                            -- First-time purchasers
  returning_customers INTEGER,                      -- Repeat purchasers
  new_to_brand_orders INTEGER,                      -- Orders from new-to-brand customers
  repeat_orders INTEGER,                            -- Orders from returning customers
  PRIMARY KEY (date, brand)
);

-- RELATIONSHIPS:
-- daily_sales.asin → products.asin (JOIN to get brand/title/category)
-- advertising.asin → products.asin (JOIN to get brand/title/category)
-- subscriptions.asin → products.asin (JOIN to get brand/title/category)
-- customer_metrics.brand = products.brand (JOIN on brand name, not asin)
`.trim();

const SQLITE_RULES = `
## SQLite Dialect Rules

- Use SQLite syntax ONLY. This is NOT PostgreSQL or MySQL.
- Date extraction: use strftime('%Y', date_col) — NEVER use EXTRACT(YEAR FROM ...)
- Month extraction: use strftime('%m', date_col) or strftime('%Y-%m', date_col)
- Date arithmetic: use date(date_col, '+1 month') — NEVER use DATEADD or INTERVAL
- RIGHT JOIN is NOT supported — rewrite as LEFT JOIN with swapped table order
- FULL OUTER JOIN is NOT supported — use UNION of two LEFT JOINs if needed
- String concatenation: use || operator — NEVER use CONCAT()
- Integer division truncates — use CAST(x AS REAL) or multiply by 1.0 for decimal results
- Date literals MUST be ISO8601 format: 'YYYY-MM-DD'
- Use NULLIF(divisor, 0) to prevent division by zero
- Use COALESCE() for fallback values on NULLs
- LIMIT must use a literal integer — no variables or expressions
`.trim();

// ---------------------------------------------------------------------------
// Few-shot examples
// ---------------------------------------------------------------------------

const FEW_SHOT_EXAMPLES = `
IMPORTANT: The database contains data from January 2025 through February 2026 only.
NEVER use date('now') or any relative date functions — they return dates outside the data range.
Always use absolute date strings. "Last month" = February 2026. "This year" = 2025-01-01 to 2026-02-28.

Q: "What was the total revenue for PureVita Supplements last month?"
SQL: SELECT SUM(ds.revenue) AS total_revenue FROM daily_sales ds JOIN products p ON ds.asin = p.asin WHERE p.brand = 'PureVita Supplements' AND ds.date >= '2026-02-01' AND ds.date <= '2026-02-28'

Q: "Which product has the highest number of units ordered?"
SQL: SELECT p.title, SUM(ds.units_ordered) AS total_units FROM daily_sales ds JOIN products p ON ds.asin = p.asin GROUP BY p.title ORDER BY total_units DESC LIMIT 1

Q: "What is the average ROAS across all campaigns?"
SQL: SELECT ROUND(SUM(ad_sales) / NULLIF(SUM(spend), 0), 2) AS avg_roas FROM advertising

Q: "Show me the monthly subscription trend for TailWag products"
SQL: SELECT strftime('%Y-%m', s.date) AS month, SUM(s.active_subscribers) AS active_subs, SUM(s.new_subscribers) AS new_subs, SUM(s.cancelled_subscribers) AS cancelled FROM subscriptions s JOIN products p ON s.asin = p.asin WHERE p.brand = 'TailWag Pet Wellness' GROUP BY month ORDER BY month

Q: "Compare new vs returning customers by brand this year"
SQL: SELECT cm.brand, SUM(cm.new_customers) AS new_custs, SUM(cm.returning_customers) AS returning_custs FROM customer_metrics cm WHERE cm.date >= '2025-01-01' GROUP BY cm.brand

Q: "How did GlowHaven's ad spend change between Q3 and Q4 2025?"
SQL: SELECT CASE WHEN a.date >= '2025-07-01' AND a.date <= '2025-09-30' THEN 'Q3 2025' WHEN a.date >= '2025-10-01' AND a.date <= '2025-12-31' THEN 'Q4 2025' END AS quarter, SUM(a.spend) AS total_spend FROM advertising a JOIN products p ON a.asin = p.asin WHERE p.brand = 'GlowHaven Skincare' AND a.date BETWEEN '2025-07-01' AND '2025-12-31' GROUP BY quarter

Q: "Which product has the worst Buy Box percentage?"
SQL: SELECT p.title, p.brand, ROUND(AVG(ds.buy_box_percentage), 1) AS avg_buy_box FROM daily_sales ds JOIN products p ON ds.asin = p.asin WHERE ds.date >= '2025-10-01' GROUP BY p.asin ORDER BY avg_buy_box ASC LIMIT 5

Q: "What is the conversion rate trend for PureVita products month over month?"
SQL: SELECT strftime('%Y-%m', ds.date) AS month, ROUND(AVG(ds.unit_session_percentage), 2) AS avg_conversion_rate FROM daily_sales ds JOIN products p ON ds.asin = p.asin WHERE p.brand = 'PureVita Supplements' GROUP BY month ORDER BY month

Q: "Did TailWag have a subscription churn spike?"
SQL: SELECT strftime('%Y-%m', s.date) AS month, SUM(s.cancelled_subscribers) AS total_cancelled, SUM(s.new_subscribers) AS total_new FROM subscriptions s JOIN products p ON s.asin = p.asin WHERE p.brand = 'TailWag Pet Wellness' GROUP BY month ORDER BY month

Q: "Rank all brands by total revenue"
SQL: SELECT p.brand, SUM(ds.revenue) AS total_revenue FROM daily_sales ds JOIN products p ON ds.asin = p.asin GROUP BY p.brand ORDER BY total_revenue DESC

Q: "What is the month-over-month revenue growth for each brand?"
SQL: SELECT curr.brand, curr.month, curr.revenue, ROUND((curr.revenue - prev.revenue) * 100.0 / NULLIF(prev.revenue, 0), 1) AS growth_pct FROM (SELECT p.brand, strftime('%Y-%m', ds.date) AS month, SUM(ds.revenue) AS revenue FROM daily_sales ds JOIN products p ON ds.asin = p.asin GROUP BY p.brand, month) curr LEFT JOIN (SELECT p.brand, strftime('%Y-%m', ds.date) AS month, SUM(ds.revenue) AS revenue FROM daily_sales ds JOIN products p ON ds.asin = p.asin GROUP BY p.brand, month) prev ON curr.brand = prev.brand AND curr.month = strftime('%Y-%m', date(prev.month || '-01', '+1 month')) ORDER BY curr.brand, curr.month

Q: "What is the TACoS (Total Advertising Cost of Sales) by brand?"
SQL: SELECT p.brand, ROUND(SUM(a.spend) * 100.0 / NULLIF(SUM(ds.revenue), 0), 2) AS tacos_pct FROM advertising a JOIN products p ON a.asin = p.asin JOIN daily_sales ds ON a.asin = ds.asin AND a.date = ds.date GROUP BY p.brand

Q: "Break down ad performance by campaign type for PureVita"
SQL: SELECT a.campaign_type, SUM(a.impressions) AS total_impressions, SUM(a.clicks) AS total_clicks, ROUND(SUM(a.clicks) * 100.0 / NULLIF(SUM(a.impressions), 0), 2) AS ctr_pct, SUM(a.spend) AS total_spend, SUM(a.ad_sales) AS total_ad_sales, ROUND(SUM(a.ad_sales) / NULLIF(SUM(a.spend), 0), 2) AS roas FROM advertising a JOIN products p ON a.asin = p.asin WHERE p.brand = 'PureVita Supplements' GROUP BY a.campaign_type ORDER BY total_ad_sales DESC

Q: "How many products does each brand have and what's the average price?"
SQL: SELECT brand, COUNT(*) AS product_count, ROUND(AVG(price), 2) AS avg_price, ROUND(AVG(rating), 2) AS avg_rating FROM products GROUP BY brand
`.trim();

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(question: string, sampleRows: string, errorFeedback?: string): string {
  let prompt = `You are a SQL expert for an Amazon brand management agency. Generate SQLite-compatible SELECT queries only.

## CRITICAL: Data Date Range

The database contains data from **January 2025 through February 2026** ONLY.
- NEVER use date('now'), date('now', ...), or any relative date functions.
- "Last month" = February 2026 (use dates '2026-02-01' to '2026-02-28').
- "This month" = February 2026.
- "This year" = January 2025 through February 2026.
- Always use absolute date strings like '2026-02-01'.

${SQLITE_RULES}

## Database Schema

${ANNOTATED_SCHEMA}

You may ONLY reference the tables and columns listed above. Do not invent or guess column names.

## Sample Rows

${sampleRows}

## Examples

${FEW_SHOT_EXAMPLES}

## Instructions

Think step by step:
1. Which tables contain the data needed to answer this question?
2. What JOIN conditions connect them? (Use the RELATIONSHIPS section above)
3. What WHERE filters apply? (date ranges, brand names, product filters)
4. What aggregations are needed? (SUM, AVG, COUNT, GROUP BY)
5. Does the result need ordering or limiting?

Then write the SQL. Return ONLY the SQL query, no explanation.

## Question

${question}`;

  if (errorFeedback) {
    prompt += `\n\n## Previous Attempt Failed\n\nThe SQL you generated previously produced this error:\n${errorFeedback}\n\nPlease fix the query and try again. Return ONLY the corrected SQL.`;
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// SQL extraction & validation
// ---------------------------------------------------------------------------

/** Strip markdown code fences if present */
function extractSql(raw: string): string {
  let sql = raw.trim();
  // Remove ```sql ... ``` or ``` ... ```
  sql = sql.replace(/^```(?:sql)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  return sql.trim();
}

/** Block non-SELECT statements and dangerous patterns */
function isSelectOnly(sql: string): boolean {
  const upper = sql.toUpperCase().trim();
  if (!upper.startsWith('SELECT')) return false;

  // Block destructive and meta-access keywords
  const blocked = [
    'DROP', 'INSERT', 'UPDATE', 'DELETE', 'ALTER', 'CREATE', 'PRAGMA',
    'ATTACH', 'DETACH', 'REPLACE', 'GRANT', 'REVOKE',
  ];
  for (const keyword of blocked) {
    if (new RegExp(`\\b${keyword}\\b`).test(upper)) {
      return false;
    }
  }

  // Block UNION — prevents injection via UNION SELECT from sqlite_master etc.
  if (/\bUNION\b/.test(upper)) {
    return false;
  }

  return true;
}

/** Block relative date functions — the dataset is fixed (Jan 2025 - Feb 2026) */
function hasRelativeDates(sql: string): boolean {
  const upper = sql.toUpperCase();
  // Block date('now'), date('now', ...), datetime('now'), etc.
  if (/\bDATE\s*\(\s*'NOW'/i.test(sql)) return true;
  if (/\bDATETIME\s*\(\s*'NOW'/i.test(sql)) return true;
  if (/\bSTRFTIME\s*\([^)]*'NOW'/i.test(sql)) return true;
  return false;
}

/** Block references to sqlite internal tables */
function hasForbiddenTables(sql: string): boolean {
  const upper = sql.toUpperCase();
  return /\bSQLITE_MASTER\b/.test(upper) || /\bSQLITE_SCHEMA\b/.test(upper);
}

/** Validate table names against known schema */
function validateTableNames(sql: string): string | null {
  if (hasForbiddenTables(sql)) {
    return 'Access to internal database tables is not allowed.';
  }

  // Extract table names from FROM and JOIN clauses
  const tablePattern = /(?:FROM|JOIN)\s+(\w+)/gi;
  let match: RegExpExecArray | null;
  while ((match = tablePattern.exec(sql)) !== null) {
    const table = match[1].toLowerCase();
    if (!ALL_TABLES.has(table)) {
      return `Unknown table: "${match[1]}". Valid tables: ${[...ALL_TABLES].join(', ')}`;
    }
  }
  return null;
}

/** Validate column names against known schema */
function validateColumnNames(sql: string): string | null {
  // Extract identifiers that look like column references (table.column or standalone column)
  // Only validate explicit table.column references to avoid false positives with aliases and functions
  const qualifiedPattern = /(\w+)\.(\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = qualifiedPattern.exec(sql)) !== null) {
    const table = match[1].toLowerCase();
    const column = match[2].toLowerCase();
    // Skip aliases (e.g., ds.revenue where ds is an alias)
    // We validate the column exists in ANY table since we can't resolve aliases here
    if (ALL_TABLES.has(table)) {
      if (!VALID_TABLES[table].includes(column)) {
        return `Unknown column "${match[2]}" in table "${match[1]}". Valid columns: ${VALID_TABLES[table].join(', ')}`;
      }
    } else {
      // It's an alias — check column against all tables
      if (!ALL_COLUMNS.has(column)) {
        return `Unknown column: "${match[2]}"`;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tool
// ---------------------------------------------------------------------------

/**
 * Query the SQLite database to answer questions about sales, advertising,
 * subscriptions, and customer metrics. Takes a natural language question,
 * generates SQL via LLM, validates, executes, and retries once on failure.
 */
export async function queryDatabaseTool(
  question: string,
): Promise<QueryDatabaseResult> {
  // Build sample rows string
  const tables = Object.keys(VALID_TABLES);
  const sampleRowParts: string[] = [];
  for (const table of tables) {
    const rows = getSampleRows(table, 2);
    sampleRowParts.push(`### ${table}\n${JSON.stringify(rows, null, 2)}`);
  }
  const sampleRows = sampleRowParts.join('\n\n');

  const openrouter = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });
  const model = openrouter.chat(env.OPENROUTER_MODEL);

  let lastError: string | undefined;
  const maxAttempts = 2;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate SQL via LLM
    const prompt = buildPrompt(question, sampleRows, lastError);

    let rawSql: string;
    try {
      const { text } = await generateText({
        model,
        prompt,
      });
      rawSql = text;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes('401') || message.includes('invalid') || message.includes('API key')) {
        return { sql: '', results: [], rowCount: 0, error: 'The API key is invalid or missing. Check your OPENROUTER_API_KEY in .env.' };
      }
      if (message.includes('429') || message.includes('rate limit')) {
        return { sql: '', results: [], rowCount: 0, error: 'Rate limit reached. Please wait a moment and try again.' };
      }
      return { sql: '', results: [], rowCount: 0, error: "I couldn't reach the AI model right now. Please try again in a moment." };
    }

    // Extract and validate SQL
    const sql = extractSql(rawSql);

    if (!isSelectOnly(sql)) {
      lastError = 'Only SELECT queries are allowed. Do not use DROP, INSERT, UPDATE, DELETE, ALTER, or CREATE.';
      continue;
    }

    if (hasRelativeDates(sql)) {
      lastError = "Do not use date('now') or relative date functions. The dataset covers January 2025 through February 2026 only. Use absolute date strings like '2026-02-01'.";
      continue;
    }

    const tableError = validateTableNames(sql);
    if (tableError) {
      lastError = tableError;
      continue;
    }

    const columnError = validateColumnNames(sql);
    if (columnError) {
      lastError = columnError;
      continue;
    }

    // Execute
    try {
      const { rows, rowCount } = queryDb(sql);
      const warning = rowCount === 0
        ? 'Query returned 0 rows. The data may not exist for this date range or filter.'
        : rowCount > 200
          ? `Query returned ${rowCount} rows. Consider adding filters or a LIMIT clause for large result sets.`
          : undefined;
      return { sql, results: rows, rowCount, warning };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      continue;
    }
  }

  return {
    sql: '',
    results: [],
    rowCount: 0,
    error: "I couldn't generate a valid query for that question. Try rephrasing.",
  };
}
