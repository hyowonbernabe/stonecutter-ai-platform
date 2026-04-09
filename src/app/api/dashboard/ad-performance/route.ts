import { queryDb } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand');
  const brandFilter = brand ? `WHERE p.brand = '${brand}'` : '';
  const { rows } = queryDb(`
    SELECT p.brand, ROUND(SUM(a.spend), 0) as spend, ROUND(SUM(a.ad_sales), 0) as sales,
      ROUND(SUM(a.ad_sales) / NULLIF(SUM(a.spend), 0), 2) as roas
    FROM advertising a JOIN products p ON a.asin = p.asin ${brandFilter}
    GROUP BY p.brand ORDER BY sales DESC
  `);
  return Response.json(rows);
}
