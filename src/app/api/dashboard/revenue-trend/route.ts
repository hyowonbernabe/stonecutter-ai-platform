import { queryDb } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand');
  let sql: string;
  if (brand) {
    sql = `SELECT strftime('%Y-%m', ds.date) as month, ROUND(SUM(ds.revenue), 0) as revenue
      FROM daily_sales ds JOIN products p ON ds.asin = p.asin
      WHERE p.brand = '${brand}' GROUP BY month ORDER BY month`;
  } else {
    sql = `SELECT strftime('%Y-%m', ds.date) as month,
      ROUND(SUM(CASE WHEN p.brand = 'TailWag Pet Wellness' THEN ds.revenue ELSE 0 END), 0) as tailwag,
      ROUND(SUM(CASE WHEN p.brand = 'PureVita Supplements' THEN ds.revenue ELSE 0 END), 0) as purevita,
      ROUND(SUM(CASE WHEN p.brand = 'GlowHaven Skincare' THEN ds.revenue ELSE 0 END), 0) as glowhaven
      FROM daily_sales ds JOIN products p ON ds.asin = p.asin GROUP BY month ORDER BY month`;
  }
  const { rows } = queryDb(sql);
  return Response.json(rows);
}
