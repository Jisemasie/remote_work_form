import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'sonner';
import { inter } from '@/app/ui/fonts'
import { SessionProvider } from "next-auth/react"
import { Suspense } from "react";
import Spinner from "./ui/spinner";

export const metadata: Metadata = {
  title: "Admin process management",
  description: "Admin process",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
      ><SessionProvider>
        <Toaster richColors />
        <Suspense fallback={<Spinner />}>
        {children}
        </Suspense>
        </SessionProvider>
      </body>
    </html>
  );
}
