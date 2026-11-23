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
        className="relative w-full h-full rounded-xl cursor-pointer transition-transform overflow-hidden"
        style={{
          border: `2px solid ${visual.accent}`,
          boxShadow: canOpen
            ? `0 0 22px ${visual.accent}cc, 0 0 8px ${visual.accent}99, 0 4px 12px rgba(0,0,0,0.7)`
            : `0 0 8px ${visual.accent}66, 0 4px 8px rgba(0,0,0,0.6)`,
          animation: canOpen ? "chestPulse 1.6s ease-in-out infinite" : "none",
        }}
      >
        {/* AI-картинка сундука с CSS-фильтром для вариации цвета */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('${visual.image}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: visual.filter,
          }}
        />
        {/* затемнение по краям для объёма */}
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle at 50% 35%, transparent 50%, rgba(0,0,0,0.5) 100%)`,
          }}
        />
        {/* цветовой оверлей для интеграции с темой сундука */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{
            background: `linear-gradient(135deg, ${visual.color}99, transparent 50%, ${visual.accent}66)`,
          }}
        />

        {/* замок-глаз поверх картинки (индикатор активности) */}
        <div
          className="absolute left-1/2 top-[35%] -translate-x-1/2 w-[14%] h-[14%] rounded-full pointer-events-none"
          style={{
            background: chest.openingBy ? key.color : `${visual.accent}aa`,
            boxShadow: `0 0 8px ${chest.openingBy ? key.color : visual.accent}`,
            opacity: chest.openingBy ? 1 : 0.7,
          }}
        />

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
                stroke="rgba(0,0,0,0.6)"
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
              className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap z-10"
              style={{ background: key.color, color: "#000" }}
            >
              {key.name}
            </div>
            {/* искры от ключа — разлетаются от замка вверх в цвете ключа */}
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute left-1/2 top-[35%] rounded-full"
                  style={{
                    width: 2 + (i % 2),
                    height: 2 + (i % 2),
                    background: key.color,
                    boxShadow: `0 0 4px ${key.color}`,
                    animation: `keySpark ${0.8 + i * 0.15}s ease-out ${i * 0.1}s infinite`,
                    ["--spark-dx" as string]: `${(i - 2) * 14}px`,
                    ["--spark-dy" as string]: `${-20 - i * 6}px`,
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* подсказка "не проявился" */}
        {!isFullyVisible && !chest.opened && (
          <div className="absolute inset-0 flex items-center justify-center text-[9px] text-white/70 font-mono pointer-events-none bg-black/40">
            проявляется...
          </div>
        )}
        {/* подсказка "нет ключей" */}
        {isFullyVisible && keysCount === 0 && !chest.opened && (
          <div className="absolute inset-0 flex items-center justify-center text-[9px] text-red-300/90 font-mono pointer-events-none text-center px-1 bg-black/50">
            нет ключа
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes chestPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes keySpark {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--spark-dx, 0), var(--spark-dy, -30px)) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
    </motion.div>
  );
}
