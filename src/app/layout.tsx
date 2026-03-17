import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Aref_Ruqaa, Amiri } from "next/font/google";
import { DEFAULT_THEME_COLOR } from "@/lib/constants/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const arefRuqaa = Aref_Ruqaa({
  weight: ['700'],
  subsets: ["arabic"],
  variable: "--font-aref-ruqaa",
});

const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ["arabic"],
  variable: "--font-amiri",
});

export const metadata: Metadata = {
  title: "Raj3",
  description: "Review Quran more efficiently with spaced repetition",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Raj3",
  },
};

export const viewport: Viewport = {
  themeColor: DEFAULT_THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${arefRuqaa.variable} ${amiri.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
