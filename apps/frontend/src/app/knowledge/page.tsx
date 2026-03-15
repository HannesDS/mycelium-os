"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Plus, Search, X } from "lucide-react";
import {
  fetchKnowledge,
  fetchShrooms,
  deleteKnowledgeDocument,
} from "@/lib/api";
import type { KnowledgeDocumentItem } from "@/lib/api";
import { KnowledgeList } from "@/components/KnowledgeList";
import { SearchResults } from "@/components/SearchResults";
import { IngestPanel } from "@/components/IngestPanel";

const SEARCH_DEBOUNCE_MS = 400;

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDocumentItem[]>([]);
  const [searchResults, setSearchResults] = useState<KnowledgeDocumentItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIngest, setShowIngest] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [shroomIds, setShroomIds] = useState<string[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDocs = useCallback(async () => {
    try {
      const data = await fetchKnowledge();
      setDocuments(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
    fetchShrooms()
      .then((shrooms) => setShroomIds(shrooms.map((s) => s.id)))
      .catch(() => {});
  }, [loadDocs]);

  // Search with debounce
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await fetchKnowledge(query);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query]);

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(id);
    try {
      await deleteKnowledgeDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setSearchResults((prev) => prev?.filter((d) => d.id !== id) ?? null);
    } catch {
      // silent — leave the item in place
    } finally {
      setDeleting(null);
    }
  }, []);

  const handleIngested = useCallback((doc: KnowledgeDocumentItem) => {
    setDocuments((prev) => [doc, ...prev]);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <div>
              <h1 className="text-base font-semibold">Knowledge</h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Shared document store — shrooms query this for context
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowIngest(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ingest
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Semantic search across documents…"
            className="w-full bg-white/5 border border-white/10 rounded-md pl-9 pr-9 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-neutral-500 text-sm">
            Loading…
          </div>
        ) : error ? (
          <div className="m-6 text-sm text-red-400 bg-red-500/10 rounded-md px-4 py-3">{error}</div>
        ) : searchResults !== null ? (
          <SearchResults
            query={query}
            results={searchResults}
            onDelete={handleDelete}
            deleting={deleting}
          />
        ) : (
          <KnowledgeList
            documents={documents}
            onDelete={handleDelete}
            deleting={deleting}
          />
        )}
      </div>

      {/* Ingest slide-out */}
      {showIngest && (
        <IngestPanel
          onClose={() => setShowIngest(false)}
          onIngested={handleIngested}
          availableShrooms={shroomIds}
        />
      )}
    </div>
  );
}
