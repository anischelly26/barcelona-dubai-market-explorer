import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barcelona & Dubai Market Explorer | Anis Chelli",
  description:
    "A full-stack property intelligence platform with permitted ingestion, PostGIS, FastAPI, interactive maps, normalized pricing and ROI analytics.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
