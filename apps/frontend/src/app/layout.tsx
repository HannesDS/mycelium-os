import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mycelium OS — Visual Office",
  description: "A constitutional framework for AI-native organisations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
