"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { RARITY_BY_ID } from "@/lib/game/config";

// Анимация выскакивающего лута при открытии сундука.
// lastDrop хранится в store; мы просто чистим его через 2.2 сек,
// вызывая clearLastDrop (сеттер в колбэке таймера — допустимо правилом).
export default function LootReveal() {
  const lastDrop = useGameStore((s) => s.lastDrop);
  const clearLastDrop = useGameStore((s) => s.clearLastDrop);

  useEffect(() => {
    if (!lastDrop) return;
    const t = setTimeout(() => clearLastDrop(), 2200);
    return () => clearTimeout(t);
  }, [lastDrop, clearLastDrop]);

  return (
    <AnimatePresence>
      {lastDrop && (
        <motion.div
          key={lastDrop.uid}
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="relative rounded-2xl px-6 py-4 flex flex-col items-center gap-2"
            style={{
              background: "rgba(15,10,5,0.92)",
              border: `2px solid ${RARITY_BY_ID[lastDrop.rarity].color}`,
              boxShadow: `0 0 60px ${RARITY_BY_ID[lastDrop.rarity].glow}, 0 0 20px ${RARITY_BY_ID[lastDrop.rarity].color}`,
            }}
            initial={{ scale: 0.3, y: 60, rotate: -8 }}
            animate={{ scale: [0.3, 1.15, 1], y: [60, 0, 0], rotate: [-8, 4, 0] }}
            exit={{ scale: 0.5, opacity: 0, y: -60 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div
              className="text-[10px] uppercase tracking-widest font-mono"
              style={{ color: RARITY_BY_ID[lastDrop.rarity].color }}
            >
              {RARITY_BY_ID[lastDrop.rarity].emoji} {RARITY_BY_ID[lastDrop.rarity].name}
            </div>
            <motion.div
              className="text-5xl"
              style={{ filter: `drop-shadow(0 0 8px ${RARITY_BY_ID[lastDrop.rarity].color})` }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              {lastDrop.emoji}
            </motion.div>
            <div className="text-zinc-200 font-bold text-sm text-center max-w-[220px]">
              {lastDrop.name}
            </div>
            <div
              className="text-xs font-mono"
              style={{ color: RARITY_BY_ID[lastDrop.rarity].color }}
            >
              {lastDrop.value.toLocaleString("ru-RU")} 💰
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
