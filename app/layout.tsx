import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lunar Landing Site Navigator",
  description:
    "Compare lunar south pole landing sites by hours of sunlight for power and hours of Earth visibility for comms.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The app is dark only. The "dark" class makes shadcn's dark: variants apply.
    <html lang="en" className="dark h-full antialiased">
      <head>
        {/* Fonts load from their CDN stylesheets only. Font files are never committed. */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=excon@400,500,700&display=swap"
        />
        {/* This lint rule is written for the old pages router. The root layout wraps every page, so the font loads everywhere. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
