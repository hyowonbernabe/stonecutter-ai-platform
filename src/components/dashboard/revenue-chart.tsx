"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  tailwag: { label: "TailWag", color: "var(--chart-1)" },
  purevita: { label: "PureVita", color: "var(--chart-2)" },
  glowhaven: { label: "GlowHaven", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function RevenueChart({ brand }: { brand?: string }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const params = brand ? `?brand=${encodeURIComponent(brand)}` : "";
    fetch(`/api/dashboard/revenue-trend${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [brand]);

  if (!data.length) {
    return <div className="h-[300px] animate-pulse rounded-xl border border-border bg-card" />;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Revenue by Brand</h3>
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <AreaChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => v.slice(5)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
          />
          <ChartTooltip content={<ChartTooltipContent />} labelFormatter={(v) => v} />
          <ChartLegend content={<ChartLegendContent />} />
          {brand ? (
            <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} strokeWidth={2} />
          ) : (
            <>
              <Area type="monotone" dataKey="tailwag" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="purevita" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="glowhaven" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.1} strokeWidth={2} />
            </>
          )}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
