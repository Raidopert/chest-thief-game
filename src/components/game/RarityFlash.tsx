"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { RARITY_BY_ID, type RarityId } from "@/lib/game/config";

// Вспышка по экрану при выпадении rare+ предмета (как в Diablo)
export default function RarityFlash() {
  const lastDrop = useGameStore((s) => s.lastDrop);
  const [flash, setFlash] = useState<{ color: string; emoji: string } | null>(null);

  useEffect(() => {
    if (!lastDrop) return;
    const rank = ["common","uncommon","rare","epic","legendary","mythic","divine"].indexOf(lastDrop.rarity);
    if (rank < 2) return; // только rare+
    const r = RARITY_BY_ID[lastDrop.rarity as RarityId];
    requestAnimationFrame(() => setFlash({ color: r.color, emoji: r.emoji }));
    const t = setTimeout(() => setFlash(null), 800);
    return () => clearTimeout(t);
  }, [lastDrop]);

  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          className="fixed inset-0 z-[55] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, times: [0, 0.3, 1] }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, ${flash.color}44 0%, transparent 70%)`,
            }}
          />
          <motion.div
            className="text-6xl relative z-10"
            initial={{ scale: 0.5, rotate: -15 }}
            animate={{ scale: [0.5, 1.5, 1], rotate: [-15, 5, 0] }}
            transition={{ duration: 0.5 }}
            style={{ filter: `drop-shadow(0 0 20px ${flash.color})` }}
          >
            {flash.emoji}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
