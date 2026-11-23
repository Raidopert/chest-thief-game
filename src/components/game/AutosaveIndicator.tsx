"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";

// Автосейв-индикатор: показывает «✓ сохранено» после key-действий.
// Подписываемся на изменения money, keys, inventory, equipped — если они
// меняются, сохранение идёт в localStorage (через persist middleware).
export default function AutosaveIndicator() {
  const money = useGameStore((s) => s.money);
  const keys = useGameStore((s) => s.keys);
  const inventoryLength = useGameStore((s) => s.inventory.length);
  const equippedCount = useGameStore((s) => Object.keys(s.equipped).length);
  const chestsOpened = useGameStore((s) => s.stats.chestsOpened);
  const enemiesKilled = useGameStore((s) => s.battle.enemiesKilled);
  const [saved, setSaved] = useState(false);
  const [hidden, setHidden] = useState(true);

  // Любое изменение этих значений = autosave
  const fingerprint = `${money}|${JSON.stringify(keys)}|${inventoryLength}|${equippedCount}|${chestsOpened}|${enemiesKilled}`;

  useEffect(() => {
    // через rAF, чтобы не синхронно в теле эффекта
    const raf = requestAnimationFrame(() => {
      setSaved(true);
      setHidden(false);
    });
    const t1 = setTimeout(() => setHidden(true), 1500);
    const t2 = setTimeout(() => setSaved(false), 1800);
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); };
  }, [fingerprint]);

  return (
    <div
      className={`fixed bottom-3 right-3 z-40 pointer-events-none transition-opacity duration-300 ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="px-2.5 py-1.5 rounded-lg bg-black/70 border border-emerald-700/50 backdrop-blur-md flex items-center gap-1.5 shadow-md">
        <span className="text-emerald-400 text-xs">✓</span>
        <span className="text-emerald-300 text-[10px] font-mono uppercase tracking-wider">
          Сохранено
        </span>
      </div>
    </div>
  );
}
