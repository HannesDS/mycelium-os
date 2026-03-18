"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { X } from "lucide-react";
import type { ShroomDetail } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  running: "bg-emerald-500/20 text-emerald-400",
  stopped: "bg-neutral-500/20 text-neutral-400",
  error: "bg-red-500/20 text-red-400",
};

type Tab = "overview" | "skills";

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

function TagList({
  label,
  items,
  colorClass,
}: {
  label: string;
  items: string[];
  colorClass: string;
}) {
  if (items.length === 0) {
    return (
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wider text-neutral-500 mb-1">
          {label}
        </h4>
        <p className="text-sm text-neutral-500">None configured</p>
      </div>
    );
  }
  return (
    <div>
      <h4 className="text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2">
        {label}
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className={`rounded-full px-2 py-0.5 text-xs ${colorClass}`}>
            {item}
          </span>
        ))}
      </div>
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
  const [activeTab, setActiveTab] = useState<Tab>("overview");

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

  // Reset tab when panel opens
  useEffect(() => {
    if (isOpen) setActiveTab("overview");
  }, [isOpen, detail?.id]);

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

        {!isLoading && detail && (
          <div role="tablist" className="flex border-b border-white/10 px-5">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              className={`py-2 mr-4 text-sm font-medium border-b-2 transition-colors focus:outline-none ${
                activeTab === "overview"
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "skills"}
              onClick={() => setActiveTab("skills")}
              className={`py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none ${
                activeTab === "skills"
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              Skills & MCPs
              {(detail.skills.length > 0 || detail.mcps.length > 0) && (
                <span className="ml-1.5 rounded-full bg-indigo-600/30 px-1.5 py-0.5 text-xs text-indigo-300">
                  {detail.skills.length + detail.mcps.length}
                </span>
              )}
            </button>
          </div>
        )}

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
            activeTab === "overview" ? (
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
                <PermissionList label="Can" items={detail.can} />
                <PermissionList label="Cannot" items={detail.cannot} />
              </div>
            ) : (
              <div className="space-y-6">
                <TagList
                  label="Skills"
                  items={detail.skills}
                  colorClass="bg-indigo-600/20 text-indigo-400"
                />
                <TagList
                  label="MCPs"
                  items={detail.mcps}
                  colorClass="bg-white/5 text-neutral-300"
                />
              </div>
            )
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
