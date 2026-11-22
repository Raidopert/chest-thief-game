"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";

// Всплывающее уведомление: достижение, дейлик, крафт, навык
// z-index = z-[70] — выше лут-таблички (z-60) и Shop (z-50)
export default function NoticeToast() {
  const lastNotice = useGameStore((s) => s.lastNotice);
  const clearLastNotice = useGameStore((s) => s.clearLastNotice);

  useEffect(() => {
    if (!lastNotice) return;
    const t = setTimeout(() => clearLastNotice(), 2800);
    return () => clearTimeout(t);
  }, [lastNotice, clearLastNotice]);

  return (
    <AnimatePresence>
      {lastNotice && (
        <motion.div
          key={lastNotice.id}
          className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-[70]"
          initial={{ opacity: 0, y: -40, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div
            className="px-4 py-2.5 rounded-xl flex items-center gap-2 backdrop-blur-md"
            style={{
              background: "rgba(15,13,21,0.95)",
              border: `2px solid ${lastNotice.color}`,
              boxShadow: `0 0 30px ${lastNotice.color}cc, 0 4px 16px rgba(0,0,0,0.7)`,
            }}
          >
            <span className="text-xl" style={{ filter: `drop-shadow(0 0 6px ${lastNotice.color})` }}>
              {lastNotice.emoji}
            </span>
            <span
              className="text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap"
              style={{ color: lastNotice.color }}
            >
              {lastNotice.text}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
