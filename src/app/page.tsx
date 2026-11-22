"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import ResourceBar from "@/components/game/ResourceBar";
import ClickerScene from "@/components/game/ClickerScene";
import ChestField from "@/components/game/ChestField";
import LootInventory from "@/components/game/LootInventory";
import Shop from "@/components/game/Shop";
import LootReveal from "@/components/game/LootReveal";
import HeroInventory from "@/components/game/HeroInventory";
import AutoBattle from "@/components/game/AutoBattle";

export default function Home() {
  const [shopOpen, setShopOpen] = useState(false);
  const hydrated = useGameStore((s) => s.hydrated);
  const totalClicks = useGameStore((s) => s.stats.totalClicks);
  const chestsOpened = useGameStore((s) => s.stats.chestsOpened);
  const itemsFound = useGameStore((s) => s.stats.itemsFound);
  const moneyEarned = useGameStore((s) => s.stats.moneyEarned);
  const bestRarityFound = useGameStore((s) => s.stats.bestRarityFound);
  const enemiesKilled = useGameStore((s) => s.battle.enemiesKilled);
  const heroLevel = useGameStore((s) => s.battle.heroLevel);
  const resetGame = useGameStore((s) => s.resetGame);

  // предотвращаем случайный зум на двойной тап (мобилки)
  useEffect(() => {
    let lastTouch = 0;
    const handler = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouch < 300) e.preventDefault();
      lastTouch = now;
    };
    document.addEventListener("touchend", handler, { passive: false });
    return () => document.removeEventListener("touchend", handler);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0705] text-amber-200/60 text-sm">
        Загрузка игры...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full text-amber-100"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #2a1d12 0%, #150e08 50%, #070504 100%)",
      }}
    >
      <main className="max-w-7xl mx-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {/* Заголовок */}
        <header className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-amber-300 tracking-tight leading-none">
              СУНДУЧНЫЙ ВОР
            </h1>
            <p className="text-[10px] md:text-[11px] text-amber-200/50 font-mono uppercase tracking-widest">
              лук · ключи · лут · 1000 предметов · 7 редкостей · герой · авто-бой
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm("Сбросить весь прогресс? Деньги, ключи, лут, экипировка и уровень будут утеряны.")) {
                  resetGame();
                }
              }}
              className="text-[10px] px-2 py-1 rounded border border-red-900/40 text-red-300/70 hover:bg-red-900/20 font-mono"
            >
              сброс
            </button>
          </div>
        </header>

        {/* Панель ресурсов */}
        <ResourceBar onOpenShop={() => setShopOpen(true)} />

        {/* Основная сетка: 3 колонки на десктопе */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px_360px] gap-3 md:gap-4">
          {/* Левая колонка: кликер-воришка + поле сундуков */}
          <div className="space-y-3 md:space-y-4">
            {/* Кликер — левая рука героя душит воришку */}
            <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#1a1208] to-[#0e0a05] p-3 md:p-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-widest text-amber-200/60 font-mono">
                  Левая рука — душит воришку
                </div>
                <div className="text-[10px] text-amber-200/40 font-mono">
                  ~18% ключ / клик
                </div>
              </div>
              <ClickerScene />
            </div>

            {/* Поле сундуков */}
            <ChestField />
          </div>

          {/* Центральная колонка: герой-силуэт с экипировкой */}
          <div className="lg:h-auto">
            <HeroInventory />
          </div>

          {/* Правая колонка: авто-боец (правая рука) + инвентарь лута */}
          <div className="space-y-3 md:space-y-4">
            <AutoBattle />
            <LootInventory />
          </div>
        </div>

        {/* Статистика */}
        <footer className="rounded-2xl border border-amber-900/40 bg-[#150e08]/80 p-3 grid grid-cols-2 md:grid-cols-6 gap-2 text-center">
          <Stat label="Кликов" value={totalClicks} />
          <Stat label="Сундуков" value={chestsOpened} />
          <Stat label="Лута" value={itemsFound} />
          <Stat label="Врагов" value={enemiesKilled} />
          <Stat label="Уровень" value={heroLevel} />
          <Stat
            label="Лучшая редкость"
            value={bestRarityFound ?? "—"}
            color={bestRarityFound ? undefined : "#9ca3af"}
          />
        </footer>

        <div className="text-[10px] text-amber-200/40 font-mono text-center pb-2">
          Левая рука = душить воришку кликом · Правая рука = авто-бьёт врагов · Сундук = удержание ключом · Лут = клик для продажи или «надеть» · Герой = клик по ячейке
        </div>
      </main>

      <Shop open={shopOpen} onClose={() => setShopOpen(false)} />
      <LootReveal />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color?: string }) {
  const numStr = typeof value === "number" ? value.toLocaleString("ru-RU") : value;
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-amber-200/50 font-mono">
        {label}
      </div>
      <div className="text-amber-300 font-bold text-sm font-mono" style={color ? { color } : undefined}>
        {numStr}
      </div>
    </div>
  );
}
