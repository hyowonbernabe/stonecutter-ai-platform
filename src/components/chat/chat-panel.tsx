"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { X, ArrowUp } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { StarterPrompts } from "./starter-prompts";

interface ChatPanelProps {
  onClose: () => void;
  width?: number;
}

export function ChatPanel({ onClose, width }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isStreaming = status === "streaming";

  // Detect if user has scrolled up from bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isUserScrolledUp.current = distanceFromBottom > 60;
  }, []);

  // Auto-scroll to bottom when messages change, unless user scrolled up
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!isUserScrolledUp.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // When streaming starts, reset scroll lock so new responses auto-scroll
  useEffect(() => {
    if (isStreaming) {
      isUserScrolledUp.current = false;
    }
  }, [isStreaming]);

  function handleSend(text?: string) {
    const message = text ?? input.trim();
    if (!message) return;
    isUserScrolledUp.current = false;
    sendMessage({ text: message });
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const panelStyle = width ? { width: `${width}px`, minWidth: `${Math.min(width, 300)}px` } : {};

  return (
    <div
      className="flex h-full w-[400px] min-w-[300px] max-w-[600px] flex-col border-l border-border bg-sidebar"
      style={panelStyle}
    >
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-semibold text-foreground">
          AI Assistant
        </span>
        <button
          onClick={onClose}
          aria-label="Close chat panel"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Message area — native scroll div instead of ScrollArea */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <StarterPrompts onSelect={handleSend} />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role as "user" | "assistant"}
                parts={message.parts as any[]}
                isStreaming={
                  isStreaming &&
                  message.id === messages[messages.length - 1]?.id &&
                  message.role === "assistant"
                }
              />
            ))}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {error.message ?? "Something went wrong. Please try again."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-lg border border-input bg-background p-1 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-[box-shadow]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your brands..."
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          {isStreaming ? (
            <button
              onClick={() => stop()}
              aria-label="Stop generating"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="h-3 w-3 rounded-sm bg-current" />
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              aria-label="Send message"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
