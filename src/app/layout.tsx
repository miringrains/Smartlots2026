import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartLots Pro - Admin Portal",
  description: "Parking lot management system admin dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${sans.variable} ${mono.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
