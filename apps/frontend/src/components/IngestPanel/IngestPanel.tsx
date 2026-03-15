"use client";

import { useCallback, useRef, useState } from "react";
import { X, Upload, Link, AlignLeft } from "lucide-react";
import { ingestFile, ingestText, ingestUrl } from "@/lib/api";
import type { KnowledgeDocumentItem } from "@/lib/api";

type Tab = "text" | "file" | "url";

interface IngestPanelProps {
  onClose: () => void;
  onIngested: (doc: KnowledgeDocumentItem) => void;
  availableShrooms?: string[];
}

export function IngestPanel({ onClose, onIngested, availableShrooms = [] }: IngestPanelProps) {
  const [tab, setTab] = useState<Tab>("text");
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [accessScope, setAccessScope] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleShroom = useCallback((id: string) => {
    setAccessScope((prev) => {
      if (prev === null) return [id];
      if (prev.includes(id)) {
        const next = prev.filter((s) => s !== id);
        return next.length === 0 ? null : next;
      }
      return [...prev, id];
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      let doc: KnowledgeDocumentItem;
      if (tab === "text") {
        if (!textContent.trim()) throw new Error("Content is required");
        doc = await ingestText(title || "Untitled document", textContent, accessScope);
      } else if (tab === "file") {
        if (!selectedFile) throw new Error("Please select a file");
        doc = await ingestFile(selectedFile, title || undefined, accessScope);
      } else {
        if (!urlValue.trim()) throw new Error("URL is required");
        doc = await ingestUrl(urlValue, title || undefined, accessScope);
      }
      onIngested(doc);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ingestion failed");
    } finally {
      setLoading(false);
    }
  }, [tab, title, textContent, urlValue, selectedFile, accessScope, onIngested, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="relative z-10 h-full w-full max-w-md bg-[#0d0d14] border-l border-white/10 flex flex-col shadow-2xl"
        data-testid="ingest-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-sm font-semibold text-white">Ingest document</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {(["text", "file", "url"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                tab === t
                  ? "bg-indigo-600 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {t === "text" ? (
                <span className="flex items-center gap-1.5"><AlignLeft className="w-3 h-3" />Text</span>
              ) : t === "file" ? (
                <span className="flex items-center gap-1.5"><Upload className="w-3 h-3" />File</span>
              ) : (
                <span className="flex items-center gap-1.5"><Link className="w-3 h-3" />URL</span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              Title <span className="text-neutral-600">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Company Handbook 2026"
              className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Source-specific inputs */}
          {tab === "text" && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Content</label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={8}
                placeholder="Paste text or markdown here…"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          )}

          {tab === "file" && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                File <span className="text-neutral-600">(PDF or .md)</span>
              </label>
              <div
                className="border border-dashed border-white/20 rounded-md p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <p className="text-sm text-white">{selectedFile.name}</p>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-neutral-500 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">Click to choose a file</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.md,.txt"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {tab === "url" && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1">URL</label>
              <input
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://…"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Access scope */}
          {availableShrooms.length > 0 && (
            <div>
              <label className="block text-xs text-neutral-400 mb-2">
                Visible to{" "}
                <span className="text-neutral-600">
                  ({accessScope === null ? "all shrooms" : `${accessScope.length} selected`})
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAccessScope(null)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    accessScope === null
                      ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                      : "border-white/10 text-neutral-500 hover:border-white/20"
                  }`}
                >
                  All shrooms
                </button>
                {availableShrooms.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleShroom(id)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      accessScope?.includes(id)
                        ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                        : "border-white/10 text-neutral-500 hover:border-white/20"
                    }`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-md px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-md py-2.5 transition-colors"
          >
            {loading ? "Ingesting…" : "Ingest document"}
          </button>
        </div>
      </aside>
    </div>
  );
}
