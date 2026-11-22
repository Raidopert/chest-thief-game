"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import Chest from "./Chest";

export default function ChestField() {
  const chests = useGameStore((s) => s.chests);
  const pruneChests = useGameStore((s) => s.pruneChests);

  // Лёгкая очистка истёкших сундуков — спавн идёт в page.tsx
  useEffect(() => {
    const pruneTimer = setInterval(() => {
      pruneChests(Date.now());
    }, 800);
    return () => clearInterval(pruneTimer);
  }, [pruneChests]);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-zinc-700"
      style={{
        minHeight: 320,
        height: "min(55vh, 480px)",
        background:
          "radial-gradient(ellipse at 50% 20%, #2a2530 0%, #15131c 50%, #08060a 100%)",
        boxShadow: "inset 0 0 80px rgba(0,0,0,0.8)",
      }}
    >
      {/* каменные блоки фона склепа */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 60" preserveAspectRatio="none">
        <g opacity="0.25">
          {[0, 10, 20, 30, 40, 50].map((y, i) => (
            <g key={y}>
              {[0, 12, 24, 36, 48, 60, 72, 84, 96].map((x, j) => (
                <rect
                  key={x}
                  x={x + (i % 2 === 0 ? 0 : 6)}
                  y={y}
                  width={11.5}
                  height={9.5}
                  fill="#1a1a22"
                  stroke="#0a0a0f"
                  strokeWidth="0.2"
                />
              ))}
            </g>
          ))}
        </g>
        {/* трещины */}
        <path d="M 20 0 L 22 8 L 19 15 L 23 22" stroke="#0a0a0f" strokeWidth="0.3" fill="none" opacity="0.5" />
        <path d="M 70 25 L 73 32 L 68 40" stroke="#0a0a0f" strokeWidth="0.3" fill="none" opacity="0.5" />
        {/* пятна крови на стене */}
        <ellipse cx="35" cy="35" rx="2" ry="3" fill="#7f1d1d" opacity="0.3" />
        <ellipse cx="65" cy="20" rx="1.5" ry="2" fill="#7f1d1d" opacity="0.25" />
      </svg>

      {/* мерцающие искры/пепел */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: 1 + (i % 3),
              height: 1 + (i % 3),
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              background: i % 4 === 0 ? "#dc2626" : "#fbbf24",
              opacity: 0.4,
              animation: `emberFloat ${6 + (i % 5)}s ease-in-out ${i * 0.4}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* сундуки */}
      <AnimatePresence>
        {chests.map((c) => (
          <Chest key={c.id} chest={c} />
        ))}
      </AnimatePresence>

      {/* заголовок-подсказка */}
      <div className="absolute top-2 left-3 text-[10px] uppercase tracking-widest text-zinc-400 font-mono pointer-events-none">
        Зажми сундук ключом
      </div>
      <div className="absolute bottom-2 right-3 text-[10px] uppercase tracking-widest text-zinc-500 font-mono pointer-events-none">
        на поле: {chests.length}
      </div>

      <style jsx>{`
        @keyframes emberFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0.1; }
          50% { opacity: 0.7; }
          100% { transform: translateY(-30px) translateX(8px); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}
