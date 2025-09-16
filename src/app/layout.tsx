import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Clarity by Tanosec",
  description: "AI-powered cybersecurity insights for your business.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn("font-body antialiased flex flex-col min-h-svh", inter.variable)}>
        <main className="flex-1 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:pb-24">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
