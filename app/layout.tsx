import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Micro Prediction Market",
  description: "Bet on stuff with play money",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans bg-[#0a0a0a] text-zinc-100 antialiased">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 lg:py-12">
          <Header />
          <main className="mt-12 lg:mt-16">{children}</main>
        </div>
      </body>
    </html>
  );
}
