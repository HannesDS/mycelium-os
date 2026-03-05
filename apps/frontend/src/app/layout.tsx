import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mycelium OS — Visual Office",
  description: "Real-time visual office for AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
