"use client";

import { MessageSquare, Trash2, Plus } from "lucide-react";
import type { ChatSession } from "@/lib/chat-sessions";

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function ChatHistory({ sessions, activeId, onSelect, onDelete, onNew }: ChatHistoryProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Conversations
          </span>
          <button
            onClick={onNew}
            aria-label="New conversation"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-secondary transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="py-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                  session.id === activeId
                    ? "bg-secondary"
                    : "hover:bg-secondary/50"
                }`}
                onClick={() => onSelect(session.id)}
              >
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatRelativeTime(session.updatedAt)}
                    {session.messages.length > 0 && (
                      <span> · {session.messages.length} msgs</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.id);
                  }}
                  aria-label="Delete conversation"
                  className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
