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
import QuestsModal from "@/components/game/QuestsModal";
import AltarModal from "@/components/game/AltarModal";
import PrestigeModal from "@/components/game/PrestigeModal";
import UpgradesModal from "@/components/game/UpgradesModal";
import EventBanner from "@/components/game/EventBanner";
import NoticeToast from "@/components/game/NoticeToast";
import {
  DUNGEON_KILLS_PER_FLOOR,
  DUNGEON_NAMES,
  SPAWN_INTERVAL_MS,
} from "@/lib/game/config";

export default function Home() {
  const [shopOpen, setShopOpen] = useState(false);
  const [questsOpen, setQuestsOpen] = useState(false);
  const [altarOpen, setAltarOpen] = useState(false);
  const [prestigeOpen, setPrestigeOpen] = useState(false);
  const [upgradesOpen, setUpgradesOpen] = useState(false);
  const hydrated = useGameStore((s) => s.hydrated);
  const totalClicks = useGameStore((s) => s.stats.totalClicks);
  const chestsOpened = useGameStore((s) => s.stats.chestsOpened);
  const itemsFound = useGameStore((s) => s.stats.itemsFound);
  const moneyEarned = useGameStore((s) => s.stats.moneyEarned);
  const bestRarityFound = useGameStore((s) => s.stats.bestRarityFound);
  const enemiesKilled = useGameStore((s) => s.battle.enemiesKilled);
  const heroLevel = useGameStore((s) => s.battle.heroLevel);
  const bossKills = useGameStore((s) => s.stats.bossKills);
  const eliteKills = useGameStore((s) => s.stats.eliteKills);
  const resetGame = useGameStore((s) => s.resetGame);

  // Селекторы для циклов (получаем функции один раз)
  const spawnChestTick = useGameStore((s) => s.spawnChestTick);
  const pruneChests = useGameStore((s) => s.pruneChests);
  const battleTick = useGameStore((s) => s.battleTick);
  const clearLuckIfExpired = useGameStore((s) => s.clearLuckIfExpired);
  const resetDailiesIfNewDay = useGameStore((s) => s.resetDailiesIfNewDay);
  const clickClicker = useGameStore((s) => s.clickClicker);
  const autoClickerLevel = useGameStore((s) => s.upgrades.auto_clicker ?? 0);
  const checkEvents = useGameStore((s) => s.checkEvents);

  // === Единый главный игровой loop ===
  // Раньше было 5 setInterval — теперь один с приоритетным расписанием.
  // Бой — каждые 250мс (было 100мс — overkill), остальные реже.
  // Это снижает нагрузку на CPU/батарею мобилок в ~3 раза.
  useEffect(() => {
    let lastSpawn = 0;
    let lastPrune = 0;
    let lastLuck = 0;
    let lastDaily = 0;
    let lastAutoClick = 0;
    const SPAWN_MS = SPAWN_INTERVAL_MS;
    const PRUNE_MS = 800;
    const BATTLE_MS = 250;
    const LUCK_MS = 1000;
    const DAILY_MS = 60_000;
    const AUTO_CLICK_MS = 2000;
    const EVENT_CHECK_MS = 1000;

    const start = Date.now();
    let raf = 0;
    let lastBattle = start;

    const tick = () => {
      const now = Date.now();
      // Бой — приоритетный, чаще всего
      if (now - lastBattle >= BATTLE_MS) {
        battleTick(now);
        lastBattle = now;
      }
      // Авто-кликер — если уровень > 0
      if (autoClickerLevel > 0 && now - lastAutoClick >= AUTO_CLICK_MS) {
        for (let i = 0; i < autoClickerLevel; i++) clickClicker();
        lastAutoClick = now;
      }
      // Спавн сундуков
      if (now - lastSpawn >= SPAWN_MS) {
        spawnChestTick();
        lastSpawn = now;
      }
      // События/ивенты
      if (now - lastEventCheck >= EVENT_CHECK_MS) {
        checkEvents(now);
        lastEventCheck = now;
      }
      // Очистка
      if (now - lastPrune >= PRUNE_MS) {
        pruneChests(now);
        lastPrune = now;
      }
      // Luck boost expiry
      if (now - lastLuck >= LUCK_MS) {
        clearLuckIfExpired(now);
        lastLuck = now;
      }
      // Dailies сброс
      if (now - lastDaily >= DAILY_MS) {
        resetDailiesIfNewDay();
        lastDaily = now;
      }
      raf = requestAnimationFrame(tick);
    };
    // стартовый спавн сразу
    spawnChestTick();
    setTimeout(() => spawnChestTick(), 500);
    setTimeout(() => spawnChestTick(), 1200);
    resetDailiesIfNewDay();
    lastDaily = start; lastLuck = start; lastPrune = start; lastSpawn = start; lastAutoClick = start; lastEventCheck = start;
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spawnChestTick, pruneChests, battleTick, clearLuckIfExpired, resetDailiesIfNewDay, clickClicker, autoClickerLevel, checkEvents]);

  // T3: Keyboard shortcuts — хоткеи для вкладок, ключей, модалок
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Игнорируем если фокус в input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const key = e.key.toLowerCase();
      // 1/2/3 — переключение вкладок
      if (key === "1") window.dispatchEvent(new CustomEvent("switch-tab", { detail: "hunt" }));
      else if (key === "2") window.dispatchEvent(new CustomEvent("switch-tab", { detail: "hero" }));
      else if (key === "3") window.dispatchEvent(new CustomEvent("switch-tab", { detail: "loot" }));
      // Q/W/E/R/T — выбор ключа
      else if (key === "q") useGameStore.getState().setSelectedKey("rusty");
      else if (key === "w") useGameStore.getState().setSelectedKey("iron");
      else if (key === "e") useGameStore.getState().setSelectedKey("bronze");
      else if (key === "r") useGameStore.getState().setSelectedKey("silver");
      else if (key === "t") useGameStore.getState().setSelectedKey("golden");
      // S — магазин
      else if (key === "s") setShopOpen(true);
      // B — задания
      else if (key === "b") setQuestsOpen(true);
      // A — алтарь
      else if (key === "a") setAltarOpen(true);
      // U — апгрейды
      else if (key === "u") setUpgradesOpen(true);
      // P — престиж
      else if (key === "p") setPrestigeOpen(true);
      // Escape — закрыть все модалки
      else if (key === "escape") {
        setShopOpen(false); setQuestsOpen(false); setAltarOpen(false);
        setPrestigeOpen(false); setUpgradesOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
            <h1 className="text-xl md:text-2xl font-black text-zinc-100 leading-none uppercase gothic-title">
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
        <ResourceBar
          onOpenShop={() => setShopOpen(true)}
          onOpenQuests={() => setQuestsOpen(true)}
          onOpenAltar={() => setAltarOpen(true)}
          onOpenPrestige={() => setPrestigeOpen(true)}
          onOpenUpgrades={() => setUpgradesOpen(true)}
        />

        {/* Индикатор этажа подземелья */}
        <FloorIndicator enemiesKilled={enemiesKilled} />

        {/* Баннеры событий */}
        <EventBanner />

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
        <footer className="rounded-2xl border border-zinc-700 bg-[#0f0d15]/80 p-3 grid grid-cols-4 md:grid-cols-8 gap-2 text-center">
          <Stat label="Кликов" value={totalClicks} />
          <Stat label="Сундуков" value={chestsOpened} />
          <Stat label="Лута" value={itemsFound} />
          <Stat label="Врагов" value={enemiesKilled} />
          <Stat label="Боссов" value={bossKills} />
          <Stat label="Элиты" value={eliteKills} />
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
      <QuestsModal open={questsOpen} onClose={() => setQuestsOpen(false)} />
      <AltarModal open={altarOpen} onClose={() => setAltarOpen(false)} />
      <PrestigeModal open={prestigeOpen} onClose={() => setPrestigeOpen(false)} />
      <UpgradesModal open={upgradesOpen} onClose={() => setUpgradesOpen(false)} />
      <LootReveal />
      <NoticeToast />
    </div>
  );
}

