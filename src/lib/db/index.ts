import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'sample.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
    // Safety: limit query execution to 5 seconds to prevent abuse via expensive queries
    db.pragma('busy_timeout = 5000');
  }
  return db;
}

export function queryDb(sql: string): { rows: Record<string, unknown>[]; rowCount: number } {
  const database = getDb();
  const stmt = database.prepare(sql);
  const rows = stmt.all() as Record<string, unknown>[];
  return { rows, rowCount: rows.length };
}

export function getSchema(): string {
  const database = getDb();
  const tables = database
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { sql: string }[];
  return tables.map((t) => t.sql).join('\n\n');
}

export function getSampleRows(tableName: string, limit: number = 3): Record<string, unknown>[] {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) throw new Error(`Invalid table name: ${tableName}`);
  const database = getDb();
  const stmt = database.prepare(`SELECT * FROM ${tableName} LIMIT ?`);
  return stmt.all(limit) as Record<string, unknown>[];
}
