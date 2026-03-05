import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Mycelium OS</h1>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/canvas">Open Visual Office →</Link>
      </p>
    </main>
  );
}
