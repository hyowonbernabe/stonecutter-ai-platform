import { queryDb } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand');
  const brandFilter = brand ? `WHERE p.brand = '${brand}'` : '';

  const revenue = queryDb(`
    SELECT ROUND(SUM(ds.revenue), 2) as total
    FROM daily_sales ds JOIN products p ON ds.asin = p.asin ${brandFilter}
  `);
  const adSpend = queryDb(`
    SELECT ROUND(SUM(a.spend), 2) as spend, ROUND(SUM(a.ad_sales), 2) as sales
    FROM advertising a JOIN products p ON a.asin = p.asin ${brandFilter}
  `);
  const subscribers = queryDb(`
    SELECT SUM(s.active_subscribers) as total
    FROM subscriptions s JOIN products p ON s.asin = p.asin ${brandFilter}
    AND s.date = (SELECT MAX(date) FROM subscriptions)
  `);
  const topProduct = queryDb(`
    SELECT p.title, ROUND(SUM(ds.revenue), 2) as revenue
    FROM daily_sales ds JOIN products p ON ds.asin = p.asin ${brandFilter}
    GROUP BY p.title ORDER BY revenue DESC LIMIT 1
  `);

  const spend = (adSpend.rows[0]?.spend as number) ?? 0;
  const sales = (adSpend.rows[0]?.sales as number) ?? 0;

  return Response.json({
    revenue: (revenue.rows[0]?.total as number) ?? 0,
    adSpend: spend,
    roas: spend > 0 ? Math.round((sales / spend) * 100) / 100 : 0,
    subscribers: (subscribers.rows[0]?.total as number) ?? 0,
    topProduct: {
      name: (topProduct.rows[0]?.title as string) ?? 'N/A',
      revenue: (topProduct.rows[0]?.revenue as number) ?? 0,
    },
  });
}
