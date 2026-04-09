"use client";

import { useState } from "react";
import { ChevronDown, Database, Search, ShieldCheck, Loader2, CheckCircle2, XCircle, Copy, Check } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface ToolCallChipProps {
  toolName: string;
  state: string;
  input: unknown;
  output: unknown;
  errorText?: string;
}

const toolMeta: Record<string, { label: string; activeLabel: string; icon: typeof Database }> = {
  query_database: { label: "Queried database", activeLabel: "Querying database...", icon: Database },
  search_knowledge_base: { label: "Searched knowledge base", activeLabel: "Searching knowledge base...", icon: Search },
  check_compliance: { label: "Checked compliance", activeLabel: "Checking compliance...", icon: ShieldCheck },
};

export function ToolCallChip({ toolName, state, input, output, errorText }: ToolCallChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const meta = toolMeta[toolName] ?? { label: toolName, activeLabel: `Running ${toolName}...`, icon: Database };

  const isLoading = state === "input-streaming" || state === "input-available";
  const isDone = state === "output-available";
  const isError = state === "output-error";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
      <CollapsibleTrigger className="flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 transition-colors">
        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        {isDone && <CheckCircle2 className="h-3 w-3 text-chart-4" />}
        {isError && <XCircle className="h-3 w-3 text-destructive" />}
        <meta.icon className="h-3 w-3 text-muted-foreground" />
        <span>{isLoading ? meta.activeLabel : meta.label}</span>
        {isDone && <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />}
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-1.5">
        {isDone && !!output && (
          <div className="rounded-md border border-border bg-background p-3 text-xs">
            <ToolOutput toolName={toolName} output={output} />
          </div>
        )}
        {isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {errorText ?? "Tool execution failed"}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-1.5 right-1.5 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
      aria-label={copied ? "Copied" : "Copy SQL query"}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ToolOutput({ toolName, output }: { toolName: string; output: unknown }) {
  if (toolName === "query_database") {
    const data = output as { sql?: string; rowCount?: number; error?: string };
    return (
      <div className="space-y-2">
        {data.sql && (
          <div>
            <span className="text-muted-foreground">SQL Query</span>
            <pre className="relative mt-1 overflow-x-auto rounded bg-card p-2 pr-8 font-mono text-xs text-foreground">
              {data.sql}
              <CopyButton text={data.sql} />
            </pre>
          </div>
        )}
        {data.rowCount !== undefined && (
          <Badge variant="secondary" className="text-xs font-normal" style={{ fontVariantNumeric: "tabular-nums" }}>
            {data.rowCount} row{data.rowCount !== 1 ? "s" : ""} returned
          </Badge>
        )}
        {data.error && (
          <p className="text-destructive">{data.error}</p>
        )}
      </div>
    );
  }

  if (toolName === "search_knowledge_base") {
    const data = output as { chunks?: { source: string; section: string }[] };
    if (!data.chunks?.length) return <p className="text-muted-foreground">No results found</p>;
    return (
      <div className="space-y-1">
        <span className="text-muted-foreground">Sources</span>
        {data.chunks.map((chunk, i) => (
          <div key={i} className="flex items-center gap-2 text-foreground">
            <Search className="h-3 w-3 text-muted-foreground shrink-0" />
            <span>{chunk.source} &gt; {chunk.section}</span>
          </div>
        ))}
      </div>
    );
  }

  if (toolName === "check_compliance") {
    const data = output as { violations?: { term: string; suggestion: string }[]; isCompliant?: boolean };
    if (data.isCompliant) {
      return <p className="text-chart-4">No compliance issues found</p>;
    }
    return (
      <div className="space-y-1.5">
        {data.violations?.map((v, i) => (
          <div key={i} className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Badge variant="destructive" className="text-xs font-normal">{v.term}</Badge>
            </div>
            <p className="text-chart-4 pl-0.5">Suggested: {v.suggestion}</p>
          </div>
        ))}
      </div>
    );
  }

  return <pre className="overflow-x-auto text-foreground">{JSON.stringify(output, null, 2)}</pre>;
}
