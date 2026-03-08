"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { fetchShrooms, fetchShroom } from "@/lib/api";
import type { ShroomSummary, ShroomDetail } from "@/lib/api";
import { ShroomTable } from "@/components/ShroomTable";
import { ManifestPanel } from "@/components/ManifestPanel";

export default function ShroomsPage() {
  const [shrooms, setShrooms] = useState<ShroomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ShroomDetail | null>(
    null
  );

  const loadShrooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchShrooms();
      setShrooms(data);
    } catch (e) {
      setShrooms([]);
      setError(e instanceof Error ? e.message : "Failed to load shrooms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShrooms();
  }, [loadShrooms]);

  const handleViewManifest = useCallback(async (id: string) => {
    setPanelOpen(true);
    setPanelLoading(true);
    setSelectedDetail(null);
    try {
      const detail = await fetchShroom(id);
      setSelectedDetail(detail);
    } catch {
      setSelectedDetail(null);
    } finally {
      setPanelLoading(false);
    }
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  return (
    <div className="h-full bg-[#0a0a0f]">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">Shrooms</h1>
            <p className="mt-1 text-sm text-neutral-400">
              {shrooms.length} registered shroom{shrooms.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={loadShrooms}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {loading && shrooms.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
            <p className="text-sm font-medium text-red-400">
              Failed to load shrooms
            </p>
            <p className="mt-1 text-xs text-neutral-500">{error}</p>
            <button
              type="button"
              onClick={loadShrooms}
              className="mt-4 rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.02]">
            <ShroomTable
              shrooms={shrooms}
              onViewManifest={handleViewManifest}
            />
          </div>
        )}
      </div>

      <ManifestPanel
        detail={selectedDetail}
        isOpen={panelOpen}
        isLoading={panelLoading}
        onClose={handleClosePanel}
      />
    </div>
  );
}
