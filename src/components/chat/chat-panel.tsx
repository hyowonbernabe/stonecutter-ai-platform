"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { X, ArrowUp, Plus, Clock, Loader2 } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { StarterPrompts } from "./starter-prompts";
import { ChatHistory } from "./chat-history";
import {
  loadStore,
  createSession,
  updateSessionMessages,
  switchSession,
  deleteSession,
  getActiveSession,
  type ChatSessionStore,
} from "@/lib/chat-sessions";

const MAX_MESSAGE_LENGTH = 4_000;
const COUNTER_THRESHOLD = 3_200; // 80% — only show counter near the limit

interface ChatPanelProps {
  onClose: () => void;
  width?: number;
}

export function ChatPanel({ onClose, width }: ChatPanelProps) {
  // Start with empty state for SSR, hydrate from localStorage on mount
  const [store, setStore] = useState<ChatSessionStore>({ activeId: "", sessions: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadStore();
    if (loaded.sessions.length === 0) {
      setStore(createSession(loaded));
    } else if (!loaded.activeId || !loaded.sessions.find((s) => s.id === loaded.activeId)) {
      setStore({ ...loaded, activeId: loaded.sessions[0].id });
    } else {
      setStore(loaded);
    }
    setHydrated(true);
  }, []);

  const [showHistory, setShowHistory] = useState(false);
  const activeSession = getActiveSession(store);

  function handleNewChat() {
    const next = createSession(store);
    setStore(next);
    setShowHistory(false);
  }

  function handleSelectSession(id: string) {
    const next = switchSession(store, id);
    setStore(next);
    setShowHistory(false);
  }

  function handleDeleteSession(id: string) {
    const next = deleteSession(store, id);
    if (next.sessions.length === 0) {
      setStore(createSession(next));
    } else {
      setStore(next);
    }
  }

  function handleMessagesChange(sessionId: string, messages: any[]) {
    setStore((prev) => updateSessionMessages(prev, sessionId, messages));
  }

  const panelStyle = width ? { width: `${width}px`, minWidth: `${Math.min(width, 300)}px` } : {};

  return (
    <div
      className="flex h-full w-[400px] min-w-[300px] max-w-[600px] flex-col border-l border-border bg-sidebar"
      style={panelStyle}
    >
      {/* Header */}
      <div className="flex h-12 items-center gap-2 border-b border-border px-3">
        <button
          onClick={() => setShowHistory(!showHistory)}
          aria-label={showHistory ? "Hide conversation history" : "Show conversation history"}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            showHistory
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Clock className="h-4 w-4" />
        </button>

        <span className="flex-1 text-sm font-semibold text-foreground truncate">
          {hydrated ? (activeSession?.title ?? "AI Assistant") : "AI Assistant"}
        </span>

        <button
          onClick={handleNewChat}
          aria-label="New conversation"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" />
        </button>

        <button
          onClick={onClose}
          aria-label="Close chat panel"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body — wait for hydration before rendering chat */}
      {!hydrated ? (
        <div className="flex-1" />
      ) : showHistory ? (
        <ChatHistory
          sessions={store.sessions}
          activeId={store.activeId}
          onSelect={handleSelectSession}
          onDelete={handleDeleteSession}
          onNew={handleNewChat}
        />
      ) : activeSession ? (
        <ActiveChat
          key={activeSession.id}
          session={activeSession}
          onMessagesChange={(msgs) => handleMessagesChange(activeSession.id, msgs)}
        />
      ) : null}
    </div>
  );
}

function ActiveChat({
  session,
  onMessagesChange,
}: {
  session: { id: string; messages: any[] };
  onMessagesChange: (messages: any[]) => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    id: session.id,
    messages: session.messages.length > 0 ? session.messages : undefined,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isStreaming = status === "streaming";
  const isBusy = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (messages.length > 0) {
      onMessagesChange(messages);
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isUserScrolledUp.current = distanceFromBottom > 60;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!isUserScrolledUp.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isStreaming) {
      isUserScrolledUp.current = false;
    }
  }, [isStreaming]);

  function formatError(err: Error): string {
    const msg = err.message ?? "";
    // Surface structured API errors (429, 400, 401, 500)
    if (msg.includes("Too many requests")) return "Too many requests. Please wait a minute before trying again.";
    if (msg.includes("Message too long")) return "Your message is too long. Please shorten it and try again.";
    if (msg.includes("Conversation too long")) return "This conversation is too long. Please start a new one.";
    if (msg.includes("API key")) return "Configuration error. The API key may be missing or invalid.";
    return msg || "Something went wrong. Please try again.";
  }

  function handleSend(text?: string) {
    const message = text ?? input.trim();
    if (!message || status !== "ready" || message.length > MAX_MESSAGE_LENGTH) return;
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

  return (
    <>
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
            {messages.map((message, index) => (
              <ChatMessage
                key={`${message.id}-${index}`}
                role={message.role as "user" | "assistant"}
                parts={message.parts as any[]}
                isStreaming={
                  isStreaming &&
                  message.id === messages[messages.length - 1]?.id &&
                  message.role === "assistant"
                }
              />
            ))}
            {(status === "submitted" || (isStreaming && messages[messages.length - 1]?.role === "user")) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <p>{formatError(error)}</p>
                <button
                  onClick={() => regenerate()}
                  className="mt-2 text-xs underline underline-offset-2 hover:text-destructive/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-lg border border-input bg-background p-1 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-[box-shadow]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your brands..."
            disabled={status !== "ready"}
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          {isBusy ? (
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
              disabled={!input.trim() || input.length > MAX_MESSAGE_LENGTH || status !== "ready"}
              aria-label="Send message"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
          {input.length >= COUNTER_THRESHOLD && (
            <div className={`text-right mt-1 text-xs ${input.length > MAX_MESSAGE_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
              {input.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}
            </div>
          )}
      </div>
    </>
  );
}
