"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";

export default function QuickSellFab() {
  const inventory = useGameStore((s) => s.inventory);
  const sellAllByRarity = useGameStore((s) => s.sellAllByRarity);
  const selectedKey = useGameStore((s) => s.selectedKey);

  const commonStacks = inventory.filter((s) => s.rarity === "common");
  const commonCount = commonStacks.reduce((s, st) => s + st.count, 0);
  const commonValue = commonStacks.reduce((s, st) => s + st.baseValue * st.count, 0);

  if (commonCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        onClick={() => sellAllByRarity("common")}
        className="fab gothic-ornate-btn bg-emerald-800 hover:bg-emerald-700 text-emerald-100"
        title={`Продать ${commonCount} common за ${commonValue}💰`}
      >
        <span className="text-base">💰</span>
        <span>Продать common ({commonValue.toLocaleString("ru-RU")}💰)</span>
      </motion.button>
    </AnimatePresence>
  );
}
