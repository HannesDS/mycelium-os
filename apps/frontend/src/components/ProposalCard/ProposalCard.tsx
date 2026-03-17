"use client";

import { useState } from "react";
import { Check, X, ChevronDown, ChevronUp, Clock, AlertCircle } from "lucide-react";
import type { ApprovalItem } from "@/lib/api";

const STATUS_STYLES: Record<ApprovalItem["status"], string> = {
  pending: "bg-amber-500/20 text-amber-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
};

const SHROOM_COLORS: Record<string, string> = {
  "sales-shroom": "text-blue-400",
  "billing-shroom": "text-purple-400",
  "compliance-shroom": "text-teal-400",
  "delivery-shroom": "text-orange-400",
  "root-shroom": "text-yellow-400",
};

interface ProposalCardProps {
  approval: ApprovalItem;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export function ProposalCard({ approval, onApprove, onReject }: ProposalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPending = approval.status === "pending";
  const shroomColor = SHROOM_COLORS[approval.shroom_id] ?? "text-indigo-400";

  const handleAction = async (action: "approve" | "reject") => {
    setActing(true);
    setError(null);
    try {
      if (action === "approve") {
        await onApprove(approval.id);
      } else {
        await onReject(approval.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(false);
    }
  };

  const timeAgo = formatTimeAgo(approval.created_at);

  return (
    <div
      className={`rounded-lg border bg-white/[0.02] transition-colors ${
        approval.status === "approved"
          ? "border-emerald-500/30"
          : approval.status === "rejected"
            ? "border-red-500/30"
            : "border-white/10 hover:border-white/20"
      }`}
      data-testid="proposal-card"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-mono text-xs font-medium ${shroomColor}`}>
                {approval.shroom_id}
              </span>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  STATUS_STYLES[approval.status]
                }`}
              >
                {approval.status}
              </span>
            </div>
            <p className="text-sm text-white font-medium leading-snug">
              {approval.summary}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
              <span className="font-mono">{approval.event_type}</span>
            </div>
          </div>

          {isPending && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleAction("approve")}
                disabled={acting}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-3.5 h-3.5" />
                Approve
              </button>
              <button
                type="button"
                onClick={() => handleAction("reject")}
                disabled={acting}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          )}

          {!isPending && approval.resolved_at && (
            <span className="text-xs text-neutral-500 shrink-0">
              {formatTimeAgo(approval.resolved_at)}
            </span>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {approval.payload && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {expanded ? "Hide details" : "View details"}
          </button>
        )}

        {expanded && approval.payload && (
          <pre className="mt-2 rounded-md bg-black/30 border border-white/5 p-3 text-xs text-neutral-400 overflow-x-auto">
            {JSON.stringify(approval.payload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
