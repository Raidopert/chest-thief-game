"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sounds } from "./Sound";
import { useGameStore } from "@/lib/game/store";
import { KEY_TYPES } from "@/lib/game/config";

interface FloatNumber { id: number; x: number; y: number; text: string; color: string; }
let floatCounter = 0;

export default function ClickerScene() {
  const clickClicker = useGameStore((s) => s.clickClicker);
  const totalClicks = useGameStore((s) => s.stats.totalClicks);
  const [floats, setFloats] = useState<FloatNumber[]>([]);
  const [vibrate, setVibrate] = useState(false);
  const [recentDrops, setRecentDrops] = useState<{ id: number; key: string; color: string }[]>([]);
  const dropIdRef = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { droppedKey } = clickClicker();

    if (droppedKey) {
      const kt = KEY_TYPES.find((k) => k.id === droppedKey)!;
      const fid = ++floatCounter;
      setFloats((prev) => [...prev, { id: fid, x, y, text: `+1 ${kt.name}`, color: kt.color }]);
      setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== fid)), 1100);
      const did = ++dropIdRef.current;
      setRecentDrops((prev) => [{ id: did, key: kt.name, color: kt.color }, ...prev].slice(0, 6));
      Sounds.keyDrop();
      setTimeout(() => setRecentDrops((prev) => prev.filter((d) => d.id !== did)), 3500);
    } else {
      const fid = ++floatCounter;
      const msgs = ["хрясь!", "кровь!", "душу!", "сила!"];
      setFloats((prev) => [...prev, { id: fid, x, y, text: msgs[Math.floor(Math.random() * msgs.length)], color: "#9ca3af" }]);
      setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== fid)), 900);
    }
    setVibrate(true); Sounds.click(); if (navigator.vibrate) navigator.vibrate(30);
    setTimeout(() => setVibrate(false), 90);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Готическая рамка вокруг кликера */}
      <div className="relative" style={{ width: "100%", maxWidth: 280 }}>
        {/* Декоративные углы */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-purple-600/60 rounded-tl-lg z-10 pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-purple-600/60 rounded-tr-lg z-10 pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-purple-600/60 rounded-bl-lg z-10 pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-purple-600/60 rounded-br-lg z-10 pointer-events-none" />

        <button
          onClick={handleClick}
          aria-label="Бей воришку"
          className="relative rounded-xl overflow-hidden border-2 border-purple-700/50 shadow-[0_0_30px_rgba(168,85,247,0.3),inset_0_0_20px_rgba(0,0,0,0.8)] select-none touch-manipulation active:scale-[0.97] transition-transform cursor-pointer block"
          style={{ width: "100%", aspectRatio: "1 / 1" }}
        >
          {/* AI-портрет воришки */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('bg/thief-new.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              transform: vibrate ? "translate(2px, -1px) scale(1.02)" : "translate(0, 0)",
              transition: "transform 0.05s",
            }}
          />
          {/* Тёмная виньетка по краям */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 40%, transparent 40%, rgba(8,6,10,0.8) 100%)" }} />
          {/* Красное свечение на шее при клике */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: vibrate ? "radial-gradient(circle at 50% 45%, rgba(220,38,38,0.4) 0%, transparent 50%)" : "transparent", transition: "background 0.1s" }} />

          {/* Floating numbers */}
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
                  style={{ left: f.x, top: f.y, color: f.color, textShadow: "0 1px 3px rgba(0,0,0,1)" }}
                >
                  {f.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Подсказка */}
          <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] uppercase tracking-wider text-zinc-400 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
            Бей воришку — получай ключи
          </div>
        </button>
      </div>

      {/* Последние выпавшие ключи */}
      <div className="min-h-[20px] flex flex-wrap gap-1 justify-center max-w-[280px]">
        <AnimatePresence>
          {recentDrops.map((d) => (
            <motion.span
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[11px] px-2 py-0.5 rounded-full font-medium border"
              style={{ background: d.color + "22", color: d.color, borderColor: d.color + "55" }}
            >
              {d.key}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="text-[11px] text-zinc-500 font-mono">
        Кликов: <span className="text-zinc-300 font-bold">{totalClicks}</span>
      </div>
    </div>
  );
}
