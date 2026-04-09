"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { X, ArrowUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./chat-message";
import { StarterPrompts } from "./starter-prompts";

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isStreaming = status === "streaming";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend(text?: string) {
    const message = text ?? input.trim();
    if (!message) return;
    sendMessage({ text: message });
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full w-[400px] min-w-[400px] flex-col border-l border-border bg-sidebar">
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

      {/* Message area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
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
      </ScrollArea>

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
