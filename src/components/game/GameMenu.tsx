"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";

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
  const money = useGameStore((s) => s.money);

  const items = [
    { label: "Апгрейды", sub: money > 0 ? "прокачка кликера" : "", color: "#06b6d4", action: onOpenUpgrades, emoji: "⚒", desc: "5 апгрейдов за монеты" },
    { label: "Задания", sub: "достижения + дейлики", color: "#f59e0b", action: onOpenQuests, emoji: "📜", desc: "16 ачивок, 3 дейлика" },
    { label: "Алтарь", sub: "крафт + жертва", color: "#a855f7", action: onOpenAltar, emoji: "🏛", desc: "5→1, удача за лут" },
    { label: "Магазин", sub: "ключи + бусты", color: "#ef4444", action: onOpenShop, emoji: "🛒", desc: "редкие ключи, удача" },
    { label: "Престиж", sub: prestige.souls > 0 ? `${prestige.souls} душ · ×${(1 + prestige.souls * 0.05).toFixed(2)}` : "сброс ради силы", color: "#7c3aed", action: onOpenPrestige, emoji: "💀", desc: "перманентный множитель" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="gothic-btn px-3 py-2.5 rounded-xl border-2 border-purple-700/40 bg-gradient-to-b from-zinc-800 to-zinc-950 text-purple-200 font-bold text-sm hover:border-purple-500/60 hover:from-zinc-700 transition-all flex items-center gap-1.5 min-h-[44px]"
        aria-label="Меню игры"
        aria-expanded={open}
        style={{ boxShadow: open ? "0 0 15px rgba(168,85,247,0.3)" : "none" }}
      >
        <span className="text-base">☰</span>
        <span className="hidden sm:inline text-xs uppercase tracking-wider">Меню</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden min-w-[240px]"
              style={{
                background: "linear-gradient(135deg, rgba(28,25,35,0.98), rgba(15,13,21,0.98))",
                border: "2px solid rgba(168,85,247,0.3)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.8), 0 0 20px rgba(168,85,247,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {/* Заголовок меню */}
              <div className="px-4 py-2 border-b border-purple-900/30">
                <div className="text-[10px] uppercase tracking-widest text-purple-400/60 font-mono">
                  Меню героя
                </div>
              </div>

              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => { item.action(); setOpen(false); }}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-zinc-800/40 last:border-0 group"
                >
                  {/* Иконка в круге */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 transition-all group-hover:scale-110"
                    style={{
                      background: item.color + "22",
                      border: `1px solid ${item.color}55`,
                    }}
                  >
                    {item.emoji}
                  </div>

                  {/* Текст */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold" style={{ color: item.color }}>
                      {item.label}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono truncate">
                      {item.sub || item.desc}
                    </div>
                  </div>

                  {/* Стрелка */}
                  <span className="text-zinc-700 group-hover:text-zinc-500 transition-colors text-sm">›</span>
                </button>
              ))}

              {/* Подвал меню */}
              <div className="px-4 py-2 border-t border-purple-900/30">
                <div className="text-[9px] text-zinc-600 font-mono text-center uppercase tracking-wider">
                  Сундучный Вор v1.0 · Dark Fantasy
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
