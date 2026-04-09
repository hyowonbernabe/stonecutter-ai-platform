"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  spend: { label: "Ad Spend", color: "var(--chart-5)" },
  sales: { label: "Ad Sales", color: "var(--chart-1)" },
} satisfies ChartConfig;

function shortBrand(b: string): string {
  if (b.includes("TailWag")) return "TailWag";
  if (b.includes("PureVita")) return "PureVita";
  if (b.includes("GlowHaven")) return "GlowHaven";
  return b;
}

export function AdPerformanceChart({ brand }: { brand?: string }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const params = brand ? `?brand=${encodeURIComponent(brand)}` : "";
    fetch(`/api/dashboard/ad-performance${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [brand]);

  if (!data.length) {
    return <div className="h-[300px] animate-pulse rounded-xl border border-border bg-card" />;
  }

  const chartData = data.map((d: any) => ({
    brand: shortBrand(d.brand),
    spend: d.spend,
    sales: d.sales,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Ad Performance</h3>
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <BarChart data={chartData} accessibilityLayer>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="brand" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
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
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="spend" fill="var(--color-spend)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
