"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ChatPanel } from "@/components/layout/chat-panel";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(true);

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
            {/* Main content area — dashboard components go here in Step 4 */}
            <main className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-lg font-semibold text-foreground">
                  Dashboard
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  KPI cards and charts will be added in Step 4.
                </p>
              </div>
            </main>

            {/* Chat panel — toggleable */}
            {isChatOpen && <ChatPanel onClose={() => setIsChatOpen(false)} />}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
