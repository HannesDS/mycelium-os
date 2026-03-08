"use client";

import type { ShroomSummary } from "@/lib/api";

const STATUS_DOT: Partial<Record<ShroomSummary["status"], string>> = {
  running: "bg-emerald-400",
  stopped: "bg-neutral-500",
  error: "bg-red-400",
};

interface ShroomSelectorProps {
  shrooms: ShroomSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ShroomSelector({
  shrooms,
  selectedId,
  onSelect,
}: ShroomSelectorProps) {
  return (
    <aside
      data-testid="shroom-selector"
      className="w-64 shrink-0 border-r border-white/10 bg-[#0a0a0f] flex flex-col h-full"
    >
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Shrooms
        </h2>
      </div>
      <ul className="flex-1 overflow-y-auto py-1">
        {shrooms.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              data-testid={`shroom-option-${s.id}`}
              onClick={() => onSelect(s.id)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${
                selectedId === s.id
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  STATUS_DOT[s.status] ?? "bg-neutral-500"
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-neutral-500 truncate">{s.id}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
