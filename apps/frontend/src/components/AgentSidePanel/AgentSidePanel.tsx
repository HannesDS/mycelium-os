"use client";

import type { AgentState } from "@/lib/mockEventLoop";

interface AgentSidePanelProps {
  agent: AgentState | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function AgentSidePanel({
  agent,
  isOpen,
  onClose,
}: AgentSidePanelProps) {
  if (!agent) return null;

  return (
    <>
      <div
        role="presentation"
        aria-hidden
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-label={`Agent details: ${agent.id}`}
        className="fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <header className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {agent.id.replace(/-/g, " ")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{agent.role}</p>
        </header>
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <section>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Status
            </h3>
            <span
              className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
                agent.status === "idle"
                  ? "bg-gray-100 text-gray-700"
                  : agent.status === "thinking"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {agent.status}
            </span>
          </section>
          <section>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Current task
            </h3>
            <p className="text-gray-700">{agent.currentTask}</p>
          </section>
          {agent.escalatesTo && (
            <section>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Reports to
              </h3>
              <p className="text-gray-700">
                {agent.escalatesTo.replace(/-/g, " ")}
              </p>
            </section>
          )}
          <section>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Last 3 events
            </h3>
            <ul className="space-y-3">
              {agent.lastEvents.map((evt, i) => (
                <li key={`${evt.timestamp}-${i}`} className="border-l-2 border-gray-200 pl-3">
                  <span className="text-xs text-gray-500 block">
                    {formatTimestamp(evt.timestamp)}
                  </span>
                  <span className="text-sm text-gray-700">
                    {evt.payload_summary}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </>
  );
}
