"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { KEY_TYPES, RARITIES } from "@/lib/game/config";

interface Props {
  onOpenShop: () => void;
}

export default function ResourceBar({ onOpenShop }: Props) {
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
    <div className="w-full rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#1f1610] to-[#150e08] p-3 shadow-lg">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {/* Деньги */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-amber-200/60 font-mono">
              Монеты
            </span>
            <span className="font-bold text-amber-300 font-mono text-lg leading-none">
              {money.toLocaleString("ru-RU")}
            </span>
          </div>
        </div>

        {/* Буст удачи */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍀</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-amber-200/60 font-mono">
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

        {/* Кнопка магазина */}
        <button
          onClick={onOpenShop}
          className="px-4 py-2 rounded-xl bg-gradient-to-b from-amber-700 to-amber-900 text-amber-100 font-bold text-sm hover:from-amber-600 hover:to-amber-800 transition-colors border border-amber-500/40 shadow-md"
        >
          🛒 Магазин
        </button>
      </div>

      {/* Выбор ключа */}
      <div className="mt-3 pt-3 border-t border-amber-900/40">
        <div className="text-[10px] uppercase tracking-wider text-amber-200/60 font-mono mb-2">
          Активный ключ (зажать на сундуке):
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
                className={`relative rounded-lg p-2 flex flex-col items-center gap-1 transition-all ${
                  isActive
                    ? "ring-2 ring-amber-400 scale-[1.03]"
                    : isAvailable
                      ? "ring-1 ring-amber-900/40 hover:ring-amber-700"
                      : "opacity-40 cursor-not-allowed ring-1 ring-zinc-800"
                }`}
                style={{
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
                <span className="text-[8px] text-amber-200/50 uppercase tracking-wider leading-none">
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
              title={`${r.name}: шанс ${r.weight}/1000`}
            >
              {r.emoji} {r.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
