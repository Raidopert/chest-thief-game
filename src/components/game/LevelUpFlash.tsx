"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { Sounds } from "./Sound";

// Золотая вспышка при повышении уровня героя
export default function LevelUpFlash() {
  const heroLevel = useGameStore((s) => s.battle.heroLevel);
  const prevLevel = useRef(heroLevel);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (heroLevel > prevLevel.current) {
      Sounds.levelUp();
      if (navigator.vibrate) navigator.vibrate([30, 50, 30, 50, 80]);
      requestAnimationFrame(() => setShow(true));
      const t = setTimeout(() => setShow(false), 1200);
      return () => clearTimeout(t);
    }
    prevLevel.current = heroLevel;
  }, [heroLevel]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[58] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, times: [0, 0.2, 1] }}
        >
          {/* Золотая вспышка по краям */}
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at center, transparent 30%, rgba(251,191,36,0.3) 70%, rgba(251,191,36,0.5) 100%)",
            }}
          />
          {/* Текст LEVEL UP */}
          <motion.div
            className="relative gothic-font"
            initial={{ scale: 0.5, y: 30, opacity: 0 }}
            animate={{ scale: [0.5, 1.2, 1], y: [30, 0, -10], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, times: [0, 0.3, 1] }}
          >
            <div className="text-center">
              <div className="text-5xl mb-1" style={{ filter: "drop-shadow(0 0 15px #fbbf24)" }}>
                ⬆
              </div>
              <div
                className="text-2xl font-black uppercase tracking-widest"
                style={{ color: "#fbbf24", textShadow: "0 0 20px rgba(251,191,36,0.8), 0 2px 4px rgba(0,0,0,0.9)" }}
              >
                Уровень {heroLevel}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
