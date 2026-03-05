import dynamic from "next/dynamic";

const OfficeCanvas = dynamic(
  () => import("@/components/OfficeCanvas/OfficeCanvas").then((m) => ({ default: m.OfficeCanvas })),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="h-screen w-full">
      <OfficeCanvas />
    </main>
  );
}
