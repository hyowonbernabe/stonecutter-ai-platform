"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Calendar } from "lucide-react";

const brands = [
  { label: "All Brands", value: undefined as string | undefined },
  { label: "TailWag", value: "TailWag Pet Wellness" },
  { label: "PureVita", value: "PureVita Supplements" },
  { label: "GlowHaven", value: "GlowHaven Skincare" },
];

interface TopBarProps {
  isChatOpen: boolean;
  onToggleChat: () => void;
  selectedBrand?: string;
  onBrandChange: (brand: string | undefined) => void;
}

export function TopBar({ isChatOpen, onToggleChat, selectedBrand, onBrandChange }: TopBarProps) {
  return (
    <header className="flex h-12 items-center gap-3 border-b border-border px-4">
      <SidebarTrigger className="-ml-1 h-7 w-7" aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="h-4" />
      <h1 className="text-sm font-semibold text-foreground">Overview</h1>

      {/* Brand selector */}
      <div className="flex items-center gap-1 ml-4">
        {brands.map((b) => (
          <button
            key={b.label}
            onClick={() => onBrandChange(b.value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedBrand === b.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Date range */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span style={{ fontVariantNumeric: "tabular-nums" }}>Jan 2025 – Feb 2026</span>
        </div>

        <Separator orientation="vertical" className="hidden md:block h-4" />

        <button
          onClick={onToggleChat}
          aria-label={isChatOpen ? "Close AI Assistant" : "Open AI Assistant"}
          className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors ${
            isChatOpen
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
      </div>
    </header>
  );
}
