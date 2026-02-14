import type { Metadata } from "next";
import "./globals.css";
import { Header, Nav } from "@/components/layout";

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
    <html lang="en">
      <body className="min-h-screen font-sans">
        <div className="mx-auto max-w-xl px-5 py-10">
          <Header />
          <Nav />
          <main className="mt-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
