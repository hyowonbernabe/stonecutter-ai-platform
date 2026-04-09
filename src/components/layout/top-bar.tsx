"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { MessageSquare } from "lucide-react";

interface TopBarProps {
  isChatOpen: boolean;
  onToggleChat: () => void;
}

export function TopBar({ isChatOpen, onToggleChat }: TopBarProps) {
  return (
    <header className="flex h-12 items-center gap-3 border-b border-border px-4">
      <SidebarTrigger className="-ml-1 h-7 w-7" />
      <Separator orientation="vertical" className="h-4" />
      <h1 className="text-sm font-semibold text-foreground">Overview</h1>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onToggleChat}
          className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors ${
            isChatOpen
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>AI Assistant</span>
        </button>
      </div>
    </header>
  );
}
