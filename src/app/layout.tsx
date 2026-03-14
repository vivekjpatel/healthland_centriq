import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LoadingProvider } from "@/components/ui/loading-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Healthland Centriq",
  description: "Care operations platform for patient intake and bed management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LoadingProvider>{children}</LoadingProvider>
      </body>
    </html>
  );
}
