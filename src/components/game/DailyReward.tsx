"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { KEY_TYPES } from "@/lib/game/config";
import { Sounds } from "./Sound";

// Ежедневная награда — заходи каждый день, получай ключ
// День 1=ржавый, 2=железный, 3=железный, 4=бронзовый, 5=бронзовый, 6=серебряный, 7=золотой

const DAILY_REWARD_KEY = "chest-thief-daily-reward";
const DAY_KEYS = ["rusty", "iron", "iron", "bronze", "bronze", "silver", "golden"] as const;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

export default function DailyReward() {
  const [show, setShow] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastClaim, setLastClaim] = useState("");
  const addKey = useGameStore((s) => s.keys);

  useEffect(() => {
    try {
      const data = localStorage.getItem(DAILY_REWARD_KEY);
      requestAnimationFrame(() => {
        if (data) {
          const parsed = JSON.parse(data);
          setStreak(parsed.streak || 0);
          setLastClaim(parsed.lastClaim || "");
          if (parsed.lastClaim !== todayStr()) {
            setShow(true);
          }
        } else {
          setShow(true);
        }
      });
    } catch {
      requestAnimationFrame(() => setShow(true));
    }
  }, []);

  const claimReward = () => {
    const today = todayStr();
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1).toString().padStart(2, "0")}-${yesterday.getDate().toString().padStart(2, "0")}`;

    const newStreak = lastClaim === yesterdayStr ? streak + 1 : 1;
    const dayIndex = (newStreak - 1) % 7;
    const keyType = DAY_KEYS[dayIndex];
    const keyDef = KEY_TYPES.find(k => k.id === keyType)!;

    // Выдаём ключ через store
    useGameStore.setState((state) => ({
      keys: { ...state.keys, [keyType]: state.keys[keyType] + 1 },
      lastNotice: {
        id: `daily-${today}`,
        text: `Ежедневная награда: ${keyDef.name}! (день ${newStreak})`,
        color: keyDef.color,
        emoji: keyDef.emoji,
      },
    }));

    Sounds.keyDrop();
    if (navigator.vibrate) navigator.vibrate([50, 30, 80]);

    setStreak(newStreak);
    setLastClaim(today);
    setShow(false);

    try {
      localStorage.setItem(DAILY_REWARD_KEY, JSON.stringify({ streak: newStreak, lastClaim: today }));
    } catch {}
  };

  if (!show) return null;
  const todayIndex = streak % 7;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl gothic-panel p-5 border-2 border-amber-600/40"
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
          >
            <div className="text-center mb-4">
              <motion.div
                className="text-4xl mb-2"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎁
              </motion.div>
              <h2 className="text-lg font-bold text-amber-300">Ежедневная награда</h2>
              <p className="text-xs text-zinc-400 mt-1">
                {streak > 0 ? `Серия: ${streak} дней` : "Заходи каждый день за ключом!"}
              </p>
            </div>

            {/* Полоса 7 дней */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {DAY_KEYS.map((kt, i) => {
                const def = KEY_TYPES.find(k => k.id === kt)!;
                const isToday = i === todayIndex;
                const isPast = i < todayIndex;
                return (
                  <div
                    key={i}
                    className={`rounded-lg p-1.5 flex flex-col items-center gap-0.5 border transition-all ${
                      isToday ? "ring-2 ring-amber-400 scale-110" : ""
                    }`}
                    style={{
                      background: isPast ? def.color + "33" : isToday ? def.color + "44" : "rgba(0,0,0,0.3)",
                      borderColor: def.color + (isToday ? "aa" : "33"),
                    }}
                  >
                    <span className="text-[9px] text-zinc-500 font-mono">Д{i + 1}</span>
                    <span className="text-sm">{isPast ? "✓" : def.emoji}</span>
                  </div>
                );
              })}
            </div>

            {/* Награда сегодня */}
            <div className="text-center mb-4">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono mb-1">
                Сегодня:
              </div>
              <div className="text-2xl mb-1">
                {KEY_TYPES.find(k => k.id === DAY_KEYS[todayIndex])!.emoji}
              </div>
              <div className="text-sm font-bold" style={{ color: KEY_TYPES.find(k => k.id === DAY_KEYS[todayIndex])!.color }}>
                {KEY_TYPES.find(k => k.id === DAY_KEYS[todayIndex])!.name}
              </div>
            </div>

            <button
              onClick={claimReward}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)]"
            >
              Забрать награду
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
