"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, Eye } from "lucide-react";
import type { ShroomSummary } from "@/lib/api";

type SortField = "id" | "status";
type SortDir = "asc" | "desc";

const STATUS_COLORS: Record<string, string> = {
  running: "bg-emerald-500/20 text-emerald-400",
  stopped: "bg-neutral-500/20 text-neutral-400",
  error: "bg-red-500/20 text-red-400",
};

interface ShroomTableProps {
  shrooms: ShroomSummary[];
  onViewManifest: (id: string) => void;
}

export function ShroomTable({ shrooms, onViewManifest }: ShroomTableProps) {
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField]
  );

  const sorted = useMemo(() => {
    const copy = [...shrooms];
    copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [shrooms, sortField, sortDir]);

  if (shrooms.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-neutral-500">
        No shrooms registered
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="inline w-3 h-3 ml-1" />
    ) : (
      <ChevronDown className="inline w-3 h-3 ml-1" />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left" data-testid="shroom-table">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-neutral-500">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 cursor-pointer select-none hover:text-neutral-300 transition-colors"
              onClick={() => handleSort("id")}
            >
              Shroom ID
              <SortIcon field="id" />
            </th>
            <th scope="col" className="px-4 py-3">
              Name
            </th>
            <th scope="col" className="px-4 py-3">
              Model
            </th>
            <th
              scope="col"
              className="px-4 py-3 cursor-pointer select-none hover:text-neutral-300 transition-colors"
              onClick={() => handleSort("status")}
            >
              Status
              <SortIcon field="status" />
            </th>
            <th scope="col" className="px-4 py-3">
              Escalates to
            </th>
            <th scope="col" className="px-4 py-3">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {sorted.map((s) => (
            <tr
              key={s.id}
              className="hover:bg-white/[0.03] transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs text-neutral-300">
                {s.id}
              </td>
              <td className="px-4 py-3 text-white">{s.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                {s.model}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_COLORS[s.status] ?? "bg-neutral-500/20 text-neutral-400"
                  }`}
                >
                  {s.status}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                {s.escalates_to ?? "—"}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onViewManifest(s.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/5 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]"
                >
                  <Eye className="w-3 h-3" />
                  View manifest
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
