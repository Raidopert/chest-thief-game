"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import {
  EQUIP_SLOTS,
  HERO_BASE,
  RARITY_BY_ID,
  type EquipSlotId,
  type InventoryStack,
  type ItemStats,
} from "@/lib/game/config";
import { itemCategory } from "@/lib/game/items";

interface Props {
  onPickItemForSlot?: (slot: EquipSlotId) => void;
}

// Вычисление стат героя из equipped и уровня
function computeStats(equipped: Record<string, { stats: ItemStats } | undefined>, heroLevel: number): ItemStats {
  let atk = HERO_BASE.attack + heroLevel;
  let def = HERO_BASE.defense;
  let spd = HERO_BASE.speed;
  let luk = HERO_BASE.luck;
  for (const key of Object.keys(equipped) as EquipSlotId[]) {
    const item = equipped[key];
    if (!item) continue;
    atk += item.stats.attack;
    def += item.stats.defense;
    spd += item.stats.speed;
    luk += item.stats.luck;
  }
  return { attack: atk, defense: def, speed: spd, luck: luk };
}

export default function HeroInventory({ onPickItemForSlot }: Props) {
  const equipped = useGameStore((s) => s.equipped);
  const unequipSlot = useGameStore((s) => s.unequipSlot);
  const heroLevel = useGameStore((s) => s.battle.heroLevel);
  const heroStats = useMemo(() => computeStats(equipped, heroLevel), [equipped, heroLevel]);
  const [selectedSlot, setSelectedSlot] = useState<EquipSlotId | null>(null);

  const handleClickSlot = (slotId: EquipSlotId) => {
    const item = equipped[slotId];
    if (item) {
      // если уже надето — снимаем
      unequipSlot(slotId);
      return;
    }
    // иначе открываем выбор предмета
    setSelectedSlot(slotId);
    onPickItemForSlot?.(slotId);
  };

  // ширина и высота контейнера для масштабирования ячеек
  // SVG силуэт + ячейки поверх

  return (
    <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#1a1208] to-[#0e0a05] p-3 md:p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-amber-200/60 font-mono">
          Герой-душитель
        </div>
        <div className="text-[10px] text-amber-200/40 font-mono">
          Уровень {heroLevel}
        </div>
      </div>

      {/* Параметры */}
      <div className="grid grid-cols-4 gap-1 mb-3 text-center">
        <Stat label="Атака" value={heroStats.attack} color="#ef4444" />
        <Stat label="Защита" value={heroStats.defense} color="#3b82f6" />
        <Stat label="Скорость" value={heroStats.speed} color="#22c55e" />
        <Stat label="Удача" value={heroStats.luck} color="#fbbf24" />
      </div>

      {/* Силуэт + ячейки */}
      <div
        className="relative mx-auto"
        style={{
          width: "100%",
          maxWidth: 340,
          aspectRatio: "0.75 / 1",
        }}
      >
        <svg viewBox="0 0 200 280" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* фон — подиум */}
          <ellipse cx="100" cy="270" rx="60" ry="8" fill="rgba(0,0,0,0.5)" />

          {/* силуэт человека — очертания, руки по швам */}
          <g fill="#3a2a18" stroke="#5b3a1a" strokeWidth="1.5" opacity="0.85">
            {/* голова */}
            <circle cx="100" cy="40" r="18" />
            {/* шея */}
            <rect x="94" y="55" width="12" height="14" />
            {/* тело — торс */}
            <path d="M 78 70 Q 100 65 122 70 L 122 150 Q 100 156 78 150 Z" />
            {/* руки по швам */}
            <path d="M 78 72 Q 70 75 68 100 L 70 145 Q 76 148 78 145 L 78 72 Z" />
            <path d="M 122 72 Q 130 75 132 100 L 130 145 Q 124 148 122 145 L 122 72 Z" />
            {/* кисти */}
            <circle cx="71" cy="150" r="6" />
            <circle cx="129" cy="150" r="6" />
            {/* пояс */}
            <rect x="80" y="148" width="40" height="6" fill="#5b3a1a" />
            {/* ноги */}
            <path d="M 84 156 L 84 230 Q 88 232 92 230 L 92 156 Z" />
            <path d="M 108 156 L 108 230 Q 112 232 116 230 L 116 156 Z" />
            {/* сапоги */}
            <ellipse cx="88" cy="235" rx="8" ry="6" />
            <ellipse cx="112" cy="235" rx="8" ry="6" />
          </g>

          {/* лёгкое свечение от центра */}
          <radialGradient id="heroGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.15)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </radialGradient>
          <rect width="200" height="280" fill="url(#heroGlow)" pointerEvents="none" />
        </svg>

        {/* ячейки экипировки поверх силуэта */}
        {/* координаты ячеек — в % от 0..100 по x и y, где y=100 это низ силуэта (280), y=104 для артефактов снизу */}
        {EQUIP_SLOTS.map((slot) => {
          const item = equipped[slot.id];
          const rarity = item ? RARITY_BY_ID[item.rarity] : null;
          // конвертируем y > 100 в позицию ниже силуэта (для артефактов)
          const yPos = slot.y > 100 ? slot.y : slot.y;
          const isArtifact = slot.id.startsWith("artifact");
          return (
            <motion.button
              key={slot.id}
              onClick={() => handleClickSlot(slot.id)}
              title={slot.name}
              className="absolute rounded-md flex items-center justify-center transition-all hover:scale-110"
              style={{
                left: `${slot.x}%`,
                top: `${yPos}%`,
                width: `${slot.w * 100}%`,
                height: `${slot.h * 100}%`,
                transform: "translate(-50%, -50%)",
                background: item
                  ? `linear-gradient(180deg, ${rarity!.color}55, ${rarity!.color}22)`
                  : "rgba(0,0,0,0.4)",
                border: item
                  ? `2px solid ${rarity!.color}`
                  : `1.5px dashed ${isArtifact ? "#5b3a1a" : "#7a5a32"}`,
                boxShadow: item ? `0 0 10px ${rarity!.glow}` : "none",
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {item ? (
                <span className="text-base" style={{ filter: `drop-shadow(0 0 4px ${rarity!.color})` }}>
                  {item.emoji}
                </span>
              ) : (
                <span className="text-[9px] text-amber-200/40 font-mono uppercase">
                  {slot.name.split(" ")[0]}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Подсказка */}
      <div className="text-[10px] text-amber-200/50 text-center mt-2 font-mono">
        Клик по ячейке с предметом — снять. Клик по пустой — открыть выбор.
      </div>

      {/* Панель выбора предмета для слота */}
      <AnimatePresence>
        {selectedSlot && (
          <SlotPicker
            slotId={selectedSlot}
            onClose={() => setSelectedSlot(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-md bg-black/30 border border-amber-900/30 py-1">
      <div className="text-[8px] uppercase tracking-wider text-amber-200/50 font-mono leading-none">
        {label}
      </div>
      <div className="text-sm font-bold font-mono leading-tight" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function SlotPicker({ slotId, onClose }: { slotId: EquipSlotId; onClose: () => void }) {
  const inventory = useGameStore((s) => s.inventory);
  const isSlotCompatible = useGameStore((s) => s.isSlotCompatible);
  const equipItem = useGameStore((s) => s.equipItem);

  const compatible: InventoryStack[] = inventory.filter((s) => isSlotCompatible(s.slot, slotId));

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border-2 border-amber-700/50 bg-gradient-to-b from-[#231811] to-[#150e08] shadow-2xl p-4"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-amber-300 font-bold">
            Надеть в слот: {EQUIP_SLOTS.find((s) => s.id === slotId)?.name}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-amber-900/50 hover:bg-amber-800 text-amber-200 text-lg flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {compatible.length === 0 ? (
          <div className="text-center text-amber-200/40 text-sm py-8">
            Нет подходящих предметов в инвентаре.
            <div className="text-[10px] mt-2">
              Открывай сундуки ключами, чтобы найти экипировку.
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {compatible.map((stack) => {
              const r = RARITY_BY_ID[stack.rarity];
              const cat = itemCategory(stack.itemId);
              return (
                <button
                  key={stack.uid}
                  onClick={() => {
                    equipItem(stack.uid, slotId);
                    onClose();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg transition-all hover:scale-[1.02]"
                  style={{
                    background: r.color + "22",
                    border: `1px solid ${r.color}55`,
                  }}
                >
                  <span className="text-xl" style={{ filter: `drop-shadow(0 0 3px ${r.color}66)` }}>
                    {stack.emoji}
                  </span>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-xs font-bold text-amber-100 truncate">
                      {stack.name}
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: r.color }}>
                      {r.name} · {cat} · ×{stack.count}
                    </div>
                  </div>
                  <div className="text-right text-[10px] font-mono text-amber-200/70 leading-tight">
                    <StatLine label="АТК" value={stack.stats.attack} color="#ef4444" />
                    <StatLine label="ЗАЩ" value={stack.stats.defense} color="#3b82f6" />
                    <StatLine label="СКР" value={stack.stats.speed} color="#22c55e" />
                    <StatLine label="УДЧ" value={stack.stats.luck} color="#fbbf24" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatLine({ label, value, color }: { label: string; value: number; color: string }) {
  if (value === 0) return null;
  return (
    <div>
      <span style={{ color }}>{label}</span> +{value}
    </div>
  );
}
