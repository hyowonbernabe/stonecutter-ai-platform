"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { KpiCard } from "./kpi-card";

interface OverviewData {
  revenue: number;
  adSpend: number;
  roas: number;
  subscribers: number;
  topProduct: { name: string; revenue: number };
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function KpiStrip({ brand }: { brand?: string }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const params = brand ? `?brand=${encodeURIComponent(brand)}` : "";
    fetch(`/api/dashboard/overview${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [brand]);

  useEffect(() => {
    if (data && stripRef.current && !hasAnimated.current) {
      hasAnimated.current = true;
      const cards = stripRef.current.querySelectorAll("[data-kpi-card]");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [data]);

  if (!data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-xl border border-border bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div ref={stripRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div data-kpi-card style={{ opacity: 0 }}>
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(data.revenue)}
          detail={`ROAS ${data.roas}x`}
          detailColor="text-chart-4"
        />
      </div>
      <div data-kpi-card style={{ opacity: 0 }}>
        <KpiCard
          label="Ad Spend"
          value={formatCurrency(data.adSpend)}
          detail={`${formatCurrency(data.roas * data.adSpend)} ad sales`}
        />
      </div>
      <div data-kpi-card style={{ opacity: 0 }}>
        <KpiCard
          label="Subscribers"
          value={data.subscribers.toLocaleString()}
          detail="Active S&S subscribers"
        />
      </div>
      <div data-kpi-card style={{ opacity: 0 }}>
        <KpiCard
          label="Top Product"
          value={data.topProduct.name.split(' - ')[0]}
          detail={formatCurrency(data.topProduct.revenue)}
        />
      </div>
    </div>
  );
}
