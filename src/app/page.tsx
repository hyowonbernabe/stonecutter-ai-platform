"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { AppSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ChatPanel } from "@/components/chat/chat-panel";
import { SidebarInset } from "@/components/ui/sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TopProductsChart } from "@/components/dashboard/top-products-chart";
import { AdPerformanceChart } from "@/components/dashboard/ad-performance-chart";
import { SubscriptionChart } from "@/components/dashboard/subscription-chart";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const chartsRef = useRef<HTMLDivElement>(null);
  const chartsAnimated = useRef(false);

  useEffect(() => {
    if (chartsRef.current && !chartsAnimated.current) {
      chartsAnimated.current = true;
      const charts = chartsRef.current.querySelectorAll("[data-chart-card]");
      gsap.fromTo(
        charts,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.3 }
      );
    }
  }, []);

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen flex-col">
          <TopBar
            isChatOpen={isChatOpen}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            selectedBrand={selectedBrand}
            onBrandChange={setSelectedBrand}
          />
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
              {/* KPI strip */}
              <KpiStrip brand={selectedBrand} />

              {/* Charts grid */}
              <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div data-chart-card className="lg:col-span-7" style={{ opacity: 0 }}>
                  <RevenueChart brand={selectedBrand} />
                </div>
                <div data-chart-card className="lg:col-span-5" style={{ opacity: 0 }}>
                  <TopProductsChart brand={selectedBrand} />
                </div>
                <div data-chart-card className="lg:col-span-6" style={{ opacity: 0 }}>
                  <AdPerformanceChart brand={selectedBrand} />
                </div>
                <div data-chart-card className="lg:col-span-6" style={{ opacity: 0 }}>
                  <SubscriptionChart brand={selectedBrand} />
                </div>
              </div>
            </main>

            {/* Chat panel — inline on desktop, Sheet overlay on mobile */}
            {isChatOpen && !isMobile && (
              <ChatPanel onClose={() => setIsChatOpen(false)} />
            )}
            {isMobile && (
              <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
                <SheetContent side="right" className="w-full sm:w-[400px] p-0 bg-sidebar border-l border-border">
                  <ChatPanel onClose={() => setIsChatOpen(false)} />
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
