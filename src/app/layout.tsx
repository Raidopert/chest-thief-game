import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Сундучный Вор: Лут, Ключи и Душащий Лук",
  description:
    "Браузерная кликер-игра: души воришку-бомжу луком, получай ключи, открывай случайные сундуки, собирай 1000 предметов 7 редкостей и продавай лут в магазине.",
  keywords: [
    "игра",
    "кликер",
    "сундуки",
    "лут",
    "раритет",
    "next.js",
    "браузерная игра",
  ],
  authors: [{ name: "Z.ai" }],
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1a1208",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