function FloorIndicator({ enemiesKilled }: { enemiesKilled: number }) {
  const floor = Math.floor(enemiesKilled / DUNGEON_KILLS_PER_FLOOR) + 1;
  const progressInFloor = enemiesKilled % DUNGEON_KILLS_PER_FLOOR;
  const pct = (progressInFloor / DUNGEON_KILLS_PER_FLOOR) * 100;
  const name = DUNGEON_NAMES[Math.min(floor - 1, DUNGEON_NAMES.length - 1)];
  return (
    <div className="rounded-2xl border border-purple-900/40 bg-gradient-to-r from-purple-950/40 to-[#0f0d15] p-2.5 flex items-center gap-3">
      <div className="flex flex-col items-center min-w-[60px]">
        <div className="text-[9px] uppercase tracking-widest text-purple-400/80 font-mono">
          Этаж
        </div>
        <div className="text-purple-200 font-black text-xl font-mono leading-none">
          {floor}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-zinc-300 font-bold truncate">
          {name}
        </div>
        <div className="mt-1 h-1.5 bg-black/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-700 to-purple-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
          {progressInFloor}/{DUNGEON_KILLS_PER_FLOOR} до следующего этажа · ×{(Math.pow(1.5, floor - 1)).toFixed(2)} HP врагов
        </div>
      </div>
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
