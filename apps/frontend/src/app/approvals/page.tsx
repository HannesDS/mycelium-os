"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, Inbox, CheckCircle2 } from "lucide-react";
import {
  fetchApprovals,
  approveProposal,
  rejectProposal,
  ConflictError,
} from "@/lib/api";
import type { ApprovalItem } from "@/lib/api";
import { ProposalCard } from "@/components/ProposalCard";

const POLL_INTERVAL = 10_000;

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchApprovals();
      setApprovals(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  const notifyBadgeRefresh = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("approvals-updated"));
    }
  }, []);

  const handleApprove = useCallback(
    async (id: string) => {
      try {
        await approveProposal(id);
      } catch (e) {
        if (e instanceof ConflictError) {
          throw e;
        }
        throw e;
      }
      await load();
      notifyBadgeRefresh();
    },
    [load, notifyBadgeRefresh],
  );

  const handleReject = useCallback(
    async (id: string) => {
      try {
        await rejectProposal(id);
      } catch (e) {
        if (e instanceof ConflictError) {
          throw e;
        }
        throw e;
      }
      await load();
      notifyBadgeRefresh();
    },
    [load, notifyBadgeRefresh],
  );

  const pending = approvals.filter((a) => a.status === "pending");
  const resolved = approvals.filter((a) => a.status !== "pending");

  return (
    <div className="h-full bg-[#0a0a0f]">
      <div className="mx-auto max-w-3xl px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">Approvals</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Human-in-the-loop decision inbox
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

        {loading && approvals.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-lg bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : error && approvals.length === 0 ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
            <p className="text-sm font-medium text-red-400">
              Failed to load approvals
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
        ) : (
          <>
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Inbox className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-medium text-neutral-300">
                  Pending ({pending.length})
                </h2>
              </div>
              {pending.length === 0 ? (
                <div className="rounded-lg border border-white/5 bg-white/[0.02] px-6 py-8 text-center">
                  <p className="text-sm text-neutral-500">
                    No pending proposals
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map((a) => (
                    <ProposalCard
                      key={a.id}
                      approval={a}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </section>

            {resolved.length > 0 && (
              <section className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-neutral-500" />
                  <h2 className="text-sm font-medium text-neutral-300">
                    Resolved ({resolved.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {resolved.map((a) => (
                    <ProposalCard
                      key={a.id}
                      approval={a}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
