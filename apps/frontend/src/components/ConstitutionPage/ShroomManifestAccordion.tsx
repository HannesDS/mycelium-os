"use client";

import { useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import type { ShroomManifestDetail } from "@/lib/api";

interface ShroomManifestAccordionProps {
  shrooms: { id: string; manifest: ShroomManifestDetail }[];
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
      <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <ul className="mt-1 space-y-1">
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

function AccordionItem({
  id,
  manifest,
}: {
  id: string;
  manifest: ShroomManifestDetail;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-indigo-400">{id}</span>
          <span className="text-sm text-white">{manifest.name}</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-neutral-400">
            {manifest.model}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Model" value={manifest.model} mono />
            <Field
              label="Escalates to"
              value={manifest.escalates_to ?? "—"}
              mono
            />
            <Field
              label="SLA"
              value={
                manifest.sla_response_minutes != null
                  ? `${manifest.sla_response_minutes} min`
                  : "—"
              }
            />
          </div>

          {manifest.skills.length > 0 && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Skills
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {manifest.skills.map((s) => (
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

          <PermissionList label="Can" items={manifest.can} />
          <PermissionList label="Cannot" items={manifest.cannot} />

          {manifest.mcps.length > 0 && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                MCPs
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {manifest.mcps.map((m) => (
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
      )}
    </div>
  );
}

export function ShroomManifestAccordion({
  shrooms,
}: ShroomManifestAccordionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-4">
        Shroom Manifests
      </h3>
      <div className="space-y-2">
        {shrooms.map((s) => (
          <AccordionItem key={s.id} id={s.id} manifest={s.manifest} />
        ))}
      </div>
    </div>
  );
}
