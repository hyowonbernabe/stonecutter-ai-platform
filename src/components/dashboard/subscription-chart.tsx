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
} satisfies ChartConfig;

export function SubscriptionChart({ brand }: { brand?: string }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const params = brand ? `?brand=${encodeURIComponent(brand)}` : "";
    fetch(`/api/dashboard/subscription-growth${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [brand]);

  if (!data.length) {
    return <div className="h-[300px] animate-pulse rounded-xl border border-border bg-card" />;
  }

  // GlowHaven has no subscription data — show empty state
  const hasData = data.some((d: any) => (d.tailwag > 0 || d.purevita > 0));
  if (!hasData) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Subscription Growth</h3>
        <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
          No subscription data for this brand
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Subscription Growth</h3>
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <AreaChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => {
              const [y, m] = String(v).split("-");
              const date = new Date(Number(y), Number(m) - 1);
              return date.toLocaleDateString("en-US", { month: "short" });
            }}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Area type="monotone" dataKey="tailwag" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.1} strokeWidth={2} />
          <Area type="monotone" dataKey="purevita" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.1} strokeWidth={2} />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
