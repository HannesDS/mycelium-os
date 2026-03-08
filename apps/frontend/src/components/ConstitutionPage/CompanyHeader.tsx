"use client";

import { Shield } from "lucide-react";

const INSTANCE_COLORS: Record<string, string> = {
  production: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  staging: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  dev: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

interface CompanyHeaderProps {
  name: string;
  instance: string;
}

export function CompanyHeader({ name, instance }: CompanyHeaderProps) {
  const badgeClass =
    INSTANCE_COLORS[instance] ??
    "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600/20">
          <Shield className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{name}</h2>
          <p className="text-xs text-neutral-500">Organisation Constitution</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Instance
        </span>
        <span
          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
        >
          {instance}
        </span>
      </div>
    </div>
  );
}
