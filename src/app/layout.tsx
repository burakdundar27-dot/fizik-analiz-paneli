import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Fizik Analiz ve Takip Paneli",
  description: "Fizik yanlışlarını kazanım ve hata nedeni bazında analiz et.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
