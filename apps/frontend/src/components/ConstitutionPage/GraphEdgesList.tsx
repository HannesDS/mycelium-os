"use client";

import { ArrowRight } from "lucide-react";
import type { GraphEdge } from "@/lib/api";

const EDGE_TYPE_LABELS: Record<string, string> = {
  "reports-to": "reports to",
  "requests-from": "requests from",
  monitors: "monitors",
  triggers: "triggers",
  "collaborates-with": "collaborates with",
};

interface GraphEdgesListProps {
  edges: GraphEdge[];
}

export function GraphEdgesList({ edges }: GraphEdgesListProps) {
  if (edges.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h3 className="text-sm font-semibold text-white mb-3">
          Organisation Graph
        </h3>
        <p className="text-sm text-neutral-500">No graph edges defined</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
      <h3 className="text-sm font-semibold text-white mb-4">
        Organisation Graph
      </h3>
      <ul className="space-y-2">
        {edges.map((edge, i) => (
          <li
            key={`${edge.from}-${edge.to}-${i}`}
            className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-4 py-2.5 text-sm"
          >
            <span className="font-mono text-xs text-indigo-400">
              {edge.from}
            </span>
            <span className="text-neutral-500 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {EDGE_TYPE_LABELS[edge.type] ?? edge.type}
            </span>
            <span className="font-mono text-xs text-emerald-400">
              {edge.to}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
