import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mycelium OS — The constitutional layer for AI-native organisations",
  description:
    "Define your company of AI agents via code, config, or chat — then run, visualise, and govern it as a living ecosystem.",
  keywords: [
    "AI agents",
    "multi-agent",
    "AI governance",
    "constitutional AI",
    "open source",
    "mycelium",
  ],
  authors: [{ name: "Mycelium OS" }],
  openGraph: {
    title: "Mycelium OS",
    description:
      "The constitutional layer for AI-native organisations. Run, visualise, and govern your AI agents as a living ecosystem.",
    type: "website",
    url: "https://myceliumos.dev",
    siteName: "Mycelium OS",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mycelium OS",
    description:
      "The constitutional layer for AI-native organisations. Open source.",
  },
  metadataBase: new URL("https://myceliumos.dev"),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
