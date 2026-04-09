"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ChatPanel } from "@/components/chat/chat-panel";
import { SidebarInset } from "@/components/ui/sidebar";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TopProductsChart } from "@/components/dashboard/top-products-chart";
import { AdPerformanceChart } from "@/components/dashboard/ad-performance-chart";
import { SubscriptionChart } from "@/components/dashboard/subscription-chart";

const brands = [
  { label: "All Brands", value: undefined },
  { label: "TailWag", value: "TailWag Pet Wellness" },
  { label: "PureVita", value: "PureVita Supplements" },
  { label: "GlowHaven", value: "GlowHaven Skincare" },
];

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen flex-col">
          <TopBar
            isChatOpen={isChatOpen}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
          />
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Brand selector */}
              <div className="flex items-center gap-2">
                {brands.map((b) => (
                  <button
                    key={b.label}
                    onClick={() => setSelectedBrand(b.value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedBrand === b.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {/* KPI strip */}
              <KpiStrip brand={selectedBrand} />

              {/* Charts grid */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-7">
                  <RevenueChart brand={selectedBrand} />
                </div>
                <div className="col-span-5">
                  <TopProductsChart brand={selectedBrand} />
                </div>
                <div className="col-span-6">
                  <AdPerformanceChart brand={selectedBrand} />
                </div>
                <div className="col-span-6">
                  <SubscriptionChart brand={selectedBrand} />
                </div>
              </div>
            </main>

            {isChatOpen && <ChatPanel onClose={() => setIsChatOpen(false)} />}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
