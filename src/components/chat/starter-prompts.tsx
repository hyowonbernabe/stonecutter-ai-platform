"use client";

import { Database, Search, ShieldCheck, BarChart3 } from "lucide-react";

const prompts = [
  {
    text: "What was TailWag's revenue last month?",
    icon: Database,
  },
  {
    text: "Compare ad performance across all brands",
    icon: BarChart3,
  },
  {
    text: "What are our brand voice guidelines?",
    icon: Search,
  },
  {
    text: "Is 'clinically proven' allowed in our listings?",
    icon: ShieldCheck,
  },
];

interface StarterPromptsProps {
  onSelect: (text: string) => void;
}

export function StarterPrompts({ onSelect }: StarterPromptsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <p className="text-sm font-medium text-foreground mb-1">
        Stonecutter AI
      </p>
      <p className="text-xs text-muted-foreground mb-6">
        Ask questions about your Amazon brands
      </p>
      <div className="grid grid-cols-1 gap-2 w-full max-w-[320px]">
        {prompts.map((prompt) => (
          <button
            key={prompt.text}
            onClick={() => onSelect(prompt.text)}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-xs text-secondary-foreground hover:bg-secondary transition-colors"
          >
            <prompt.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{prompt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
