"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const brandColors: Record<string, string> = {
  "TailWag Pet Wellness": "var(--chart-1)",
  "PureVita Supplements": "var(--chart-2)",
  "GlowHaven Skincare": "var(--chart-3)",
};

const chartConfig = {
  revenue: { label: "Revenue" },
} satisfies ChartConfig;

export function TopProductsChart({ brand }: { brand?: string }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const params = brand ? `?brand=${encodeURIComponent(brand)}` : "";
    fetch(`/api/dashboard/top-products${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [brand]);

  if (!data.length) {
    return <div className="h-[300px] animate-pulse rounded-xl border border-border bg-card" />;
  }

  const chartData = data.map((d: any) => ({
    name: d.name.length > 25 ? d.name.slice(0, 25) + "..." : d.name,
    revenue: d.revenue,
    fill: brandColors[d.brand] ?? "var(--chart-1)",
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Top Products</h3>
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <BarChart data={chartData} layout="vertical" accessibilityLayer>
          <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={140} tick={{ fontSize: 11 }} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => {
                  const n = Number(value);
                  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
                  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
                  return `$${n.toFixed(0)}`;
                }}
              />
            }
          />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
