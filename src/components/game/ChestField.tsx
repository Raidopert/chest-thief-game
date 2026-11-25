"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import Chest from "./Chest";

export default function ChestField() {
  const chests = useGameStore((s) => s.chests);
  const pruneChests = useGameStore((s) => s.pruneChests);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const pruneTimer = setInterval(() => {
      pruneChests(Date.now());
    }, 800);
    return () => clearInterval(pruneTimer);
  }, [pruneChests]);

  // Параллакс — двигаем фон при движении мыши
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({ x: cx * 20, y: cy * 15 });
  };

  const handleMouseLeave = () => {
    setParallax({ x: 0, y: 0 });
  };

  return (
    <div
      ref={fieldRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full rounded-2xl overflow-hidden gothic-panel scene-vignette"
      style={{
        minHeight: 320,
        height: "min(55vh, 480px)",
      }}
    >
      {/* Параллакс фон — 3 слоя */}
      <div
        className="absolute inset-0 transition-transform duration-200 ease-out"
        style={{
          backgroundImage: "url('bg/field-bg-new.png')",
          backgroundSize: "120%",
          backgroundPosition: "center",
          transform: `translate(${parallax.x}px, ${parallax.y}px)`,
        }}
      />
      {/* Слой тумана — двигается медленнее */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 60%, rgba(168,85,247,0.08) 0%, transparent 60%)",
          transform: `translate(${parallax.x * 0.5}px, ${parallax.y * 0.5}px)`,
        }}
      />

      {/* Тёмная виньетка для контраста сундуков */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/75 pointer-events-none" />

      {/* Каменная текстура поверх */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent 0px, transparent 40px, rgba(0,0,0,0.3) 40px, rgba(0,0,0,0.3) 41px), repeating-linear-gradient(90deg, transparent 0px, transparent 60px, rgba(0,0,0,0.2) 60px, rgba(0,0,0,0.2) 61px)",
      }} />

      {/* Мерцающие искры/пепел */}
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
              transform: `translate(${parallax.x * 0.3}px, ${parallax.y * 0.3}px)`,
            }}
          />
        ))}
      </div>

      {/* Сундуки */}
      <AnimatePresence>
        {chests.map((c) => (
          <Chest key={c.id} chest={c} />
        ))}
      </AnimatePresence>

      {/* Заголовок */}
      <div className="absolute top-2 left-3 text-xs uppercase tracking-widest text-zinc-300 gothic-font pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
        Зажми сундук ключом
      </div>
      <div className="absolute bottom-2 right-3 text-xs uppercase tracking-widest text-zinc-400 font-mono pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
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
