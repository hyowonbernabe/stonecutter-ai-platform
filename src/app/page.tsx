"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

const CHAT_MIN_WIDTH = 300;
const CHAT_MAX_WIDTH = 600;
const CHAT_DEFAULT_WIDTH = 400;

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const chartsRef = useRef<HTMLDivElement>(null);
  const chartsAnimated = useRef(false);

  // Resize state
  const [chatWidth, setChatWidth] = useState(CHAT_DEFAULT_WIDTH);
  const isResizing = useRef(false);

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

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = chatWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(CHAT_MAX_WIDTH, Math.max(CHAT_MIN_WIDTH, startWidth + delta));
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [chatWidth]);

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

            {/* Chat panel with resize handle — desktop only */}
            {isChatOpen && !isMobile && (
              <div className="relative flex">
                {/* Resize handle */}
                <div
                  onMouseDown={handleResizeStart}
                  className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-primary/30 active:bg-primary/50 transition-colors"
                  aria-label="Resize chat panel"
                />
                <ChatPanel onClose={() => setIsChatOpen(false)} width={chatWidth} />
              </div>
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
