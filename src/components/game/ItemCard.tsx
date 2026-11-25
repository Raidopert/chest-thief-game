"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { EQUIP_SLOTS, RARITY_BY_ID, type EquipSlotId, type ItemStats } from "@/lib/game/config";

// Карточка предмета при тапе — показывает детали + сравнение + 4 кнопки
interface Props {
  stack: {
    uid: string;
    itemId: string;
    name: string;
    rarity: string;
    emoji: string;
    baseValue: number;
    count: number;
    slot: EquipSlotId | null;
    stats: ItemStats;
    set: string | null;
  };
  onClose: () => void;
}

export default function ItemCard({ stack, onClose }: Props) {
  const sellStack = useGameStore((s) => s.sellStack);
  const equipItem = useGameStore((s) => s.equipItem);
  const craftItems = useGameStore((s) => s.craftItems);
  const sacrificeItem = useGameStore((s) => s.sacrificeItem);
  const equipped = useGameStore((s) => s.equipped);

  const r = RARITY_BY_ID[stack.rarity as keyof typeof RARITY_BY_ID];
  const canEquip = stack.slot !== null;

  // Находим что надето в том же слоте для сравнения
  let comparison: { stats: ItemStats; name: string } | null = null;
  if (canEquip && stack.slot) {
    const candidates = EQUIP_SLOTS.filter((s) => {
      if (stack.slot === "leftHand") return s.id === "leftHand" || s.id === "rightHand";
      if (stack.slot?.startsWith("artifact")) return s.id.startsWith("artifact");
      return s.id === stack.slot;
    });
    for (const c of candidates) {
      const eq = equipped[c.id];
      if (eq) { comparison = { stats: eq.stats, name: eq.name }; break; }
    }
  }

  const statDiff = (mine: number, theirs: number) => {
    if (!comparison) return null;
    const diff = mine - theirs;
    if (diff === 0) return { text: "=", color: "#64748b" };
    return diff > 0
      ? { text: `+${diff}`, color: "#22c55e" }
      : { text: `${diff}`, color: "#ef4444" };
  };

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-xs rounded-2xl gothic-ornate-panel p-4"
        style={{ borderColor: r.color + "55", boxShadow: `0 0 40px ${r.glow}, 0 8px 32px rgba(0,0,0,0.8)` }}
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl" style={{ filter: `drop-shadow(0 0 8px ${r.color})` }}>
            {stack.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-zinc-100 truncate gothic-font">{stack.name}</div>
            <div className="text-xs font-mono" style={{ color: r.color }}>
              {r.emoji} {r.name} · ×{stack.count}
            </div>
          </div>
        </div>

        {/* Статы с сравнением */}
        {canEquip && (
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {(["attack", "defense", "speed", "luck"] as const).map((stat) => {
              const val = stack.stats[stat];
              if (val === 0) return null;
              const diff = statDiff(val, comparison?.stats[stat] ?? 0);
              const labels = { attack: "⚔ АТК", defense: "🛡 ЗАЩ", speed: "💨 СКР", luck: "🍀 УДЧ" };
              return (
                <div key={stat} className="rounded-lg bg-black/40 p-2 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{labels[stat]}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-zinc-200">{val}</span>
                    {diff && <span className="text-[10px] font-mono" style={{ color: diff.color }}>{diff.text}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Сет */}
        {stack.set && (
          <div className="text-[10px] text-purple-400/70 font-mono mb-3 text-center">
            Сет: {stack.set}
          </div>
        )}

        {/* Цена */}
        <div className="text-center mb-3">
          <span className="text-xs text-zinc-500 font-mono">Цена: </span>
          <span className="text-sm font-bold text-amber-300 font-mono">
            {(stack.baseValue * stack.count).toLocaleString("ru-RU")} 💰
          </span>
        </div>

        {/* Кнопки */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { sellStack(stack.uid); onClose(); }} className="gothic-ornate-btn py-2.5 rounded-lg bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-200 text-xs font-bold transition-colors">
            💰 Продать
          </button>
          {canEquip ? (
            <button onClick={() => {
              const cands = EQUIP_SLOTS.filter((s) => {
                if (stack.slot === "leftHand") return s.id === "leftHand" || s.id === "rightHand";
                if (stack.slot?.startsWith("artifact")) return s.id.startsWith("artifact");
                return s.id === stack.slot;
              });
              const free = cands.find((s) => !equipped[s.id]) ?? cands[0];
              if (free) { equipItem(stack.uid, free.id); onClose(); }
            }} className="gothic-ornate-btn py-2.5 rounded-lg bg-cyan-900/50 hover:bg-cyan-800/60 text-cyan-200 text-xs font-bold transition-colors">
              ⚔ Надеть
            </button>
          ) : (
            <div className="py-2.5 rounded-lg bg-zinc-800/50 text-zinc-600 text-xs font-bold text-center">
              расходник
            </div>
          )}
          {canEquip && stack.count >= 5 && (
            <button onClick={() => { craftItems(stack.itemId); onClose(); }} className="gothic-ornate-btn py-2.5 rounded-lg bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 text-xs font-bold transition-colors">
              ⚗ Крафт 5→1
            </button>
          )}
          {canEquip && (
            <button onClick={() => { sacrificeItem(stack.uid, 1); onClose(); }} className="gothic-ornate-btn py-2.5 rounded-lg bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 text-xs font-bold transition-colors">
              🙏 Жертва
            </button>
          )}
        </div>

        {/* Сравнение с надетым */}
        {comparison && (
          <div className="mt-3 pt-2 border-t border-zinc-700/30 text-center">
            <div className="text-[10px] text-zinc-500 font-mono">
              Надето: <span className="text-zinc-400">{comparison.name}</span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
