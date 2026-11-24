import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import PWARegister from "@/components/game/PWARegister";
import ErrorBoundary from "@/components/game/ErrorBoundary";
import AutosaveIndicator from "@/components/game/AutosaveIndicator";
import Onboarding from "@/components/game/Onboarding";
import { SoundToggle } from "@/components/game/Sound";
import RarityFlash from "@/components/game/RarityFlash";

export const metadata: Metadata = {
  title: "Сундучный Вор: Тёмное Фэнтези",
  description: "Готическая кликер-игра: души чумного воришку демоническим луком, открывай проклятые сундуки, собирай 1000 реликвий и сражайся с демонами склепа.",
  applicationName: "Сундучный Вор",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Сундучный Вор", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Сундучный Вор" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          {children}
          <Toaster />
          <PWARegister />
          <AutosaveIndicator />
          <Onboarding />
          <SoundToggle />
          <RarityFlash />
        </ErrorBoundary>
      </body>
    </html>
  );
}
