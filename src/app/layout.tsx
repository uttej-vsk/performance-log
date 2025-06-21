import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import SessionProvider from "@/components/providers/SessionProvider";
import QueryProvider from "@/components/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Performance Tracker",
  description: "Track your performance and get insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <SessionProvider>
            <AppLayout>{children}</AppLayout>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
