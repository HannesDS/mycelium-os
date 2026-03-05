import dynamic from "next/dynamic";

const VisualOfficeCanvas = dynamic(
  () =>
    import("@/components/VisualOfficeCanvas/VisualOfficeCanvas").then(
      (m) => m.VisualOfficeCanvas
    ),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <VisualOfficeCanvas />
    </main>
  );
}
