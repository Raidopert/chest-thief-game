"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { KEY_TYPES, RARITIES, calculatePrestigeMult } from "@/lib/game/config";
import { DUNGEON_KILLS_PER_FLOOR, DUNGEON_NAMES } from "@/lib/game/config";
import GameMenu from "./GameMenu";

interface Props {
  onOpenShop: () => void;
  onOpenQuests: () => void;
  onOpenAltar: () => void;
  onOpenPrestige: () => void;
  onOpenUpgrades: () => void;
}

export default function ResourceBar({ onOpenShop, onOpenQuests, onOpenAltar, onOpenPrestige, onOpenUpgrades }: Props) {
  const keys = useGameStore((s) => s.keys);
  const money = useGameStore((s) => s.money);
  const selectedKey = useGameStore((s) => s.selectedKey);
  const setSelectedKey = useGameStore((s) => s.setSelectedKey);
  const luckBoost = useGameStore((s) => s.luckBoost);
  const clearLuckIfExpired = useGameStore((s) => s.clearLuckIfExpired);
  const prestige = useGameStore((s) => s.prestige);
  const enemiesKilled = useGameStore((s) => s.battle.enemiesKilled);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      clearLuckIfExpired(n);
    }, 500);
    return () => clearInterval(t);
  }, [clearLuckIfExpired]);

  const luckRemaining = luckBoost ? Math.max(0, luckBoost.untilTs - now) : 0;
  const luckMinutes = Math.floor(luckRemaining / 60000);
  const luckSeconds = Math.floor((luckRemaining % 60000) / 1000);
  const floor = Math.floor(enemiesKilled / DUNGEON_KILLS_PER_FLOOR) + 1;
  const floorName = DUNGEON_NAMES[Math.min(floor - 1, DUNGEON_NAMES.length - 1)];
  const prestigeMult = calculatePrestigeMult(prestige.souls);

  return (
    <div className="w-full rounded-2xl gothic-ornate-panel p-3 shadow-lg">
      {/* Строка 1: Деньги | Удача | Этаж | Престиж | Меню */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xl">💰</span>
          <span className="font-bold text-zinc-100 font-mono text-base leading-none">
            {money.toLocaleString("ru-RU")}
          </span>
        </div>

        <div className="w-px h-5 bg-zinc-700/50" />

        <div className="flex items-center gap-1.5">
          <span className="text-base">🍀</span>
          {luckBoost && luckRemaining > 0 ? (
            <span className="font-bold text-emerald-300 font-mono text-xs leading-none">
              +{Math.round(luckBoost.multiplier * 100)}% {luckMinutes}:{luckSeconds.toString().padStart(2, "0")}
            </span>
          ) : (
            <span className="text-zinc-600 font-mono text-xs leading-none">—</span>
          )}
        </div>

        <div className="w-px h-5 bg-zinc-700/50" />

        <div className="flex items-center gap-1.5">
          <span className="text-base">🏰</span>
          <div className="flex flex-col leading-none">
            <span className="text-purple-300 font-bold text-xs gothic-font">{floorName}</span>
            <span className="text-zinc-500 font-mono text-[10px]">этаж {floor}</span>
          </div>
        </div>

        {prestige.souls > 0 && (
          <>
            <div className="w-px h-5 bg-zinc-700/50" />
            <div className="flex items-center gap-1.5">
              <span className="text-base">💀</span>
              <span className="font-bold text-purple-300 font-mono text-xs leading-none">
                ×{prestigeMult.toFixed(2)}
              </span>
            </div>
          </>
        )}

        <div className="ml-auto">
          <GameMenu
            onOpenShop={onOpenShop}
            onOpenQuests={onOpenQuests}
            onOpenAltar={onOpenAltar}
            onOpenPrestige={onOpenPrestige}
            onOpenUpgrades={onOpenUpgrades}
          />
        </div>
      </div>

      {/* Строка 2: Ключи */}
      <div className="mt-2 pt-2 border-t border-zinc-700/40">
        <div className="grid grid-cols-5 gap-1.5">
          {KEY_TYPES.map((k) => {
            const count = keys[k.id];
            const isActive = selectedKey === k.id;
            const isAvailable = count > 0;
            return (
              <button
                key={k.id}
                onClick={() => isAvailable && setSelectedKey(k.id)}
                disabled={!isAvailable}
                className={`gothic-ornate-btn relative rounded-lg p-2 flex flex-col items-center gap-0.5 transition-all min-h-[52px] ${
                  isActive ? "ring-2 scale-[1.05]" : isAvailable ? "ring-1 hover:ring-2" : "opacity-30 cursor-not-allowed ring-1 ring-zinc-800"
                }`}
                style={{
                  background: isActive ? `linear-gradient(180deg, ${k.color}33, ${k.color}11)` : "rgba(0,0,0,0.3)",
                  borderColor: isActive ? k.color + "aa" : "rgba(63,63,70,0.5)",
                } as React.CSSProperties}
              >
                <span className="text-lg" style={{ filter: isActive ? `drop-shadow(0 0 5px ${k.color})` : "none" }}>
                  {k.emoji}
                </span>
                <span className="text-xs font-mono font-bold" style={{ color: k.color }}>
                  ×{count}
                </span>
              </button>
            );
          })}
        </div>
        {/* Редкости */}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {RARITIES.map((r) => (
            <span key={r.id} className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ color: r.color, background: r.color + "22", border: `1px solid ${r.color}44` }}>
              {r.emoji} {r.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
