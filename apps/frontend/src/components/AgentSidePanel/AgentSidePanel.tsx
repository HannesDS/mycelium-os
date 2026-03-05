"use client";

import { useEffect, useRef, useCallback } from "react";
import { type AgentEvent, type AgentEventType, type AgentStatus } from "@/types/agent-event";
import { getInitials } from "@/lib/agents";

const EVENT_ICONS: Record<AgentEventType, string> = {
  message_sent: "✉",
  task_started: "▶",
  task_completed: "✓",
  escalation_raised: "↑",
  decision_received: "↓",
  idle: "○",
  error: "!",
};

function formatRelativeTime(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

interface AgentSidePanelProps {
  agentId: string;
  agentName: string;
  agentRole: string;
  status: AgentStatus;
  currentTask: string | null;
  recentEvents: AgentEvent[];
  onClose: () => void;
  isOpen: boolean;
}

export function AgentSidePanel({
  agentId,
  agentName,
  agentRole,
  status,
  currentTask,
  recentEvents,
  onClose,
  isOpen,
}: AgentSidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  const focusableSelectors =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const trapFocus = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(focusableSelectors);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    first.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    previousActiveRef.current = document.activeElement as HTMLElement | null;
    const cleanup = trapFocus();
    return () => {
      cleanup?.();
      previousActiveRef.current?.focus();
    };
  }, [isOpen, agentId, trapFocus]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
        ref={panelRef}
        role="dialog"
        aria-labelledby="agent-panel-title"
        aria-modal="true"
        className="fixed right-0 top-0 z-50 h-full w-80 max-w-[90vw] animate-slide-in bg-white shadow-xl"
        style={{ animationDuration: "200ms", animationTimingFunction: "ease" }}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700"
              aria-hidden
            >
              {getInitials(agentName)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="agent-panel-title" className="truncate font-semibold text-slate-900">
                {agentName} — {agentRole}
              </h2>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  status === "idle"
                    ? "bg-slate-100 text-slate-600"
                    : status === "working"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {status === "idle"
                  ? "idle"
                  : status === "working"
                    ? "working"
                    : "in conversation"}
              </span>
            </div>
          </div>

          {currentTask && (
            <div className="mb-4 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Current task
              </p>
              <p className="mt-1 text-sm text-slate-800">{currentTask}</p>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Recent activity
            </p>
            <ul className="space-y-2 overflow-y-auto" role="list">
              {recentEvents.length === 0 ? (
                <li className="text-sm text-slate-500">No recent activity</li>
              ) : (
                recentEvents.map((evt, i) => (
                  <li
                    key={`${evt.timestamp}-${i}`}
                    className="flex gap-2 text-sm"
                  >
                    <span
                      className="shrink-0 text-base"
                      aria-hidden
                      title={evt.event}
                    >
                      {EVENT_ICONS[evt.event] ?? "•"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-slate-800">
                        {evt.payload_summary}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatRelativeTime(evt.timestamp)}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
  );
}
