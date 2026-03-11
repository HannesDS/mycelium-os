"use client";

import { useEffect, useState, useCallback } from "react";
import { Wrench, RefreshCw } from "lucide-react";
import { fetchSkills } from "@/lib/api";
import type { SkillItem } from "@/lib/api";

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSkills();
      setSkills(data.skills);
    } catch (e) {
      setSkills([]);
      setError(e instanceof Error ? e.message : "Failed to load skills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="h-full bg-[#0a0a0f]">
      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-400" />
              Skills Catalog
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Available skills and which shrooms have access
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

        {error && (
          <div className="mb-4 p-4 rounded-md bg-red-500/10 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-neutral-400 py-12 text-center">Loading...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <h3 className="font-medium text-white">{skill.name}</h3>
                <p className="mt-1 text-sm text-neutral-400">
                  {skill.description || skill.id}
                </p>
                <div className="mt-3">
                  <span className="text-xs text-neutral-500">Shrooms:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {skill.shrooms.length === 0 ? (
                      <span className="text-sm text-neutral-500">None</span>
                    ) : (
                      skill.shrooms.map((s) => (
                        <span
                          key={s}
                          className="inline-flex rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400"
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
