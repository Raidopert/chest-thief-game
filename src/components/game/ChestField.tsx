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
        backgroundImage: "url('bg/chest-field-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* тёмная подложка для контраста сундуков */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80 pointer-events-none" />

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
              opacity: 0.5,
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
      <div className="absolute top-2 left-3 text-[10px] uppercase tracking-widest text-zinc-300 font-mono pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
        Зажми сундук ключом
      </div>
      <div className="absolute bottom-2 right-3 text-[10px] uppercase tracking-widest text-zinc-400 font-mono pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
        на поле: {chests.length}
      </div>

      <style jsx>{`
        @keyframes emberFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0.1; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-30px) translateX(8px); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}
