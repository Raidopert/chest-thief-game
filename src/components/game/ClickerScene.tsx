"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { KEY_TYPES } from "@/lib/game/config";

// SVG: длинноносый грязный воришка-бомжа, которого душит тетива лука
// Клик по картинке = клик по кликеру

interface FloatNumber {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

let floatCounter = 0;

export default function ClickerScene() {
  const clickClicker = useGameStore((s) => s.clickClicker);
  const totalClicks = useGameStore((s) => s.stats.totalClicks);
  const [floats, setFloats] = useState<FloatNumber[]>([]);
  const [vibrate, setVibrate] = useState(false);
  const lastDropRef = useGameStore((s) => s.lastDrop);
  const [recentDrops, setRecentDrops] = useState<
    { id: number; key: string; color: string }[]
  >([]);
  const dropIdRef = useRef(0);

  // отслеживаем новый ключ
  useEffect(() => {
    // без действия, просто чтобы перерисовать
  }, [lastDropRef]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { droppedKey } = clickClicker();

    if (droppedKey) {
      const kt = KEY_TYPES.find((k) => k.id === droppedKey)!;
      const fid = ++floatCounter;
      setFloats((prev) => [
        ...prev,
        { id: fid, x, y, text: `+1 ${kt.name}`, color: kt.color },
      ]);
      setTimeout(() => {
        setFloats((prev) => prev.filter((f) => f.id !== fid));
      }, 1100);
      const did = ++dropIdRef.current;
      setRecentDrops((prev) =>
        [{ id: did, key: kt.name, color: kt.color }, ...prev].slice(0, 6),
      );
      setTimeout(() => {
        setRecentDrops((prev) => prev.filter((d) => d.id !== did));
      }, 3500);
    } else {
      const fid = ++floatCounter;
      const msgs = ["хрясь!", "кровь!", "душу!", "сила!", "ключ!"];
      setFloats((prev) => [
        ...prev,
        {
          id: fid,
          x,
          y,
          text: msgs[Math.floor(Math.random() * msgs.length)],
          color: "#9ca3af",
        },
      ]);
      setTimeout(() => {
        setFloats((prev) => prev.filter((f) => f.id !== fid));
      }, 900);
    }

    setVibrate(true);
    setTimeout(() => setVibrate(false), 90);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleClick}
        aria-label="Бей воришку"
        className="relative rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-[0_0_30px_rgba(220,38,38,0.35)] select-none touch-manipulation active:scale-[0.98] transition-transform cursor-pointer"
        style={{
          width: "100%",
          maxWidth: 280,
          aspectRatio: "1 / 1",
          backgroundImage: "url('/bg/clicker-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* тёмная подложка поверх PNG для контраста */}
        <div className="absolute inset-0 bg-black/55 pointer-events-none" />

        {/* === AI-портрет воришки с демоническим луком === */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url('/bg/thief-portrait.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: vibrate ? "translate(2px, -1px)" : "translate(0, 0)",
            transition: "transform 0.05s",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.6))",
          }}
        />

        {/* SVG-оверлей: эффекты поверх портрета */}
        <svg
          viewBox="0 0 400 400"
          className="absolute inset-0 w-full h-full block pointer-events-none"
          style={{ transform: vibrate ? "translateX(2px)" : "translateX(0)" }}
        >
          <defs>
            <radialGradient id="bloodGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* свечение крови на шее воришки — подсвечивает где давит лук */}
          <circle cx="200" cy="200" r="60" fill="url(#bloodGlow)" opacity={vibrate ? 0.85 : 0.25} />

          {/* вспышка при выпадении ключа */}
          {vibrate && (
            <circle cx="105" cy="305" r="30" fill="#fbbf24" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0;0.3" dur="0.4s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>

        {/* всплывающие числа */}
        <div className="pointer-events-none absolute inset-0">
          <AnimatePresence>
            {floats.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 1, y: 0, scale: 0.8 }}
                animate={{ opacity: 0, y: -60, scale: 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute font-bold text-sm whitespace-nowrap"
                style={{
                  left: f.x,
                  top: f.y,
                  color: f.color,
                  textShadow: "0 1px 2px rgba(0,0,0,0.9)",
                }}
              >
                {f.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* подсказка */}
        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
          Бей воришку — получай ключи
        </div>
      </button>

      {/* последние выпавшие ключи */}
      <div className="min-h-[20px] flex flex-wrap gap-1 justify-center max-w-[280px]">
        <AnimatePresence>
          {recentDrops.map((d) => (
            <motion.span
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: d.color + "33", color: d.color, border: `1px solid ${d.color}55` }}
            >
              {d.key}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="text-[11px] text-zinc-400 font-mono">
        Всего кликов: <span className="text-zinc-200 font-bold">{totalClicks}</span>
      </div>
    </div>
  );
}
