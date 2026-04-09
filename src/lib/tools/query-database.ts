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
// Few-shot examples
// ---------------------------------------------------------------------------

const FEW_SHOT_EXAMPLES = `
Q: "What was the total revenue for PureVita Supplements last month?"
SQL: SELECT SUM(ds.revenue) as total_revenue FROM daily_sales ds JOIN products p ON ds.asin = p.asin WHERE p.brand = 'PureVita Supplements' AND ds.date >= date('now', 'start of month', '-1 month') AND ds.date < date('now', 'start of month')

Q: "Which product has the highest number of units ordered?"
SQL: SELECT p.title, SUM(ds.units_ordered) as total_units FROM daily_sales ds JOIN products p ON ds.asin = p.asin GROUP BY p.title ORDER BY total_units DESC LIMIT 1

Q: "What is the average ROAS across all campaigns?"
SQL: SELECT ROUND(SUM(ad_sales) / NULLIF(SUM(spend), 0), 2) as avg_roas FROM advertising

Q: "Show me the monthly subscription trend for TailWag products"
SQL: SELECT strftime('%Y-%m', s.date) as month, SUM(s.active_subscribers) as active_subs, SUM(s.new_subscribers) as new_subs, SUM(s.cancelled_subscribers) as cancelled FROM subscriptions s JOIN products p ON s.asin = p.asin WHERE p.brand = 'TailWag Pet Wellness' GROUP BY month ORDER BY month

Q: "Compare new vs returning customers by brand this year"
SQL: SELECT cm.brand, SUM(cm.new_customers) as new_custs, SUM(cm.returning_customers) as returning_custs FROM customer_metrics cm WHERE cm.date >= '2025-01-01' GROUP BY cm.brand
`.trim();

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(question: string, sampleRows: string, errorFeedback?: string): string {
  const schema = getSchema();

  let prompt = `You are a SQL expert for an Amazon brand management agency. Generate SQLite-compatible SELECT queries only.

## Database Schema

${schema}

## Sample Rows

${sampleRows}

## Examples

${FEW_SHOT_EXAMPLES}

## Instructions

Think through: which tables are relevant, what join conditions are needed, what filters apply, what aggregations are needed. Then write the SQL. Return ONLY the SQL query, no explanation.

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

/** Block non-SELECT statements */
function isSelectOnly(sql: string): boolean {
  const upper = sql.toUpperCase().trim();
  const blocked = ['DROP', 'INSERT', 'UPDATE', 'DELETE', 'ALTER', 'CREATE', 'PRAGMA'];
  for (const keyword of blocked) {
    // Check if it starts with a blocked keyword or contains it as a standalone statement
    if (new RegExp(`\\b${keyword}\\b`).test(upper) && !upper.startsWith('SELECT')) {
      return false;
    }
  }
  return upper.startsWith('SELECT');
}

/** Validate table names against known schema */
function validateTableNames(sql: string): string | null {
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
      return { sql, results: rows, rowCount };
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
