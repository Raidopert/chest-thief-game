"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import {
  CLICKER_UPGRADES,
  RARITY_BY_ID,
  upgradePrice,
} from "@/lib/game/config";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function UpgradesModal({ open, onClose }: Props) {
  const money = useGameStore((s) => s.money);
  const upgrades = useGameStore((s) => s.upgrades);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border-2 border-cyan-700/50 bg-gradient-to-b from-[#15131c] to-[#08060a] shadow-2xl p-4"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#15131c]/95 backdrop-blur z-10 pb-2 border-b border-zinc-700/40">
          <div>
            <h2 className="text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-2">
              ⚒ Апгрейды кликера
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono">
              В кошельке: <span className="text-zinc-200 font-bold">{money.toLocaleString("ru-RU")}💰</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-red-950/60 hover:bg-red-900 text-zinc-300 text-lg flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          {CLICKER_UPGRADES.map((upgrade) => {
            const currentLevel = upgrades[upgrade.id] ?? 0;
            const isMaxed = currentLevel >= upgrade.maxLevel;
            const price = upgradePrice(upgrade, currentLevel);
            const canBuy = !isMaxed && money >= price;

            return (
              <div
                key={upgrade.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border transition-all"
                style={{
                  background: isMaxed
                    ? "rgba(34,197,94,0.08)"
                    : canBuy
                      ? upgrade.color + "15"
                      : "rgba(0,0,0,0.3)",
                  borderColor: isMaxed
                    ? "rgba(34,197,94,0.3)"
                    : canBuy
                      ? upgrade.color + "55"
                      : "#27272a",
                  boxShadow: canBuy ? `0 0 12px ${upgrade.color}33` : "none",
                }}
              >
                {/* Иконка + уровень */}
                <div className="flex flex-col items-center min-w-[48px]">
                  <span className="text-2xl" style={{ filter: canBuy || isMaxed ? `drop-shadow(0 0 4px ${upgrade.color})` : "none" }}>
                    {upgrade.emoji}
                  </span>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: i < currentLevel ? upgrade.color : "#27272a",
                          boxShadow: i < currentLevel ? `0 0 3px ${upgrade.color}` : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Название + описание */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold" style={{ color: upgrade.color }}>
                    {upgrade.name}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {upgrade.description}
                  </div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: upgrade.color + "99" }}>
                    ур. {currentLevel}/{upgrade.maxLevel} · {upgrade.effectPerLevel}
                  </div>
                </div>

                {/* Цена / кнопка */}
                {isMaxed ? (
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-900/40 border border-emerald-700/30 text-emerald-300 text-[11px] font-bold">
                    ✓ МАКС
                  </div>
                ) : (
                  <button
                    onClick={() => buyUpgrade(upgrade.id)}
                    disabled={!canBuy}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      canBuy
                        ? "bg-cyan-800 hover:bg-cyan-700 text-white"
                        : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    }`}
                    style={canBuy ? { background: upgrade.color + "cc", color: "#fff" } : undefined}
                  >
                    {price.toLocaleString("ru-RU")}💰
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-[10px] text-zinc-500 italic border-t border-zinc-700/40 pt-3 mt-3">
          Апгрейды сбрасываются при престиже. Прокачивай стратегически!
        </div>
      </motion.div>
    </motion.div>
  );
}
