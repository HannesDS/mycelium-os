"use client";

import { Search } from "lucide-react";
import type { KnowledgeDocumentItem } from "@/lib/api";
import { KnowledgeList } from "@/components/KnowledgeList";

interface SearchResultsProps {
  query: string;
  results: KnowledgeDocumentItem[];
  onDelete: (id: string) => void;
  deleting?: string | null;
}

export function SearchResults({ query, results, onDelete, deleting }: SearchResultsProps) {
  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 text-xs text-neutral-500">
        <Search className="w-3.5 h-3.5" />
        <span>
          {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
          <span className="text-neutral-300 font-medium">"{query}"</span>
        </span>
      </div>
      <KnowledgeList documents={results} onDelete={onDelete} deleting={deleting} />
    </div>
  );
}
