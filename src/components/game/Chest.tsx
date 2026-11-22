"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { CHEST_VISUALS, KEY_BY_ID } from "@/lib/game/config";
import type { SpawnedChest } from "@/lib/game/config";

interface Props {
  chest: SpawnedChest;
}

export default function Chest({ chest }: Props) {
  const startOpening = useGameStore((s) => s.startOpening);
  const cancelOpening = useGameStore((s) => s.cancelOpening);
  const updateOpeningProgress = useGameStore((s) => s.updateOpeningProgress);
  const completeOpening = useGameStore((s) => s.completeOpening);
  const selectedKey = useGameStore((s) => s.selectedKey);
  const keysCount = useGameStore((s) => s.keys[selectedKey]);

  const [now, setNow] = useState(Date.now());
  const rafRef = useRef<number | null>(null);
  const holdingRef = useRef(false);
  const openStartRef = useRef<number>(0);

  // обновляем now для прозрачности
  useEffect(() => {
    let raf: number;
    const tick = () => {
      setNow(Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const age = now - chest.spawnAt;
  const fadeProgress = Math.min(1, age / chest.fadeMs);
  const isFullyVisible = fadeProgress >= 1;
  const isExpired = age > chest.fadeMs + chest.lifeMs;

  // прозрачность: 0 → 1 в фазе появления, потом 1, в конце жизни начинает затухать
  let opacity = fadeProgress;
  if (isFullyVisible) {
    const lifeProgress = (age - chest.fadeMs) / chest.lifeMs;
    // последние 15% жизни — затухание
    if (lifeProgress > 0.85) {
      opacity = Math.max(0, 1 - (lifeProgress - 0.85) / 0.15);
    }
  }

  const visual = CHEST_VISUALS.find((v) => v.id === chest.visual)!;
  const key = KEY_BY_ID[selectedKey];
  const canOpen = isFullyVisible && !isExpired && keysCount > 0 && !chest.opened;

  // удержание для открытия
  useEffect(() => {
    if (!chest.openingBy) {
      holdingRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    // запускаем RAF прогресса
    const holdTime = KEY_BY_ID[chest.openingBy].holdTimeMs;
    openStartRef.current = Date.now();
    holdingRef.current = true;
    const tick = () => {
      if (!holdingRef.current) return;
      const elapsed = Date.now() - openStartRef.current;
      const p = Math.min(1, elapsed / holdTime);
      updateOpeningProgress(chest.id, p);
      if (p >= 1) {
        completeOpening(chest.id);
        holdingRef.current = false;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [chest.openingBy]);

  const handleDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!canOpen) return;
    startOpening(chest.id);
  };
  const handleUp = () => {
    if (chest.openingBy && !chest.opened) {
      cancelOpening(chest.id);
    }
  };
  const handleLeave = () => {
    if (chest.openingBy && !chest.opened) {
      cancelOpening(chest.id);
    }
  };

  const size = chest.size;

  return (
    <motion.div
      className="absolute select-none touch-none"
      style={{
        left: `${chest.x}%`,
        top: `${chest.y}%`,
        width: size,
        height: size,
        opacity,
        transform: "translate(-50%, -50%)",
        zIndex: chest.opened ? 50 : 10 + Math.floor(chest.y),
      }}
      initial={false}
      animate={
        chest.opened
          ? { scale: [1, 1.35, 0], rotate: [0, 8, -8, 0], opacity: [1, 1, 0] }
          : { scale: 1 }
      }
      transition={{ duration: chest.opened ? 0.6 : 0.15 }}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={handleLeave}
      onPointerCancel={handleUp}
    >
      <div
        className="relative w-full h-full rounded-xl cursor-pointer transition-transform"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${visual.accent}44, ${visual.color})`,
          border: `2px solid ${visual.accent}`,
          boxShadow: canOpen
            ? `0 0 18px ${visual.accent}99, inset 0 0 12px rgba(0,0,0,0.5)`
            : `0 0 6px ${visual.accent}55, inset 0 0 12px rgba(0,0,0,0.5)`,
        }}
      >
        {/* крышка сундука */}
        <div
          className="absolute left-0 right-0 top-0 h-[45%] rounded-t-xl"
          style={{
            background: `linear-gradient(180deg, ${visual.accent}, ${visual.color})`,
            borderBottom: `2px solid ${visual.accent}`,
          }}
        />
        {/* замок */}
        <div
          className="absolute left-1/2 top-[35%] -translate-x-1/2 w-[22%] h-[22%] rounded-md"
          style={{
            background: chest.openingBy ? key.color : "#fbbf24",
            boxShadow: `0 0 6px ${chest.openingBy ? key.color : "#fbbf24"}aa`,
          }}
        />
        {/* обрамление по углам */}
        {[
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 0, y: 100 },
          { x: 100, y: 100 },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: "translate(-50%, -50%)",
              background: visual.accent,
            }}
          />
        ))}

        {/* прогресс удержания */}
        {chest.openingBy && !chest.opened && (
          <>
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="rgba(0,0,0,0.5)"
                strokeWidth="4"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke={key.color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${chest.openProgress * 289} 289`}
                style={{ transition: "stroke-dasharray 50ms linear" }}
              />
            </svg>
            <div
              className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap"
              style={{ background: key.color, color: "#000" }}
            >
              {key.name}
            </div>
          </>
        )}

        {/* подсказка "не проявился" */}
        {!isFullyVisible && !chest.opened && (
          <div className="absolute inset-0 flex items-center justify-center text-[9px] text-white/60 font-mono pointer-events-none">
            проявляется...
          </div>
        )}
        {/* подсказка "нет ключей" */}
        {isFullyVisible && keysCount === 0 && !chest.opened && (
          <div className="absolute inset-0 flex items-center justify-center text-[9px] text-red-300/80 font-mono pointer-events-none text-center px-1">
            нет ключа
          </div>
        )}
      </div>
    </motion.div>
  );
}
