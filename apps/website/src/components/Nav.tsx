"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GitHubIcon, MycelliumIcon } from "./icons";

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
            <GitHubIcon size={14} />
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

