"use client";

import { useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import type { SessionListItem as SessionListItemType } from "@/lib/api";

const POLL_INTERVAL = 10_000;

export interface SessionListProps {
  status: "active" | "completed";
  sessions: SessionListItemType[];
  loading: boolean;
  error: string | null;
  onLoad: () => Promise<void>;
  onSelectSession: (sessionId: string) => void;
  autoRefresh?: boolean;
}

export function SessionList({
  status,
  sessions,
  loading,
  error,
  onLoad,
  onSelectSession,
  autoRefresh = false,
}: SessionListProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoRefresh && status === "active") {
      intervalRef.current = setInterval(onLoad, POLL_INTERVAL);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [autoRefresh, status, onLoad]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-300">
          {status === "active" ? "Active" : "Completed"} ({sessions.length})
        </h2>
        <button
          type="button"
          onClick={onLoad}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      {loading && sessions.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : error && sessions.length === 0 ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            type="button"
            onClick={onLoad}
            className="mt-3 text-xs text-red-400/80 hover:text-red-400"
          >
            Retry
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] px-6 py-8 text-center">
          <p className="text-sm text-neutral-500">
            No {status} sessions
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-neutral-400">
                <th className="px-4 py-3 font-medium">Session ID</th>
                <th className="px-4 py-3 font-medium">Shroom</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Messages</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr
                  key={s.session_id}
                  onClick={() => onSelectSession(s.session_id)}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-xs text-neutral-300 truncate max-w-[140px]">
                    {s.session_id}
                  </td>
                  <td className="px-4 py-3 text-neutral-300">{s.shroom_id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs ${
                        s.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-neutral-500/20 text-neutral-400"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">
                    {s.started !== "-"
                      ? new Date(s.started).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{s.duration}</td>
                  <td className="px-4 py-3 text-neutral-400">{s.message_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
