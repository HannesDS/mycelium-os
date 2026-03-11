"use client";

import { useEffect, useState, useCallback } from "react";
import { Play } from "lucide-react";
import { fetchSessions, fetchSession } from "@/lib/api";
import type { SessionListItem, SessionDetail } from "@/lib/api";
import { SessionList } from "@/components/SessionList/SessionList";
import { SessionDetail as SessionDetailComponent } from "@/components/SessionDetail/SessionDetail";

type Tab = "active" | "completed";


export default function SessionsPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSessions(tab);
      setSessions(data.sessions);
    } catch (e) {
      setSessions([]);
      setError(e instanceof Error ? e.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelectSession = useCallback(async (sessionId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedSession(null);
    try {
      const detail = await fetchSession(sessionId);
      setSelectedSession(detail);
    } catch {
      setSelectedSession(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  return (
    <div className="h-full bg-[#0a0a0f]">
      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400" />
              Sessions
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Active and completed shroom sessions
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "active"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-white/5 text-neutral-400 border border-white/5 hover:text-white"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setTab("completed")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "completed"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-white/5 text-neutral-400 border border-white/5 hover:text-white"
            }`}
          >
            Completed
          </button>
        </div>

        <SessionList
          status={tab}
          sessions={sessions}
          loading={loading}
          error={error}
          onLoad={load}
          onSelectSession={handleSelectSession}
          autoRefresh={tab === "active"}
        />
      </div>

      <SessionDetailComponent
        session={selectedSession}
        isLoading={detailLoading}
        onClose={handleCloseDetail}
        isOpen={detailOpen}
      />
    </div>
  );
}
