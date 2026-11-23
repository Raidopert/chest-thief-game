"use client";

import { useEffect, useState } from "react";

export default function PWARegister() {
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/sw.js`).catch((err) => console.warn("[PWA] SW failed:", err));
    }
    const handler = (e: Event) => {
      e.preventDefault();
      requestAnimationFrame(() => {
        setInstallEvent(e);
        if (!window.matchMedia("(display-mode: standalone)").matches) setShowInstallBanner(true);
      });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setShowInstallBanner(false);
    setInstallEvent(null);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-3 rounded-xl bg-gradient-to-r from-red-950 to-purple-950 border-2 border-red-700/60 shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center gap-3 backdrop-blur-md">
      <span className="text-2xl">📥</span>
      <div className="flex flex-col">
        <span className="text-zinc-100 font-bold text-xs uppercase tracking-wider">Установить игру</span>
        <span className="text-zinc-400 text-[10px] font-mono">Работает офлайн, как приложение</span>
      </div>
      <button onClick={handleInstall} className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-colors">Установить</button>
      <button onClick={() => setShowInstallBanner(false)} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none px-1" aria-label="Закрыть">×</button>
    </div>
  );
}
