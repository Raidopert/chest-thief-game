"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { RARITY_BY_ID } from "@/lib/game/config";
import { Sounds } from "./Sound";

// Окно выпавшего лута — НЕ на весь экран, а компактная карточка сверху
// Не перекрывает сундуки на поле
export default function LootReveal() {
  const lastDrop = useGameStore((s) => s.lastDrop);
  const clearLastDrop = useGameStore((s) => s.clearLastDrop);

  useEffect(() => {
    if (!lastDrop) return;
    Sounds.chestOpen();
    // Звук редкости
    const rank = ["common","uncommon","rare","epic","legendary","mythic","divine"].indexOf(lastDrop.rarity);
    if (rank >= 2) setTimeout(() => Sounds.lootRare(), 300);
    const t = setTimeout(() => clearLastDrop(), 3000);
    return () => clearTimeout(t);
  }, [lastDrop, clearLastDrop]);

  return (
    <AnimatePresence>
      {lastDrop && (
        <motion.div
          key={lastDrop.uid}
          className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60]"
          initial={{ opacity: 0, scale: 0.3, y: 30 }}
          animate={{ opacity: 1, scale: [0.3, 1.15, 1], y: [30, 0, 0] }}
          exit={{ opacity: 0, scale: 0.5, y: -30 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div
            className="rounded-xl px-5 py-3 flex flex-col items-center gap-1.5"
            style={{
              background: "rgba(15,10,5,0.95)",
              border: `2px solid ${RARITY_BY_ID[lastDrop.rarity].color}`,
              boxShadow: `0 0 40px ${RARITY_BY_ID[lastDrop.rarity].glow}, 0 0 15px ${RARITY_BY_ID[lastDrop.rarity].color}, 0 8px 24px rgba(0,0,0,0.8)`,
            }}
          >
            <div className="text-[10px] uppercase tracking-widest font-mono" style={{ color: RARITY_BY_ID[lastDrop.rarity].color }}>
              {RARITY_BY_ID[lastDrop.rarity].emoji} {RARITY_BY_ID[lastDrop.rarity].name}
            </div>
            <motion.div
              className="text-4xl"
              style={{ filter: `drop-shadow(0 0 10px ${RARITY_BY_ID[lastDrop.rarity].color})` }}
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              {lastDrop.emoji}
            </motion.div>
            <div className="text-zinc-200 font-bold text-sm text-center max-w-[200px]">
              {lastDrop.name}
            </div>
            <div className="text-xs font-mono" style={{ color: RARITY_BY_ID[lastDrop.rarity].color }}>
              {lastDrop.value.toLocaleString("ru-RU")} 💰
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
