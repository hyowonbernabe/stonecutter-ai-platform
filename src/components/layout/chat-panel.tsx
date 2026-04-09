"use client";

import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  return (
    <div className="flex h-full w-[400px] min-w-[400px] flex-col border-l border-border bg-sidebar">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-semibold text-foreground">
          AI Assistant
        </span>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Message area — placeholder */}
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
          <p className="text-sm text-muted-foreground">
            Chat will be wired up in Step 2.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This panel shows the layout structure.
          </p>
        </div>
      </ScrollArea>

      {/* Input area — placeholder */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
            Ask about your brands...
          </div>
        </div>
      </div>
    </div>
  );
}
