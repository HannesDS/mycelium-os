"use client";

import dynamic from "next/dynamic";

const VisualOffice = dynamic(() => import("@/components/VisualOffice"), {
  ssr: false,
});

export default function Home() {
  return <VisualOffice />;
}
