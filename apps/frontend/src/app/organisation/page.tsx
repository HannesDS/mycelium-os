"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { fetchOrgGraph } from "@/lib/api";
import type { OrgGraphResponse } from "@/lib/api";

export default function OrganisationPage() {
  const [data, setData] = useState<OrgGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOrgGraph();
      setData(result);
    } catch (e) {
      setData(null);
      setError(
        e instanceof Error ? e.message : "Failed to load organisation graph",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="h-full bg-[#0a0a0f]">
      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">Organisation</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Org graph — shroom topology
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
            <span>Refresh</span>
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
              Failed to load organisation graph
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
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
            <div className="flex flex-wrap gap-4">
              {data.graph.nodes.map((node) => (
                <div
                  key={node.id}
                  className="min-w-[180px] rounded-lg border border-white/10 bg-black/40 px-4 py-3"
                >
                  <div className="text-sm font-semibold text-white">
                    {node.name}
                  </div>
                  <div className="text-xs text-neutral-400">{node.id}</div>
                  <div className="mt-2 text-xs text-neutral-400">
                    Model: <span className="text-neutral-200">{node.model}</span>
                  </div>
                  {node.escalates_to && (
                    <div className="mt-1 text-xs text-neutral-400">
                      Escalates to:{" "}
                      <span className="text-neutral-200">
                        {node.escalates_to}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white mb-2">
                Edges
              </h2>
              <ul className="space-y-1 text-xs text-neutral-300">
                {data.graph.edges.map((edge, idx) => (
                  <li key={`${edge.from}-${edge.to}-${idx}`}>
                    <span className="text-neutral-400">{edge.from}</span>
                    <span className="mx-1 text-neutral-500">
                      {edge.type}
                    </span>
                    <span className="text-neutral-400">{edge.to}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

