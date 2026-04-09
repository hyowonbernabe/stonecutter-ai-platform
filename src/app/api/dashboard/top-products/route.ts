import { queryDb } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand');
  const brandFilter = brand ? `WHERE p.brand = '${brand}'` : '';
  const { rows } = queryDb(`
    SELECT p.title as name, p.brand, ROUND(SUM(ds.revenue), 0) as revenue
    FROM daily_sales ds JOIN products p ON ds.asin = p.asin ${brandFilter}
    GROUP BY p.title, p.brand ORDER BY revenue DESC LIMIT 5
  `);
  return Response.json(rows);
}
