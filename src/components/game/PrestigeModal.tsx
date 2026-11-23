"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import {
  PRESTIGE_CONFIG,
  calculatePrestigeMult,
  DUNGEON_KILLS_PER_FLOOR,
} from "@/lib/game/config";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PrestigeModal({ open, onClose }: Props) {
  const stats = useGameStore((s) => s.stats);
  const battle = useGameStore((s) => s.battle);
  const prestige = useGameStore((s) => s.prestige);
  const prestigeReset = useGameStore((s) => s.prestigeReset);

  if (!open) return null;

  // Расчёт душ
  const floor = Math.floor(stats.enemiesKilled / DUNGEON_KILLS_PER_FLOOR);
  const floorsPassed = Math.max(0, floor);
  const fromFloors = floorsPassed * PRESTIGE_CONFIG.soulsPerFloor;
  const fromBosses = stats.bossKills * PRESTIGE_CONFIG.soulsPerBoss;
  const fromLevel = Math.floor(battle.heroLevel * PRESTIGE_CONFIG.soulsPerHeroLevel);
  const fromDivine = stats.bestRarityFound === "divine" ? PRESTIGE_CONFIG.soulsPerDivine : 0;
  const soulsGained = fromFloors + fromBosses + fromLevel + fromDivine;
  const canPrestige = soulsGained >= PRESTIGE_CONFIG.minSoulsToPrestige;

  const currentMult = calculatePrestigeMult(prestige.souls);
  const newTotalSouls = prestige.souls + soulsGained;
  const newMult = calculatePrestigeMult(newTotalSouls);
  const multIncrease = newMult - currentMult;

  const handlePrestige = () => {
    if (!canPrestige) return;
    if (confirm(
      `Принести жертву?\n\n` +
      `Ты получишь: +${soulsGained} душ\n` +
      `Новый множитель: ×${newMult.toFixed(2)} (было ×${currentMult.toFixed(2)})\n\n` +
      `СБРОСИТСЯ:\n` +
      `• Деньги, ключи, лут, экипировка\n` +
      `• Уровень героя, этажи, враги\n\n` +
      `СОХРАНИТСЯ:\n` +
      `• Души, множитель\n` +
      `• Достижения, дейлики`
    )) {
      prestigeReset();
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl border-2 border-purple-600/60 bg-gradient-to-b from-[#1c1525] to-[#0a060f] shadow-[0_0_60px_rgba(168,85,247,0.3)] p-5"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">💀</div>
          <h2 className="text-lg font-black text-purple-300 uppercase tracking-wider">
            Алтарь Жертвы
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono mt-1">
            Сбрось прогресс ради перманентной силы
          </p>
        </div>

        {/* Текущий статус */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-lg bg-black/40 border border-zinc-700/50 p-2 text-center">
            <div className="text-[9px] uppercase text-zinc-500 font-mono">Души</div>
            <div className="text-purple-300 font-bold text-lg font-mono">{prestige.souls}</div>
          </div>
          <div className="rounded-lg bg-black/40 border border-zinc-700/50 p-2 text-center">
            <div className="text-[9px] uppercase text-zinc-500 font-mono">Множитель</div>
            <div className="text-emerald-300 font-bold text-lg font-mono">×{currentMult.toFixed(2)}</div>
          </div>
        </div>

        {/* Расчёт душ */}
        <div className="rounded-lg bg-purple-950/30 border border-purple-700/30 p-3 mb-3">
          <div className="text-[10px] uppercase text-purple-400/80 font-mono mb-2">
            Что ты получишь:
          </div>
          <div className="space-y-1 text-xs">
            <SoulRow label={`Этажи пройдены (${floorsPassed})`} value={fromFloors} />
            <SoulRow label={`Боссы убиты (${stats.bossKills})`} value={fromBosses} />
            <SoulRow label={`Уровень героя (${battle.heroLevel})`} value={fromLevel} />
            {fromDivine > 0 && <SoulRow label="Божественный лут найден" value={fromDivine} />}
          </div>
          <div className="mt-2 pt-2 border-t border-purple-700/30 flex items-center justify-between">
            <span className="text-purple-300 font-bold text-sm">Всего душ:</span>
            <span className="text-purple-200 font-black text-xl font-mono">+{soulsGained}</span>
          </div>
        </div>

        {/* Новый множитель */}
        {canPrestige && (
          <div className="rounded-lg bg-emerald-950/30 border border-emerald-700/30 p-3 mb-4 text-center">
            <div className="text-[10px] uppercase text-emerald-400/80 font-mono">Новый множитель</div>
            <div className="text-emerald-300 font-black text-2xl font-mono">
              ×{newMult.toFixed(2)}
            </div>
            <div className="text-[10px] text-emerald-500/60 font-mono">
              +{(multIncrease * 100).toFixed(1)}% ко всем наградам
            </div>
          </div>
        )}

        {/* Что сбрасывается */}
        <div className="text-[10px] text-zinc-500 mb-4 space-y-0.5">
          <div className="text-red-400/70 font-mono uppercase tracking-wider mb-1">Сбросится:</div>
          <div>• Деньги, ключи, лут, экипировка</div>
          <div>• Уровень героя, этажи, враги</div>
          <div className="text-emerald-400/70 font-mono uppercase tracking-wider mt-2 mb-1">Сохранится:</div>
          <div>• Души, множитель, достижения, дейлики</div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handlePrestige}
            disabled={!canPrestige}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              canPrestige
                ? "bg-gradient-to-b from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {canPrestige ? "💀 Принести жертву" : `Нужно ${PRESTIGE_CONFIG.minSoulsToPrestige}+ душ`}
          </button>
        </div>

        {!canPrestige && (
          <p className="text-center text-[10px] text-zinc-600 mt-2">
            Прогрессируй дальше — поднимай этажи, убивай боссов, качай героя
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

function SoulRow({ label, value }: { label: string; value: number }) {
  if (value === 0) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400">{label}</span>
      <span className="text-purple-300 font-mono font-bold">+{value}</span>
    </div>
  );
}
