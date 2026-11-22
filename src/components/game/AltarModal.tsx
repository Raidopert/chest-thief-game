"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import {
  CRAFT_REQUIRED,
  RARITIES,
  RARITY_BY_ID,
  type RarityId,
} from "@/lib/game/config";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RARITY_ORDER: RarityId[] = [
  "common", "uncommon", "rare", "epic", "legendary", "mythic", "divine",
];

export default function AltarModal({ open, onClose }: Props) {
  const inventory = useGameStore((s) => s.inventory);
  const craftItems = useGameStore((s) => s.craftItems);
  const sacrificeItem = useGameStore((s) => s.sacrificeItem);
  const luckBoost = useGameStore((s) => s.luckBoost);
  const [tab, setTab] = useState<"craft" | "sacrifice">("craft");

  // только экипируемые предметы с count >= CRAFT_REQUIRED и редкость < divine
  const craftableStacks = useMemo(() => {
    return inventory.filter((s) => {
      if (s.count < CRAFT_REQUIRED) return false;
      if (s.slot === null) return false;
      const idx = RARITY_ORDER.indexOf(s.rarity);
      return idx >= 0 && idx < RARITY_ORDER.length - 1;
    });
  }, [inventory]);

  const sacrificeStacks = useMemo(() => {
    return inventory.filter((s) => s.count >= 1);
  }, [inventory]);

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
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border-2 border-purple-700/50 bg-gradient-to-b from-[#1c1c25] to-[#08060a] shadow-2xl p-4"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#15131c]/95 backdrop-blur z-10 pb-2 border-b border-zinc-700/40">
          <h2 className="text-zinc-200 font-bold uppercase tracking-wider">🏛 Алтарь</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-red-950/60 hover:bg-red-900 text-zinc-300 text-lg flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Табы внутри алтаря */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setTab("craft")}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              tab === "craft"
                ? "bg-amber-800 text-zinc-100"
                : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
            }`}
          >
            ⚗ Крафт ({CRAFT_REQUIRED}→1)
          </button>
          <button
            onClick={() => setTab("sacrifice")}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              tab === "sacrifice"
                ? "bg-purple-800 text-zinc-100"
                : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
            }`}
          >
            🙏 Жертва (удача)
          </button>
        </div>

        {luckBoost && (
          <div className="mb-3 p-2 rounded-lg bg-emerald-900/20 border border-emerald-700/30 text-[11px] text-emerald-300 font-mono">
            🍀 Текущая удача: +{Math.round(luckBoost.multiplier * 100)}%
          </div>
        )}

        {tab === "craft" ? (
          <div>
            <p className="text-[11px] text-zinc-500 mb-3">
              Объедини {CRAFT_REQUIRED} одинаковых предметов в 1 более редкий (того же типа).
            </p>
            {craftableStacks.length === 0 ? (
              <div className="text-center text-zinc-500 text-sm py-8">
                Нет предметов для крафта.
                <div className="text-[10px] mt-2">
                  Нужно {CRAFT_REQUIRED}+ одинаковых экипируемых предметов одной редкости.
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {craftableStacks.map((st) => {
                  const r = RARITY_BY_ID[st.rarity];
                  const nextRarityIdx = RARITY_ORDER.indexOf(st.rarity) + 1;
                  const nextRarity = RARITIES[nextRarityIdx];
                  return (
                    <div
                      key={st.uid}
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{
                        background: r.color + "11",
                        border: `1px solid ${r.color}55`,
                      }}
                    >
                      <span className="text-xl">{st.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-zinc-200 truncate">{st.name}</div>
                        <div className="text-[10px] font-mono" style={{ color: r.color }}>
                          ×{st.count} {r.name} → 1 {nextRarity.name}
                        </div>
                      </div>
                      <button
                        onClick={() => craftItems(st.itemId)}
                        className="px-3 py-1.5 rounded-md text-[11px] font-bold bg-amber-800 hover:bg-amber-700 text-zinc-100 transition-colors"
                      >
                        Крафт
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-[11px] text-zinc-500 mb-3">
              Пожертвуй предмет ради удачи: +0.5% за каждый предмет, действует 30 минут.
              Стак множится с текущим бустом.
            </p>
            {sacrificeStacks.length === 0 ? (
              <div className="text-center text-zinc-500 text-sm py-8">
                Нет предметов для жертвы.
              </div>
            ) : (
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {sacrificeStacks.map((st) => {
                  const r = RARITY_BY_ID[st.rarity];
                  return (
                    <div
                      key={st.uid}
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{
                        background: r.color + "0e",
                        border: `1px solid ${r.color}33`,
                      }}
                    >
                      <span className="text-lg">{st.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-zinc-200 truncate">{st.name}</div>
                        <div className="text-[10px] font-mono" style={{ color: r.color }}>
                          ×{st.count} {r.name}
                        </div>
                      </div>
                      <button
                        onClick={() => sacrificeItem(st.uid, 1)}
                        className="px-2 py-1 rounded text-[10px] font-bold bg-purple-900/60 hover:bg-purple-800 text-purple-200 transition-colors"
                        title="Пожертвовать 1 шт"
                      >
                        +1
                      </button>
                      {st.count > 1 && (
                        <button
                          onClick={() => sacrificeItem(st.uid, st.count)}
                          className="px-2 py-1 rounded text-[10px] font-bold bg-purple-700 hover:bg-purple-600 text-white transition-colors"
                          title={`Пожертвовать все ${st.count} шт`}
                        >
                          ×{st.count}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
