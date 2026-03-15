"use client";

import { Download, Trash2, FileText, Link, AlignLeft } from "lucide-react";
import type { KnowledgeDocumentItem } from "@/lib/api";
import { getKnowledgeDownloadUrl } from "@/lib/api";

const SOURCE_ICON = {
  text: AlignLeft,
  file: FileText,
  url: Link,
} as const;

const CONTENT_TYPE_LABEL: Record<string, string> = {
  pdf: "PDF",
  markdown: "Markdown",
  text: "Text",
  url: "URL",
};

interface KnowledgeListProps {
  documents: KnowledgeDocumentItem[];
  onDelete: (id: string) => void;
  deleting?: string | null;
}

export function KnowledgeList({ documents, onDelete, deleting }: KnowledgeListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-500 text-sm">
        No documents yet. Use &ldquo;Ingest&rdquo; to add your first document.
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {documents.map((doc) => {
        const Icon = SOURCE_ICON[doc.source_type] ?? FileText;
        const accessLabel =
          doc.access_scope == null || doc.access_scope.length === 0
            ? "All shrooms"
            : doc.access_scope.join(", ");
        const isDeleting = deleting === doc.id;

        return (
          <div
            key={doc.id}
            className="flex items-start gap-4 px-4 py-4 hover:bg-white/[0.02] group"
          >
            <div className="mt-0.5 shrink-0 text-neutral-500">
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-white truncate">
                  {doc.title}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-neutral-400 shrink-0">
                  {CONTENT_TYPE_LABEL[doc.content_type] ?? doc.content_type}
                </span>
              </div>

              {doc.content_preview && (
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                  {doc.content_preview}
                </p>
              )}

              <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-600 flex-wrap">
                <span>{new Date(doc.ingested_at).toLocaleDateString()}</span>
                {doc.original_filename && (
                  <span className="truncate max-w-[160px]">{doc.original_filename}</span>
                )}
                {doc.source_url && (
                  <span className="truncate max-w-[200px]">{doc.source_url}</span>
                )}
                <span className="text-indigo-400/70">Visible to: {accessLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={getKnowledgeDownloadUrl(doc.id)}
                download
                className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => onDelete(doc.id)}
                className="p-1.5 rounded text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
