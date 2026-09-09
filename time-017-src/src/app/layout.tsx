import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TIME 017 — Rooted in the Quiet",
  description:
    "A playable, living meditation experience. Growth does not happen by moving faster. Growth happens by becoming still. Find the ancient tree and enter the deep silence.",
  keywords: ["Time 017", "Rooted in the Quiet", "Meditation", "Playable experience", "WebGL", "Interactive Art"],
  authors: [{ name: "Antigravity AI" }],
  openGraph: {
    title: "TIME 017 — Rooted in the Quiet",
    description: "A playable, living meditation. Growth happens by becoming still.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full h-full">
      <body className="w-full h-full bg-[#060605] overflow-hidden antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
