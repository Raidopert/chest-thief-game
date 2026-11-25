"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { KEY_TYPES, RARITIES } from "@/lib/game/config";
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

  return (
    <div className="w-full rounded-2xl gothic-panel p-4 shadow-lg">
      {/* Строка 1: Деньги + Удача + Меню */}
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">Монеты</span>
            <span className="font-bold text-zinc-100 font-mono text-xl leading-none">
              {money.toLocaleString("ru-RU")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xl">🍀</span>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">Удача</span>
            {luckBoost && luckRemaining > 0 ? (
              <span className="font-bold text-emerald-300 font-mono text-sm leading-none">
                +{Math.round(luckBoost.multiplier * 100)}% · {luckMinutes}:{luckSeconds.toString().padStart(2, "0")}
              </span>
            ) : (
              <span className="font-bold text-zinc-600 font-mono text-sm leading-none">нет</span>
            )}
          </div>
        </div>

        <GameMenu
          onOpenShop={onOpenShop}
          onOpenQuests={onOpenQuests}
          onOpenAltar={onOpenAltar}
          onOpenPrestige={onOpenPrestige}
          onOpenUpgrades={onOpenUpgrades}
        />
      </div>

      {/* Строка 2: Ключи — крупнее, с подписями */}
      <div className="mt-3 pt-3 border-t border-zinc-700/50">
        <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono mb-2">
          Ключ — зажми на сундуке
        </div>
        <div className="grid grid-cols-5 gap-2">
          {KEY_TYPES.map((k) => {
            const count = keys[k.id];
            const isActive = selectedKey === k.id;
            const isAvailable = count > 0;
            return (
              <button
                key={k.id}
                onClick={() => isAvailable && setSelectedKey(k.id)}
                disabled={!isAvailable}
                className={`gothic-ornate-btn relative rounded-xl p-2.5 flex flex-col items-center gap-1 transition-all min-h-[56px] ${
                  isActive
                    ? "ring-2 scale-[1.05]"
                    : isAvailable
                      ? "ring-1 hover:ring-2"
                      : "opacity-30 cursor-not-allowed ring-1 ring-zinc-800"
                }`}
                style={{
                  background: isActive
                    ? `linear-gradient(180deg, ${k.color}33, ${k.color}11)`
                    : "rgba(0,0,0,0.3)",
                  borderColor: isActive ? k.color : "rgba(63,63,70,0.5)",
                  ringColor: isActive ? k.color : undefined,
                } as React.CSSProperties}
              >
                <span className="text-xl" style={{ filter: isActive ? `drop-shadow(0 0 6px ${k.color})` : "none" }}>
                  {k.emoji}
                </span>
                <span className="text-xs font-mono font-bold" style={{ color: k.color }}>
                  ×{count}
                </span>
              </button>
            );
          })}
        </div>
        {/* Плашки редкостей */}
        <div className="mt-2 flex flex-wrap gap-1">
          {RARITIES.map((r) => (
            <span
              key={r.id}
              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{ color: r.color, background: r.color + "22", border: `1px solid ${r.color}44` }}
            >
              {r.emoji} {r.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
