"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { fetchConstitution } from "@/lib/api";
import type { ConstitutionData } from "@/lib/api";
import {
  CompanyHeader,
  GraphEdgesList,
  ShroomManifestAccordion,
} from "@/components/ConstitutionPage";

export default function ConstitutionPage() {
  const [data, setData] = useState<ConstitutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchConstitution();
      setData(result);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load constitution");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="h-full bg-[#0a0a0f]">
      <div className="mx-auto max-w-4xl px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">Constitution</h1>
            <p className="mt-1 text-sm text-neutral-400">
              The source of truth — mycelium.yaml
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {loading && !data ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
            <p className="text-sm font-medium text-red-400">
              Failed to load constitution
            </p>
            <p className="mt-1 text-xs text-neutral-500">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : data ? (
          <div className="space-y-6">
            <CompanyHeader
              name={data.company.name}
              instance={data.company.instance}
            />
            <GraphEdgesList edges={data.graph.edges} />
            <ShroomManifestAccordion shrooms={data.shrooms} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
