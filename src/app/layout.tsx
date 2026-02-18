import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "SkySwift — AI Travel Management for Indian Corporates",
    template: "%s | SkySwift",
  },
  description:
    "Corporate travel booking via WhatsApp in 30 seconds. Policy enforcement, GST compliance, and manager approvals — all automated.",
  keywords: [
    "corporate travel management",
    "India",
    "WhatsApp booking",
    "travel policy",
    "GST compliance",
    "business travel",
    "flight booking",
  ],
  authors: [{ name: "SkySwift" }],
  openGraph: {
    type: "website",
    title: "SkySwift — AI Travel Management for Indian Corporates",
    description:
      "47 clicks → 1 WhatsApp message. AI-powered corporate travel booking with policy enforcement and GST compliance.",
    siteName: "SkySwift",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkySwift — AI Travel Management for Indian Corporates",
    description:
      "Corporate travel booking via WhatsApp in 30 seconds. Policy enforcement, GST compliance, manager approvals.",
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
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
