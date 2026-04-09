"use client";

import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import "streamdown/styles.css";
import { ToolCallChip } from "./tool-call-chip";

interface MessagePart {
  type: string;
  text?: string;
  state?: string;
  toolCallId?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  parts: MessagePart[];
  isStreaming: boolean;
}

export function ChatMessage({ role, parts, isStreaming }: ChatMessageProps) {
  if (role === "user") {
    const text = parts.find((p) => p.type === "text")?.text ?? "";
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
          {text}
        </div>
      </div>
    );
  }

  // Assistant message — render all parts
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-1">
        {parts.map((part, i) => {
          // Tool call parts — type is "tool-{name}"
          if (part.type.startsWith("tool-")) {
            const toolName = part.type.slice(5);
            return (
              <ToolCallChip
                key={part.toolCallId ?? i}
                toolName={toolName}
                state={part.state ?? "output-available"}
                input={part.input}
                output={part.output}
                errorText={part.errorText}
              />
            );
          }

          // Text parts — render with Streamdown
          if (part.type === "text" && part.text) {
            return (
              <div
                key={i}
                className="rounded-xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5 text-sm text-card-foreground"
              >
                <Streamdown
                  plugins={{ code }}
                  isAnimating={isStreaming && part.state === "streaming"}
                  caret={isStreaming && part.state === "streaming" ? "block" : undefined}
                >
                  {part.text}
                </Streamdown>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
