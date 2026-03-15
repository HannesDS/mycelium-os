"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1f1f1f]"
          : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <MycelliumIcon />
          <span className="text-sm font-semibold text-[#ededed] tracking-tight">
            mycelium<span className="text-[#4ade80]">os</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="#how-it-works"
            className="text-sm text-[#888888] hover:text-[#ededed] transition-colors animated-underline"
          >
            How it works
          </Link>
          <Link
            href="#stack"
            className="text-sm text-[#888888] hover:text-[#ededed] transition-colors animated-underline"
          >
            Stack
          </Link>
          <Link
            href="https://github.com/HannesDS/mycelium-os"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-[#888888] hover:text-[#ededed] transition-colors"
          >
            <GitHubIcon />
            GitHub
          </Link>
          <Link
            href="#get-started"
            className="text-sm px-3 py-1.5 bg-[#4ade80] text-[#0a0a0a] font-medium rounded-md hover:bg-[#22c55e] transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function MycelliumIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10" cy="10" r="2" fill="#4ade80" />
      <circle cx="4" cy="4" r="1.5" fill="#4ade80" opacity="0.7" />
      <circle cx="16" cy="4" r="1.5" fill="#4ade80" opacity="0.7" />
      <circle cx="4" cy="16" r="1.5" fill="#4ade80" opacity="0.7" />
      <circle cx="16" cy="16" r="1.5" fill="#4ade80" opacity="0.7" />
      <line
        x1="10"
        y1="8"
        x2="5"
        y2="5"
        stroke="#4ade80"
        strokeWidth="0.75"
        opacity="0.5"
      />
      <line
        x1="10"
        y1="8"
        x2="15"
        y2="5"
        stroke="#4ade80"
        strokeWidth="0.75"
        opacity="0.5"
      />
      <line
        x1="10"
        y1="12"
        x2="5"
        y2="15"
        stroke="#4ade80"
        strokeWidth="0.75"
        opacity="0.5"
      />
      <line
        x1="10"
        y1="12"
        x2="15"
        y2="15"
        stroke="#4ade80"
        strokeWidth="0.75"
        opacity="0.5"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
