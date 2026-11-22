"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { SPAWN_INTERVAL_MS } from "@/lib/game/config";
import Chest from "./Chest";

export default function ChestField() {
  const chests = useGameStore((s) => s.chests);
  const spawnChestTick = useGameStore((s) => s.spawnChestTick);
  const pruneChests = useGameStore((s) => s.pruneChests);

  // цикл спавна
  useEffect(() => {
    const spawnTimer = setInterval(() => {
      spawnChestTick();
    }, SPAWN_INTERVAL_MS);
    // сразу один на старте, если пусто
    if (chests.length === 0) {
      spawnChestTick();
      setTimeout(() => spawnChestTick(), 600);
      setTimeout(() => spawnChestTick(), 1400);
    }
    return () => clearInterval(spawnTimer);
  }, []);

  // цикл очистки истёкших
  useEffect(() => {
    const pruneTimer = setInterval(() => {
      pruneChests(Date.now());
    }, 800);
    return () => clearInterval(pruneTimer);
  }, [pruneChests]);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-amber-900/40"
      style={{
        minHeight: 360,
        height: "min(60vh, 520px)",
        background:
          "radial-gradient(ellipse at 50% 110%, #2a1d12 0%, #150e08 60%, #070504 100%)",
        boxShadow: "inset 0 0 60px rgba(0,0,0,0.6)",
      }}
    >
      {/* мерцающие частицы пыли */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-amber-200/30"
            style={{
              width: 1 + (i % 3),
              height: 1 + (i % 3),
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              animation: `dustFloat ${6 + (i % 5)}s ease-in-out ${i * 0.4}s infinite alternate`,
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
      <div className="absolute top-2 left-3 text-[10px] uppercase tracking-widest text-amber-200/50 font-mono pointer-events-none">
        Зажми сундук выбранным ключом
      </div>
      <div className="absolute bottom-2 right-3 text-[10px] uppercase tracking-widest text-amber-200/40 font-mono pointer-events-none">
        на поле: {chests.length}
      </div>

      <style jsx>{`
        @keyframes dustFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0.1; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-30px) translateX(8px); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}
