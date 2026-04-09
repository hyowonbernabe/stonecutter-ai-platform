import { queryDb } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand');
  const brandFilter = brand ? `AND p.brand = '${brand}'` : '';
  const { rows } = queryDb(`
    SELECT strftime('%Y-%m', s.date) as month,
      SUM(CASE WHEN p.brand = 'TailWag Pet Wellness' THEN s.active_subscribers ELSE 0 END) as tailwag,
      SUM(CASE WHEN p.brand = 'PureVita Supplements' THEN s.active_subscribers ELSE 0 END) as purevita
    FROM subscriptions s JOIN products p ON s.asin = p.asin
    WHERE 1=1 ${brandFilter} GROUP BY month ORDER BY month
  `);
  return Response.json(rows);
}
