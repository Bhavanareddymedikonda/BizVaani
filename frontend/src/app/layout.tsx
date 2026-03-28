import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BizVaani — Your AI Business Coach",
  description: "Voice-first AI business intelligence for kirana stores. Ask questions in Hindi, English, or Telugu and get answers in seconds.",
};

export const viewport: Viewport = {
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme="dark"
      data-accent="orange"
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col md:pl-24">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
