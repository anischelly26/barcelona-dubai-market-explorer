import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barcelona & Dubai Market Explorer · Anis Chelli",
  description:
    "A cross-market property intelligence dashboard for normalized listings, geospatial signals, and comparative analytics.",
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
