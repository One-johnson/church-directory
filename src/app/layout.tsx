import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex-client-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerUpdateToast } from "@/components/pwa/sw-update-toast";
import { PushAutoEnable } from "@/components/pwa/push-auto-enable";
import { SidebarLayout } from "../components/layout/sidebar-layout";
import React from "react";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UD Professionals Directory",
  description:
    "Connect UD Professional with other approved professional directory. Features user profiles, pastoral approval, in-app messaging, and role-based access. Built with Next.js and Tailwind.",
  applicationName: "UD Professionals Directory",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UD Pro",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <AuthProvider>
              <SidebarLayout>
                {children}
              </SidebarLayout>
              <InstallPrompt />
              <ServiceWorkerUpdateToast />
              <PushAutoEnable />
              <Toaster />
            </AuthProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
