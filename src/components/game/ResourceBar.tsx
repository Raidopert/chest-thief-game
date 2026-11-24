"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { KEY_TYPES, RARITIES } from "@/lib/game/config";

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
    <div className="w-full rounded-2xl gothic-panel p-3 shadow-lg">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {/* Деньги */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">
              Монеты
            </span>
            <span className="font-bold text-zinc-200 font-mono text-lg leading-none">
              {money.toLocaleString("ru-RU")}
            </span>
          </div>
        </div>

        {/* Буст удачи */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍀</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">
              Удача
            </span>
            {luckBoost && luckRemaining > 0 ? (
              <span className="font-bold text-emerald-300 font-mono text-sm leading-none">
                +{Math.round(luckBoost.multiplier * 100)}% · {luckMinutes}:{luckSeconds.toString().padStart(2, "0")}
              </span>
            ) : (
              <span className="font-bold text-zinc-500 font-mono text-sm leading-none">
                нет
              </span>
            )}
          </div>
        </div>

        {/* Души престижа + кнопки */}
        <div className="flex items-center gap-1.5">
          {prestige.souls > 0 && (
            <div className="flex flex-col items-center px-2 py-1 rounded-lg bg-purple-950/40 border border-purple-700/30">
              <span className="text-[9px] uppercase text-purple-400/70 font-mono">Души</span>
              <span className="text-purple-300 font-bold text-sm font-mono leading-none">{prestige.souls}</span>
            </div>
          )}
          <button
            onClick={onOpenUpgrades}
            className="px-3 py-2 rounded-xl bg-gradient-to-b from-cyan-800 to-cyan-950 text-cyan-200 font-bold text-sm hover:from-cyan-700 hover:to-cyan-900 transition-colors border border-cyan-700/50 shadow-md"
            title="Апгрейды кликера" aria-label="Апгрейды кликера"
          >
            ⚒
          </button>
          <button
            onClick={onOpenPrestige}
            className="px-3 py-2 rounded-xl bg-gradient-to-b from-purple-700 to-purple-950 text-purple-200 font-bold text-sm hover:from-purple-600 hover:to-purple-900 transition-colors border border-purple-600/50 shadow-md"
            title="Престиж" aria-label="Престиж — сбросить прогресс ради множителя"
          >
            💀
          </button>
          <button
            onClick={onOpenQuests}
            className="px-3 py-2 rounded-xl bg-gradient-to-b from-amber-800 to-amber-950 text-amber-200 font-bold text-sm hover:from-amber-700 hover:to-amber-900 transition-colors border border-amber-700/50 shadow-md"
            title="Достижения и дейлики" aria-label="Задания — достижения и дейлики"
          >
            📜
          </button>
          <button
            onClick={onOpenAltar}
            className="px-3 py-2 rounded-xl bg-gradient-to-b from-purple-800 to-purple-950 text-purple-200 font-bold text-sm hover:from-purple-700 hover:to-purple-900 transition-colors border border-purple-700/50 shadow-md"
            title="Крафт и жертва" aria-label="Алтарь — крафт и жертва"
          >
            🏛
          </button>
          <button
            onClick={onOpenShop}
            className="px-4 py-2 rounded-xl bg-gradient-to-b from-red-800 to-red-950 text-zinc-200 font-bold text-sm hover:from-red-700 hover:to-red-900 transition-colors border border-red-700/50 shadow-md"
          >
            🛒 Магазин
          </button>
        </div>
      </div>

      {/* Выбор ключа */}
      <div className="mt-3 pt-3 border-t border-zinc-700">
        <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono mb-2">
          Ключ
        </div>
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
                className={`relative rounded-xl p-2 flex flex-col items-center gap-1 transition-all border-2 ${
                  isActive
                    ? "ring-2 ring-amber-400 scale-[1.03]"
                    : isAvailable
                      ? "ring-1 ring-amber-900/40 hover:ring-amber-700"
                      : "opacity-40 cursor-not-allowed ring-1 ring-zinc-800"
                }`}
                style={{
                  borderColor: isActive ? k.color + 'aa' : 'rgba(63,63,70,0.5)',
                  background: isActive
                    ? `linear-gradient(180deg, ${k.color}33, ${k.color}11)`
                    : "rgba(0,0,0,0.3)",
                }}
              >
                <span className="text-xl" style={{ filter: isActive ? "drop-shadow(0 0 4px " + k.color + ")" : "none" }}>
                  {k.emoji}
                </span>
                <span
                  className="text-[10px] font-mono leading-none"
                  style={{ color: k.color }}
                >
                  ×{count}
                </span>
                <span className="text-[8px] text-zinc-500 uppercase tracking-wider leading-none">
                  {k.name.split(" ")[0]}
                </span>
                {/* индикатор качества */}
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: k.color, opacity: k.qualityBoost > 0 ? 1 : 0.3 }} />
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {RARITIES.map((r) => (
            <span
              key={r.id}
              className="text-[9px] px-1.5 py-0.5 rounded font-mono"
              style={{
                color: r.color,
                background: r.color + "22",
                border: `1px solid ${r.color}44`,
              }}
            >
              {r.emoji} {r.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
