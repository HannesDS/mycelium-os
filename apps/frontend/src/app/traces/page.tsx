"use client";

import { useEffect, useState, useCallback } from "react";
import { List, RefreshCw, ArrowRight } from "lucide-react";
import { getEvents, fetchShrooms } from "@/lib/api";
import type { ShroomEventItem } from "@/lib/api";

export default function TracesPage() {
  const [events, setEvents] = useState<ShroomEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shroomId, setShroomId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [since, setSince] = useState<string>("");
  const [limit, setLimit] = useState(100);
  const [shrooms, setShrooms] = useState<{ id: string; name: string }[]>([]);

  const apiKey = process.env.NEXT_PUBLIC_DEV_API_KEY;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvents(
        {
          shroom_id: shroomId || undefined,
          session_id: sessionId || undefined,
          topic: topic || undefined,
          since: since || undefined,
          limit,
        },
        apiKey
      );
      setEvents(data);
    } catch (e) {
      setEvents([]);
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [shroomId, sessionId, topic, since, limit, apiKey]);

  useEffect(() => {
    fetchShrooms()
      .then((list) => setShrooms(list.map((s) => ({ id: s.id, name: s.name }))))
      .catch(() => setShrooms([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const interShroom = events.filter((e) => e.to != null);

  const EventRow = ({ e }: { e: ShroomEventItem }) => (
    <tr className="border-b border-white/5 hover:bg-white/5">
      <td className="py-4 px-4 text-sm text-neutral-400">
        {new Date(e.timestamp).toLocaleString()}
      </td>
      <td className="py-4 px-4 text-sm font-medium text-emerald-400">
        {e.shroom_id}
      </td>
      <td className="py-4 px-4 text-sm text-neutral-400">
        {e.to ? (
          <span className="flex items-center gap-1 text-amber-400">
            <ArrowRight className="w-3 h-3" />
            {e.to}
          </span>
        ) : (
          "-"
        )}
      </td>
      <td className="py-4 px-4 text-sm text-neutral-300">{e.event}</td>
      <td className="py-4 px-4 text-sm text-neutral-400 max-w-xs truncate">
        {e.payload_summary}
      </td>
      <td className="py-4 px-4 text-sm text-neutral-500">
        {e.token_count != null ? `${e.token_count}` : "-"}
      </td>
      <td className="py-4 px-4 text-sm text-neutral-500">
        {e.cost_usd != null ? `$${e.cost_usd.toFixed(6)}` : "-"}
      </td>
      <td className="py-4 px-4 text-sm text-neutral-500">
        {e.model ?? "-"}
      </td>
    </tr>
  );

  return (
    <div className="h-full bg-[#0a0a0f]">
      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <List className="w-5 h-5 text-emerald-400" />
              Traces
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Event traces and inter-shroom communications
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white/5 text-neutral-400 border border-white/5 hover:text-white hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Shroom</label>
            <select
              value={shroomId}
              onChange={(ev) => setShroomId(ev.target.value)}
              className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white"
            >
              <option value="">All</option>
              {shrooms.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">
              Session ID
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(ev) => setSessionId(ev.target.value)}
              placeholder="Filter by session"
              className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white w-48"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(ev) => setTopic(ev.target.value)}
              placeholder="Filter by topic"
              className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white w-48"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Since</label>
            <input
              type="text"
              value={since}
              onChange={(ev) => setSince(ev.target.value)}
              placeholder="ISO-8601"
              className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white w-48"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Limit</label>
            <select
              value={limit}
              onChange={(ev) => setLimit(Number(ev.target.value))}
              className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-md bg-red-500/10 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-neutral-400 py-12 text-center">Loading...</div>
        ) : (
          <>
            {interShroom.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-amber-400 mb-3 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Inter-shroom communications ({interShroom.length})
                </h2>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-neutral-500 border-b border-white/5">
                        <th className="py-3 px-4">Time</th>
                        <th className="py-3 px-4">From</th>
                        <th className="py-3 px-4">To</th>
                        <th className="py-3 px-4">Event</th>
                        <th className="py-3 px-4">Summary</th>
                        <th className="py-3 px-4">Tokens</th>
                        <th className="py-3 px-4">Cost</th>
                        <th className="py-3 px-4">Model</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interShroom.map((e, i) => (
                        <EventRow key={`inter-${i}-${e.timestamp}`} e={e} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <h2 className="text-lg font-medium text-white mb-3">All events</h2>
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-neutral-500 border-b border-white/5">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Shroom</th>
                    <th className="py-3 px-4">To</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Summary</th>
                    <th className="py-3 px-4">Tokens</th>
                    <th className="py-3 px-4">Cost</th>
                    <th className="py-3 px-4">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-neutral-500"
                      >
                        No events found
                      </td>
                    </tr>
                  ) : (
                    events.map((e, i) => (
                      <EventRow key={`${i}-${e.timestamp}`} e={e} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
