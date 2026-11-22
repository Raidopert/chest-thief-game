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
      const msgs = ["клик!", "хрясь!", "щёлк!", "уф!", "тугo!"];
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
        aria-label="Душить воришку кликом — добыть ключи"
        className="relative rounded-2xl overflow-hidden border-2 border-amber-900/60 shadow-[0_0_30px_rgba(180,83,9,0.45)] select-none touch-manipulation active:scale-[0.98] transition-transform cursor-pointer"
        style={{ width: "100%", maxWidth: 420, aspectRatio: "1 / 1" }}
      >
        {/* фон — тёмный переулок */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full block"
          style={{ transform: vibrate ? "translateX(2px)" : "translateX(0)" }}
        >
          <defs>
            <radialGradient id="alleyBg" cx="50%" cy="60%" r="80%">
              <stop offset="0%" stopColor="#3b2a1a" />
              <stop offset="60%" stopColor="#1f1610" />
              <stop offset="100%" stopColor="#0a0705" />
            </radialGradient>
            <linearGradient id="bowWood" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5b3a1a" />
              <stop offset="50%" stopColor="#a06a2e" />
              <stop offset="100%" stopColor="#5b3a1a" />
            </linearGradient>
            <linearGradient id="skinGrime" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8a7a52" />
              <stop offset="100%" stopColor="#4a3a22" />
            </linearGradient>
          </defs>

          <rect width="400" height="400" fill="url(#alleyBg)" />

          {/* кирпичная стена */}
          <g opacity="0.25">
            {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((y, i) => (
              <g key={y}>
                {[0, 60, 120, 180, 240, 300, 360].map((x, j) => (
                  <rect
                    key={x}
                    x={x + (i % 2 === 0 ? 0 : 30)}
                    y={y}
                    width={56}
                    height={36}
                    fill="#2a1d12"
                    stroke="#1a1208"
                    strokeWidth="1"
                  />
                ))}
              </g>
            ))}
          </g>

          {/* мусор на земле */}
          <g opacity="0.5">
            <ellipse cx="60" cy="380" rx="40" ry="8" fill="#1a1208" />
            <ellipse cx="340" cy="385" rx="50" ry="9" fill="#1a1208" />
            <rect x="40" y="370" width="20" height="14" fill="#3a2a18" rx="2" />
            <rect x="320" y="372" width="22" height="12" fill="#3a2a18" rx="2" />
          </g>

          {/* длинноносый воришка-бомжа */}
          <g>
            {/* тело — грязная одеяние */}
            <path
              d="M 200 200 Q 175 220 168 290 L 175 360 L 225 360 L 232 290 Q 225 220 200 200 Z"
              fill="#4a3a22"
              stroke="#2a1d12"
              strokeWidth="2"
            />
            {/* заплатки */}
            <rect x="178" y="240" width="14" height="10" fill="#6a5a3a" stroke="#3a2a18" strokeWidth="1" />
            <rect x="210" y="270" width="12" height="14" fill="#6a5a3a" stroke="#3a2a18" strokeWidth="1" />
            <rect x="195" y="310" width="16" height="10" fill="#6a5a3a" stroke="#3a2a18" strokeWidth="1" />

            {/* голова — тоже грязная */}
            <ellipse cx="200" cy="170" rx="32" ry="36" fill="url(#skinGrime)" stroke="#3a2a22" strokeWidth="2" />
            {/* всклокоченные волосы/борода */}
            <path
              d="M 168 152 Q 170 138 200 134 Q 230 138 232 152 Q 235 162 228 168 Q 215 158 200 156 Q 185 158 172 168 Q 165 162 168 152 Z"
              fill="#2a1d12"
              stroke="#1a1208"
              strokeWidth="1"
            />
            {/* длинный нос */}
            <path
              d="M 200 178 Q 222 182 240 200 Q 244 210 236 214 Q 226 212 218 202 Q 208 192 200 188 Z"
              fill="url(#skinGrime)"
              stroke="#3a2a22"
              strokeWidth="1.5"
            />
            {/* нос-кончик */}
            <circle cx="240" cy="208" r="4" fill="#7a6a42" stroke="#3a2a22" strokeWidth="1" />

            {/* глаза — хитрые */}
            <ellipse cx="190" cy="170" rx="3" ry="2" fill="#1a1208" />
            <ellipse cx="208" cy="170" rx="3" ry="2" fill="#1a1208" />
            {/* бровь */}
            <path d="M 184 162 Q 192 158 200 162" stroke="#2a1d12" strokeWidth="2" fill="none" />
            <path d="M 200 162 Q 208 158 216 162" stroke="#2a1d12" strokeWidth="2" fill="none" />

            {/* рот — задыхается */}
            <ellipse cx="206" cy="190" rx="6" ry="8" fill="#2a0808" stroke="#1a1208" strokeWidth="1" />
            {/* язык */}
            <ellipse cx="206" cy="193" rx="3" ry="4" fill="#7a2a2a" />
          </g>

          {/* ЛУК — огибает шею воришки, тетива давит */}
          <g>
            {/* дуга лука сверху-слева, огибает шею, вниз-справа */}
            <path
              d="M 120 110 Q 90 200 120 290 Q 200 320 280 290 Q 310 200 280 110 Q 200 80 120 110 Z"
              fill="none"
              stroke="url(#bowWood)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* внутренний контур дуги */}
            <path
              d="M 130 125 Q 105 200 130 275 Q 200 305 270 275 Q 295 200 270 125 Q 200 95 130 125 Z"
              fill="none"
              stroke="#3a2a18"
              strokeWidth="2"
            />

            {/* тетива — давит на шею воришки */}
            <path
              d="M 130 125 Q 200 215 270 125"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            {/* утолщение тетивы на шее — визуализация давления */}
            <ellipse
              cx="200"
              cy="208"
              rx="32"
              ry="6"
              fill="none"
              stroke={vibrate ? "#fca5a5" : "#e5e7eb"}
              strokeWidth={vibrate ? "4" : "3"}
            />
            {/* следы давления на шее */}
            <path
              d="M 175 205 Q 200 200 225 205"
              stroke="#7a2a2a"
              strokeWidth="1.5"
              fill="none"
              opacity="0.7"
            />
            <path
              d="M 175 212 Q 200 208 225 212"
              stroke="#7a2a2a"
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
            />

            {/* рукоятка лука */}
            <rect x="195" y="320" width="10" height="40" fill="#5b3a1a" stroke="#2a1d12" strokeWidth="1" rx="2" />
            <rect x="190" y="358" width="20" height="6" fill="#3a2a18" rx="1" />
          </g>

          {/* рука воришки тянется — выпускает ключ */}
          <g>
            <path
              d="M 168 250 Q 130 270 110 290 Q 100 295 105 305 Q 115 305 125 295 Q 145 280 168 268"
              fill="url(#skinGrime)"
              stroke="#3a2a22"
              strokeWidth="1.5"
            />
            {/* ключик в руке */}
            <g transform="translate(100, 290) rotate(-25)">
              <circle cx="0" cy="0" r="6" fill="none" stroke="#d97706" strokeWidth="2" />
              <rect x="5" y="-2" width="14" height="4" fill="#d97706" />
              <rect x="14" y="2" width="3" height="5" fill="#d97706" />
              <rect x="18" y="2" width="3" height="3" fill="#d97706" />
            </g>
          </g>

          {/* светимость — фокус на шее */}
          <circle cx="200" cy="208" r="40" fill="#fca5a5" opacity={vibrate ? 0.25 : 0.08} />
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
        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] uppercase tracking-wider text-amber-200/70 font-medium">
          Кликай — души воришку — получай ключи
        </div>
      </button>

      {/* последние выпавшие ключи */}
      <div className="min-h-[24px] flex flex-wrap gap-1 justify-center max-w-[420px]">
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

      <div className="text-[11px] text-amber-200/60 font-mono">
        Всего кликов: <span className="text-amber-200 font-bold">{totalClicks}</span>
      </div>
    </div>
  );
}
