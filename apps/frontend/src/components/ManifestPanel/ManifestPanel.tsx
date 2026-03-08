"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import type { ShroomDetail } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  running: "bg-emerald-500/20 text-emerald-400",
  stopped: "bg-neutral-500/20 text-neutral-400",
  error: "bg-red-500/20 text-red-400",
};

interface ManifestPanelProps {
  detail: ShroomDetail | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
}

function PermissionList({
  label,
  items,
}: {
  label: string;
  items: Record<string, string[]>[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-medium uppercase tracking-wider text-neutral-500 mb-1">
        {label}
      </h4>
      <ul className="space-y-1">
        {items.map((entry, i) => {
          const [action, resources] = Object.entries(entry)[0];
          return (
            <li key={`${action}-${i}`} className="text-sm text-neutral-300">
              <span className="font-medium text-white">{action}</span>:{" "}
              {resources.join(", ")}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ManifestPanel({
  detail,
  isOpen,
  isLoading,
  onClose,
}: ManifestPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-labelledby="manifest-panel-title"
      aria-modal="true"
      className="fixed right-0 top-0 z-50 h-full w-96 max-w-[90vw] animate-slide-in border-l border-white/10 bg-[#0a0a0f] shadow-2xl"
      style={{ animationDuration: "200ms", animationTimingFunction: "ease" }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2
            id="manifest-panel-title"
            className="text-sm font-semibold text-white"
          >
            Shroom Manifest
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="text-sm text-neutral-500">Loading manifest...</div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 rounded bg-white/5 animate-pulse"
                  style={{ width: `${60 + Math.random() * 40}%` }}
                />
              ))}
            </div>
          ) : detail ? (
            <div className="space-y-5">
              <Field label="ID" value={detail.id} mono />
              <Field label="Name" value={detail.name} />
              <Field label="Model" value={detail.model} mono />
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Status
                </span>
                <div className="mt-1">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[detail.status] ??
                      "bg-neutral-500/20 text-neutral-400"
                    }`}
                  >
                    {detail.status}
                  </span>
                </div>
              </div>
              <Field
                label="Escalates to"
                value={detail.escalates_to ?? "—"}
                mono
              />
              <Field
                label="SLA"
                value={
                  detail.sla_response_minutes != null
                    ? `${detail.sla_response_minutes} min`
                    : "—"
                }
              />
              {detail.skills.length > 0 && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Skills
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {detail.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-indigo-600/20 px-2 py-0.5 text-xs text-indigo-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <PermissionList label="Can" items={detail.can} />
              <PermissionList label="Cannot" items={detail.cannot} />
              {detail.mcps.length > 0 && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    MCPs
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {detail.mcps.map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-neutral-300"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <p
        className={`mt-0.5 text-sm text-neutral-200 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
