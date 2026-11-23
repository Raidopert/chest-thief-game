"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { EVENT_CONFIG } from "@/lib/game/config";

// Баннер активных событий — показывается поверх вкладок при активном ивенте
export default function EventBanner() {
  const events = useGameStore((s) => s.events);
  const chests = useGameStore((s) => s.chests);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const invasionActive = events.demonInvasionUntil > 0 && now < events.demonInvasionUntil;
  const invasionRemaining = invasionActive ? Math.max(0, events.demonInvasionUntil - now) : 0;
  const invasionSecs = Math.ceil(invasionRemaining / 1000);

  const goldenChestOnField = chests.some((c) => c.isGolden && !c.opened);

  const nextInvasionIn = !invasionActive ? Math.max(0, events.nextDemonInvasion - now) : 0;
  const nextInvasionMins = Math.floor(nextInvasionIn / 60000);
  const nextInvasionSecs = Math.floor((nextInvasionIn % 60000) / 1000);

  return (
    <div className="flex flex-col gap-1.5">
      <AnimatePresence>
        {invasionActive && (
          <motion.div
            key="invasion"
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border-2 border-red-600 bg-gradient-to-r from-red-950 to-red-900/80 px-3 py-2 flex items-center gap-2 shadow-[0_0_25px_rgba(220,38,38,0.5)]"
          >
            <motion.span className="text-xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
              🔥
            </motion.span>
            <div className="flex-1">
              <div className="text-red-200 font-bold text-xs uppercase tracking-wider">
                ВТОРЖЕНИЕ ДЕМОНОВ
              </div>
              <div className="text-red-400/70 text-[10px] font-mono">
                ×{EVENT_CONFIG.demonRewardMult} награды · ×{EVENT_CONFIG.demonHpMult} HP врагов
              </div>
            </div>
            <div className="text-red-300 font-black text-lg font-mono tabular-nums">
              {invasionSecs}s
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {goldenChestOnField && (
          <motion.div
            key="golden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="rounded-xl border-2 border-yellow-500 bg-gradient-to-r from-yellow-950 to-amber-900/60 px-3 py-2 flex items-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.4)]"
          >
            <motion.span className="text-xl" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1, repeat: Infinity }}>
              🥚
            </motion.span>
            <div className="flex-1">
              <div className="text-yellow-200 font-bold text-xs uppercase tracking-wider">
                Золотой сундук на поле!
              </div>
              <div className="text-yellow-400/70 text-[10px] font-mono">
                Гарантированный epic+ лут · открой любым ключом
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Таймер до следующего вторжения */}
      {!invasionActive && nextInvasionIn > 0 && nextInvasionIn < 120_000 && (
        <div className="rounded-lg border border-red-900/30 bg-red-950/20 px-2.5 py-1.5 flex items-center gap-2">
          <span className="text-sm">🔥</span>
          <span className="text-red-400/80 text-[10px] font-mono">
            Вторжение через {nextInvasionMins}:{nextInvasionSecs.toString().padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}
