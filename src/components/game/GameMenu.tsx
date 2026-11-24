"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";

// Меню — все кнопки в одном выпадающем списке
// Освобождает ResourceBar от перегрузки

interface Props {
  onOpenShop: () => void;
  onOpenQuests: () => void;
  onOpenAltar: () => void;
  onOpenPrestige: () => void;
  onOpenUpgrades: () => void;
}

export default function GameMenu({ onOpenShop, onOpenQuests, onOpenAltar, onOpenPrestige, onOpenUpgrades }: Props) {
  const [open, setOpen] = useState(false);
  const prestige = useGameStore((s) => s.prestige);

  const items = [
    { label: "⚔ Апгрейды", color: "#06b6d4", action: onOpenUpgrades, emoji: "⚒" },
    { label: "📜 Задания", color: "#f59e0b", action: onOpenQuests, emoji: "📜" },
    { label: "🏛 Алтарь", color: "#a855f7", action: onOpenAltar, emoji: "🏛" },
    { label: "🛒 Магазин", color: "#ef4444", action: onOpenShop, emoji: "🛒" },
    { label: `💀 Престиж${prestige.souls > 0 ? ` (${prestige.souls})` : ""}`, color: "#7c3aed", action: onOpenPrestige, emoji: "💀" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 rounded-xl bg-gradient-to-b from-zinc-700 to-zinc-900 text-zinc-200 font-bold text-sm hover:from-zinc-600 hover:to-zinc-800 transition-colors border border-zinc-600/50 flex items-center gap-1.5"
        aria-label="Меню игры"
        aria-expanded={open}
      >
        <span className="text-base">☰</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Затемнение */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            {/* Меню */}
            <motion.div
              className="absolute right-0 top-full mt-1 z-50 rounded-xl gothic-panel border border-zinc-700/50 overflow-hidden min-w-[180px]"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => { item.action(); setOpen(false); }}
                  className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-white/5 transition-colors flex items-center gap-2 border-b border-zinc-800/50 last:border-0"
                >
                  <span className="text-base">{item.emoji}</span>
                  <span style={{ color: item.color }}>{item.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
