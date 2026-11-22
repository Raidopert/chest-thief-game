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

        {/* фон — готический склеп (SVG поверх PNG) */}
        <svg
          viewBox="0 0 400 400"
          className="absolute inset-0 w-full h-full block"
          style={{ transform: vibrate ? "translateX(2px)" : "translateX(0)" }}
        >
          <defs>
            <linearGradient id="demonBow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1c1c25" />
              <stop offset="40%" stopColor="#3a2a3a" />
              <stop offset="60%" stopColor="#5a2a3a" />
              <stop offset="100%" stopColor="#1c1c25" />
            </linearGradient>
            <linearGradient id="plagueCloak" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a2a35" />
              <stop offset="100%" stopColor="#0f0f15" />
            </linearGradient>
            <radialGradient id="torchGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#dc2626" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="bloodGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* === ЧУМНОЙ ВОРИШКА В КАПЮШОНЕ === */}
          <g>
            {/* силуэт капюшона и мантии */}
            <path
              d="M 200 110 Q 165 115 158 175 Q 152 220 158 280 Q 165 340 175 365 L 225 365 Q 235 340 242 280 Q 248 220 242 175 Q 235 115 200 110 Z"
              fill="url(#plagueCloak)"
              stroke="#08080d"
              strokeWidth="2"
            />
            {/* капюшон — нависает над лицом */}
            <path
              d="M 200 105 Q 158 115 160 165 Q 162 180 175 188 L 225 188 Q 238 180 240 165 Q 242 115 200 105 Z"
              fill="#0f0f15"
              stroke="#08080d"
              strokeWidth="2"
            />
            {/* тень от капюшона на лице */}
            <ellipse cx="200" cy="175" rx="28" ry="22" fill="#050507" opacity="0.85" />

            {/* лицо — чумное, желтоватое */}
            <ellipse cx="200" cy="178" rx="20" ry="24" fill="#7a6a3a" opacity="0.85" />
            {/* длинный клювовидный нос (как у чумного врача) */}
            <path
              d="M 200 178 Q 215 182 232 200 Q 235 208 228 212 Q 218 210 210 200 Q 204 192 200 188 Z"
              fill="#5a4a2a"
              stroke="#2a1d12"
              strokeWidth="1.5"
            />
            {/* кончик носа */}
            <ellipse cx="232" cy="208" rx="4" ry="3" fill="#3a2a1a" />

            {/* желтые чумные глаза */}
            <ellipse cx="190" cy="170" rx="4" ry="3" fill="#fbbf24" />
            <ellipse cx="190" cy="170" rx="1.5" ry="2" fill="#0a0a0f" />
            <ellipse cx="210" cy="170" rx="4" ry="3" fill="#fbbf24" />
            <ellipse cx="210" cy="170" rx="1.5" ry="2" fill="#0a0a0f" />
            {/* блеск в глазах */}
            <circle cx="191" cy="169" r="0.7" fill="#fff" opacity="0.9" />
            <circle cx="211" cy="169" r="0.7" fill="#fff" opacity="0.9" />

            {/* бровь — злая */}
            <path d="M 184 163 L 196 165" stroke="#0a0a0f" strokeWidth="2" />
            <path d="M 204 165 L 216 163" stroke="#0a0a0f" strokeWidth="2" />

            {/* рот — задыхается, чёрный */}
            <ellipse cx="210" cy="195" rx="6" ry="9" fill="#0a0a0f" stroke="#dc2626" strokeWidth="1" />
            {/* кровь изо рта */}
            <path d="M 210 200 L 208 215 L 206 220" stroke="#dc2626" strokeWidth="1.5" fill="none" />

            {/* заплатки на мантии */}
            <rect x="175" y="240" width="14" height="10" fill="#3a3a45" stroke="#08080d" strokeWidth="1" />
            <rect x="210" y="270" width="12" height="14" fill="#3a3a45" stroke="#08080d" strokeWidth="1" />
            <rect x="195" y="310" width="16" height="10" fill="#3a3a45" stroke="#08080d" strokeWidth="1" />
            {/* рваный край мантии снизу */}
            <path
              d="M 175 360 L 175 370 L 180 365 L 185 370 L 190 365 L 195 370 L 200 365 L 205 370 L 210 365 L 215 370 L 220 365 L 225 370 L 225 360 Z"
              fill="#0f0f15"
              stroke="#08080d"
              strokeWidth="1"
            />
          </g>

          {/* === ДЕМОНИЧЕСКИЙ ЛУК === */}
          <g>
            {/* основная дуга — изогнутая как змея, с шипами */}
            <path
              d="M 118 105 Q 85 200 118 295 Q 200 325 282 295 Q 315 200 282 105 Q 200 75 118 105 Z"
              fill="none"
              stroke="url(#demonBow)"
              strokeWidth="11"
              strokeLinecap="round"
            />
            {/* внутренний контур — блестящий */}
            <path
              d="M 122 118 Q 95 200 122 282 Q 200 312 278 282 Q 305 200 278 118 Q 200 90 122 118 Z"
              fill="none"
              stroke="#5a2a3a"
              strokeWidth="2"
              opacity="0.8"
            />

            {/* шипы на дуге лука */}
            {[
              { x: 90, y: 160, a: -45 },
              { x: 95, y: 240, a: 45 },
              { x: 120, y: 110, a: -75 },
              { x: 120, y: 290, a: 75 },
              { x: 310, y: 160, a: 45 },
              { x: 305, y: 240, a: -45 },
              { x: 280, y: 110, a: 75 },
              { x: 280, y: 290, a: -75 },
            ].map((s, i) => (
              <path
                key={i}
                d="M 0 -8 L 4 0 L 0 8 L -4 0 Z"
                fill="#1c1c25"
                stroke="#0a0a0f"
                strokeWidth="0.8"
                transform={`translate(${s.x},${s.y}) rotate(${s.a})`}
              />
            ))}

            {/* глаз демона в центре верхней дуги */}
            <ellipse cx="200" cy="82" rx="8" ry="5" fill="#0a0a0f" stroke="#dc2626" strokeWidth="1.5" />
            <ellipse cx="200" cy="82" rx="4" ry="3" fill="#dc2626" />
            <ellipse cx="200" cy="82" rx="1.5" ry="2" fill="#fbbf24" />

            {/* тетива — давит на шею */}
            <path
              d="M 122 118 Q 200 215 278 118"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="3 2"
              opacity="0.85"
            />
            {/* кровавый след тетивы на шее */}
            <ellipse
              cx="200"
              cy="210"
              rx="30"
              ry="7"
              fill="none"
              stroke={vibrate ? "#dc2626" : "#7f1d1d"}
              strokeWidth={vibrate ? "4" : "3"}
            />
            {/* кровавые подтёки от тетивы */}
            <path d="M 175 213 L 175 220 M 185 215 L 184 225 M 200 216 L 200 230 M 215 215 L 216 225 M 225 213 L 225 220"
              stroke="#dc2626" strokeWidth="1.2" fill="none" opacity="0.85" />

            {/* рукоятка лука — обмотана кожей */}
            <rect x="194" y="318" width="12" height="44" fill="#3a2a18" stroke="#0a0a0f" strokeWidth="1" rx="2" />
            <path d="M 194 322 L 206 326 M 194 330 L 206 334 M 194 338 L 206 342 M 194 346 L 206 350"
              stroke="#1a1208" strokeWidth="1" />
            {/* навершие — череп */}
            <ellipse cx="200" cy="365" rx="7" ry="5" fill="#e7e5e4" stroke="#0a0a0f" strokeWidth="1" />
            <circle cx="197" cy="364" r="1.2" fill="#0a0a0f" />
            <circle cx="203" cy="364" r="1.2" fill="#0a0a0f" />
          </g>

          {/* рука воришки тянется — выпускает ключ */}
          <g>
            <path
              d="M 165 250 Q 130 270 110 295 Q 100 305 108 312 Q 120 310 130 300 Q 150 282 168 270"
              fill="url(#plagueCloak)"
              stroke="#08080d"
              strokeWidth="1.5"
            />
            {/* костлявая кисть */}
            <ellipse cx="105" cy="305" rx="8" ry="6" fill="#7a6a3a" stroke="#3a2a1a" strokeWidth="1" />
            {/* ржавый ключ в руке */}
            <g transform="translate(100, 305) rotate(-25)">
              <circle cx="0" cy="0" r="6" fill="none" stroke="#854d0e" strokeWidth="2.5" />
              <rect x="5" y="-2" width="14" height="4" fill="#854d0e" />
              <rect x="14" y="2" width="3" height="5" fill="#854d0e" />
              <rect x="18" y="2" width="3" height="3" fill="#854d0e" />
            </g>
          </g>

          {/* свечение — фокус на шее */}
          <circle cx="200" cy="210" r="50" fill="url(#bloodGlow)" opacity={vibrate ? 0.9 : 0.4} />
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
