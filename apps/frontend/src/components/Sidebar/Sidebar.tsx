"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { fetchPendingApprovalCount } from "@/lib/api";
import { NAV_ITEMS } from "./nav-items";

const BREAKPOINT = 1024;
const POLL_INTERVAL_MS = 30_000;

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const poll = () => {
      fetchPendingApprovalCount()
        .then(setPendingCount)
        .catch(() => setPendingCount(0));
    };
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    const onUpdate = () => poll();
    window.addEventListener("approvals-updated", onUpdate);
    return () => {
      clearInterval(id);
      window.removeEventListener("approvals-updated", onUpdate);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINT - 1}px)`);
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setCollapsed(e.matches);
    };
    onChange(mq);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside
      data-testid="sidebar"
      className={`flex flex-col h-screen border-r border-white/10 bg-[#0a0a0f] transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center gap-2 px-4 h-14 border-b border-white/10 shrink-0 overflow-hidden">
        <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          M
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-white whitespace-nowrap">
            Mycelium OS
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            if (!item.enabled) {
              return (
                <li key={item.href}>
                  <span
                    data-testid={`nav-item-${item.label.toLowerCase()}`}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-not-allowed opacity-40 ${
                      collapsed ? "justify-center" : ""
                    }`}
                    title={`${item.label} — coming soon`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </span>
                </li>
              );
            }

            const badge =
              item.href === "/approvals" && pendingCount > 0 ? (
                <span
                  className="ml-auto min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500/90 text-black text-xs font-semibold flex items-center justify-center"
                  aria-label={`${pendingCount} pending approval${pendingCount !== 1 ? "s" : ""}`}
                >
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              ) : null;

            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  data-testid={`nav-item-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="relative">
                    <Icon className="w-4 h-4 shrink-0" />
                    {collapsed && pendingCount > 0 && item.href === "/approvals" && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#0a0a0f]"
                        aria-label={`${pendingCount} pending`}
                      />
                    )}
                  </span>
                  {!collapsed && (
                    <>
                      <span>{item.label}</span>
                      {badge}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-2 py-2 shrink-0">
        <button
          type="button"
          onClick={toggle}
          data-testid="sidebar-toggle"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-400 hover:bg-white/5 hover:text-white transition-colors w-full ${
            collapsed ? "justify-center" : ""
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
