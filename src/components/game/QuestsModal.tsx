"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import {
  ACHIEVEMENTS,
  DAILY_POOL,
  KEY_BY_ID,
  type Achievement,
  type DailyQuest,
} from "@/lib/game/config";
import { getMetricValueHelper } from "@/lib/game/quests-helpers";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function QuestsModal({ open, onClose }: Props) {
  const stats = useGameStore((s) => s.stats);
  const achievements = useGameStore((s) => s.achievements);
  const dailies = useGameStore((s) => s.dailies);
  const claimAchievement = useGameStore((s) => s.claimAchievement);
  const claimDaily = useGameStore((s) => s.claimDaily);

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border-2 border-amber-700/40 bg-gradient-to-b from-[#1c1c25] to-[#08060a] shadow-2xl p-4"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#15131c]/95 backdrop-blur z-10 pb-2 border-b border-zinc-700/40">
          <h2 className="text-zinc-200 font-bold uppercase tracking-wider">📜 Задания</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-red-950/60 hover:bg-red-900 text-zinc-300 text-lg flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Дейлики */}
        <section className="mb-5">
          <h3 className="text-[11px] uppercase tracking-widest text-emerald-400/80 font-mono mb-2">
            📅 Дейлики (сброс в 00:00)
          </h3>
          <div className="space-y-1.5">
            {dailies.quests.map((dq) => {
              const def = DAILY_POOL.find((d) => d.id === dq.id);
              if (!def) return null;
              const value = getMetricValueHelper(stats, def.metric);
              const progress = Math.max(0, value - dq.progress);
              const pct = Math.min(100, (progress / def.goal) * 100);
              const ready = progress >= def.goal && !dq.claimed;
              return (
                <DailyRow
                  key={dq.id}
                  def={def}
                  progress={progress}
                  pct={pct}
                  ready={ready}
                  claimed={dq.claimed}
                  onClaim={() => claimDaily(dq.id)}
                />
              );
            })}
          </div>
        </section>

        {/* Достижения */}
        <section>
          <h3 className="text-[11px] uppercase tracking-widest text-amber-400/80 font-mono mb-2">
            🏆 Достижения
          </h3>
          <div className="space-y-1">
            {ACHIEVEMENTS.map((ach) => {
              const value = getMetricValueHelper(stats, ach.metric);
              const pct = Math.min(100, (value / ach.goal) * 100);
              const ready = value >= ach.goal && !achievements[ach.id]?.claimed;
              const claimed = !!achievements[ach.id]?.claimed;
              return (
                <AchievementRow
                  key={ach.id}
                  ach={ach}
                  value={value}
                  pct={pct}
                  ready={ready}
                  claimed={claimed}
                  onClaim={() => claimAchievement(ach.id)}
                />
              );
            })}
          </div>
        </section>
      </motion.div>
    </motion.div>
  );
}

function DailyRow({
  def,
  progress,
  pct,
  ready,
  claimed,
  onClaim,
}: {
  def: DailyQuest;
  progress: number;
  pct: number;
  ready: boolean;
  claimed: boolean;
  onClaim: () => void;
}) {
  const keyText = def.reward.keys
    ? `+${def.reward.keys.count} ${KEY_BY_ID[def.reward.keys.rarity].emoji}`
    : "";
  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
        claimed
          ? "bg-zinc-900/40 border-zinc-700/30 opacity-50"
          : ready
            ? "bg-emerald-900/30 border-emerald-500/60 shadow-[0_0_12px_rgba(34,197,94,0.4)]"
            : "bg-black/30 border-zinc-700/40"
      }`}
    >
      <span className="text-2xl">{def.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-zinc-200 font-medium">{def.description}</div>
        <div className="mt-1 h-1.5 bg-black/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
          {progress}/{def.goal} · награда: +{def.reward.money}💰 {keyText}
        </div>
      </div>
      <button
        onClick={onClaim}
        disabled={!ready || claimed}
        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
          claimed
            ? "bg-zinc-800 text-zinc-500"
            : ready
              ? "bg-emerald-700 hover:bg-emerald-600 text-white animate-pulse"
              : "bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
        }`}
      >
        {claimed ? "✓" : ready ? "Забрать" : "—"}
      </button>
    </div>
  );
}

function AchievementRow({
  ach,
  value,
  pct,
  ready,
  claimed,
  onClaim,
}: {
  ach: Achievement;
  value: number;
  pct: number;
  ready: boolean;
  claimed: boolean;
  onClaim: () => void;
}) {
  const keyText = ach.reward.keys
    ? `+${ach.reward.keys.count} ${KEY_BY_ID[ach.reward.keys.rarity].emoji}`
    : "";
  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
        claimed
          ? "bg-zinc-900/40 border-zinc-700/30 opacity-50"
          : ready
            ? "bg-amber-900/30 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
            : "bg-black/30 border-zinc-700/40"
      }`}
    >
      <span className="text-xl">{ach.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-zinc-200 font-medium">
          {ach.name} <span className="text-zinc-500">— {ach.description}</span>
        </div>
        <div className="mt-1 h-1.5 bg-black/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-700 to-amber-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
          {value}/{ach.goal} · +{ach.reward.money}💰 {keyText}
        </div>
      </div>
      <button
        onClick={onClaim}
        disabled={!ready || claimed}
        className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${
          claimed
            ? "bg-zinc-800 text-zinc-500"
            : ready
              ? "bg-amber-700 hover:bg-amber-600 text-white"
              : "bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
        }`}
      >
        {claimed ? "✓" : ready ? "Забрать" : "—"}
      </button>
    </div>
  );
}
