"use client";

import dynamic from "next/dynamic";

const ZenikOfficeCanvas = dynamic(
  () => import("@/components/zenik-office/zenik-office-canvas").then((m) => m.ZenikOfficeCanvas),
  { ssr: false }
);

export default function Home() {
  return <ZenikOfficeCanvas />;
}
