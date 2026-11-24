"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";

// Онбординг — 3 шага при первом заходе. Сохраняется в localStorage.
const ONBOARDING_KEY = "chest-thief-onboarded";

interface Step {
  title: string;
  text: string;
  emoji: string;
  color: string;
}

const STEPS: Step[] = [
  {
    title: "Бей воришку",
    text: "Кликай по портрету — из воришки выпадают ключи. Чем больше кликов, тем больше ключей.",
    emoji: "🏹",
    color: "#dc2626",
  },
  {
    title: "Открывай сундуки",
    text: "Выбери ключ внизу, зажми палец на сундуке — он откроется. Из сундуков падает лут 7 редкостей.",
    emoji: "📦",
    color: "#fbbf24",
  },
  {
    title: "Одевай героя",
    text: "Лут — в кладовой. Продавай лишнее, надевай лучшее. Герой автоматически бьёт врагов в склепе.",
    emoji: "⚔",
    color: "#a855f7",
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done) requestAnimationFrame(() => setShow(true));
    } catch {
      requestAnimationFrame(() => setShow(true));
    }
  }, []);

  const handleClose = () => {
    try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
    setShow(false);
  };

  if (!show) return null;
  const current = STEPS[step];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl gothic-panel p-5 border-2"
            style={{ borderColor: current.color + "55" }}
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Прогресс */}
            <div className="flex gap-1 mb-4">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full transition-all"
                  style={{
                    background: i <= step ? current.color : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>

            {/* Контент */}
            <div className="text-center mb-4">
              <motion.div
                className="text-4xl mb-2"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {current.emoji}
              </motion.div>
              <h2 className="text-lg font-bold mb-1" style={{ color: current.color }}>
                {current.title}
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {current.text}
              </p>
            </div>

            {/* Кнопки */}
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-3 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Пропустить
              </button>
              <button
                onClick={() => {
                  if (step < STEPS.length - 1) setStep(step + 1);
                  else handleClose();
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all"
                style={{ background: current.color }}
              >
                {step < STEPS.length - 1 ? "Далее →" : "Поехали! 🎮"}
              </button>
            </div>

            {/* Шаг */}
            <div className="text-center text-[10px] text-zinc-600 mt-2">
              Шаг {step + 1} из {STEPS.length}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
