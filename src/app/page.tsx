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
import GameTabs from "@/components/game/GameTabs";
import { SPAWN_INTERVAL_MS } from "@/lib/game/config";

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

  // Селекторы для циклов (получаем функции один раз)
  const spawnChestTick = useGameStore((s) => s.spawnChestTick);
  const pruneChests = useGameStore((s) => s.pruneChests);
  const battleTick = useGameStore((s) => s.battleTick);
  const clearLuckIfExpired = useGameStore((s) => s.clearLuckIfExpired);

  // Главные игровые циклы — работают ВСЕГДА, независимо от активной вкладки.
  // Только так спавн сундуков и авто-бой идут в фоне, пока игрок на другой вкладке.
  useEffect(() => {
    const spawn = setInterval(() => spawnChestTick(), SPAWN_INTERVAL_MS);
    const prune = setInterval(() => pruneChests(Date.now()), 800);
    const battle = setInterval(() => battleTick(Date.now()), 100);
    const luck = setInterval(() => clearLuckIfExpired(Date.now()), 1000);
    // стартовый спавн
    spawnChestTick();
    const t1 = setTimeout(() => spawnChestTick(), 500);
    const t2 = setTimeout(() => spawnChestTick(), 1200);
    return () => {
      clearInterval(spawn);
      clearInterval(prune);
      clearInterval(battle);
      clearInterval(luck);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [spawnChestTick, pruneChests, battleTick, clearLuckIfExpired]);

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
      className="min-h-screen w-full text-zinc-200"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #2a2530 0%, #15131c 50%, #08060a 100%)",
      }}
    >
      <main className="max-w-5xl mx-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {/* Заголовок */}
        <header className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-zinc-100 tracking-[0.2em] leading-none uppercase">
              Сундучный Вор
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm("Сбросить весь прогресс? Деньги, ключи, лут, экипировка и уровень будут утеряны.")) {
                  resetGame();
                }
              }}
              className="text-[10px] px-2 py-1 rounded border border-red-900/50 text-red-400/80 hover:bg-red-950/40 font-mono uppercase tracking-wider"
            >
              сброс
            </button>
          </div>
        </header>

        {/* Панель ресурсов — всегда видна над вкладками */}
        <ResourceBar onOpenShop={() => setShopOpen(true)} />

        {/* Вкладки */}
        <GameTabs
          huntTab={
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-3 md:gap-4">
              {/* Кликер — компактный слева на десктопе */}
              <div className="rounded-2xl border border-zinc-700 bg-gradient-to-b from-[#15131c] to-[#08060a] p-2 md:p-3 flex flex-col items-center">
                <ClickerScene />
              </div>
              {/* Поле сундуков */}
              <ChestField />
            </div>
          }
          heroTab={
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <HeroInventory />
              <AutoBattle />
            </div>
          }
          lootTab={<LootInventory />}
        />

        {/* Статистика */}
        <footer className="rounded-2xl border border-zinc-700 bg-[#0f0d15]/80 p-3 grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
          <Stat label="Кликов" value={totalClicks} />
          <Stat label="Сундуков" value={chestsOpened} />
          <Stat label="Лута" value={itemsFound} />
          <Stat label="Врагов" value={enemiesKilled} />
          <Stat label="Уровень" value={heroLevel} />
          <Stat
            label="Лучшая редкость"
            value={bestRarityFound ?? "—"}
            color={bestRarityFound ? undefined : "#64748b"}
          />
        </footer>

        <div className="text-[10px] text-zinc-600 font-mono text-center pb-2 uppercase tracking-wider">
          Зажми сундук ключом · Клик по луту — продать или надеть
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
      <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">
        {label}
      </div>
      <div className="text-zinc-200 font-bold text-sm font-mono" style={color ? { color } : undefined}>
        {numStr}
      </div>
    </div>
  );
}
