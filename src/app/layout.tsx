import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Сундучный Вор: Тёмное Фэнтези",
  description:
    "Готическая кликер-игра в стиле Diablo/Bloodborne: души чумного воришку демоническим луком, открывай проклятые сундуки, собирай 1000 реликвий 7 редкостей и сражайся с демонами склепа.",
  keywords: [
    "игра",
    "кликер",
    "сундуки",
    "лут",
    "раритет",
    "dark fantasy",
    "диабло",
    "готика",
    "next.js",
  ],
  authors: [{ name: "Z.ai" }],
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
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
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
