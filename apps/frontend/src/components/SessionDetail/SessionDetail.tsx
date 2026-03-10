"use client";

import { X } from "lucide-react";
import type { SessionDetail as SessionDetailType } from "@/lib/api";

export interface SessionDetailProps {
  session: SessionDetailType | null;
  isLoading: boolean;
  onClose: () => void;
  isOpen: boolean;
}

export function SessionDetail({
  session,
  isLoading,
  onClose,
  isOpen,
}: SessionDetailProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close"
      />
      <div className="relative w-full max-w-2xl bg-[#0a0a0f] border-l border-white/10 shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Session Detail</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : session ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">Session ID</span>
                  <p className="font-mono text-xs text-neutral-300 mt-0.5 truncate">
                    {session.session_id}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500">Shroom</span>
                  <p className="text-neutral-300 mt-0.5">{session.shroom_id}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Started</span>
                  <p className="text-neutral-300 mt-0.5">
                    {session.started !== "-"
                      ? new Date(session.started).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500">Ended</span>
                  <p className="text-neutral-300 mt-0.5">
                    {session.ended
                      ? new Date(session.ended).toLocaleString()
                      : "-"}
                  </p>
                </div>
                {session.model && (
                  <div>
                    <span className="text-neutral-500">Model</span>
                    <p className="text-neutral-300 mt-0.5">{session.model}</p>
                  </div>
                )}
                {session.token_count != null && (
                  <div>
                    <span className="text-neutral-500">Token count</span>
                    <p className="text-neutral-300 mt-0.5">{session.token_count}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-400 mb-2">
                  Message History
                </h3>
                <div className="space-y-3">
                  {session.message_history.length === 0 ? (
                    <p className="text-sm text-neutral-500">No messages</p>
                  ) : (
                    session.message_history.map((msg, i) => (
                      <div
                        key={i}
                        className={`rounded-lg px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-white/5 border border-white/5"
                            : "bg-indigo-500/10 border border-indigo-500/20"
                        }`}
                      >
                        <span className="text-xs font-medium text-neutral-500 uppercase">
                          {msg.role}
                        </span>
                        <p className="mt-1 text-sm text-neutral-200 whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {session.related_events.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-2">
                    Related Audit Events
                  </h3>
                  <div className="space-y-2">
                    {session.related_events.map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-lg border border-white/5 px-4 py-2 text-sm"
                      >
                        <span className="text-neutral-500">{ev.action}</span>
                        <span className="text-neutral-400 mx-2">by</span>
                        <span className="text-neutral-300">{ev.actor}</span>
                        <span className="text-neutral-500 text-xs ml-2">
                          {new Date(ev.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Session not found</p>
          )}
        </div>
      </div>
    </div>
  );
}
