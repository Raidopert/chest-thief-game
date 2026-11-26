"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import {
  EQUIP_SLOTS,
  HERO_BASE,
  RARITY_BY_ID,
  SET_BY_ID,
  type EquipSlotId,
  type InventoryStack,
  type ItemStats,
} from "@/lib/game/config";
import { itemCategory } from "@/lib/game/items";
import { assetUrl } from "@/lib/utils";

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
    <div
      className="relative rounded-2xl gothic-panel overflow-hidden p-3 md:p-4"
      style={{
        backgroundImage: `url('${assetUrl("bg/hero-bg-new.png")}')`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      {/* тёмная подложка для читаемости */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/85 pointer-events-none" />

      <div className="relative flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-300 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            Герой-душитель
          </div>
          <div className="text-[10px] text-zinc-400 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
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

      {/* Активные сеты экипировки */}
      <ActiveSets />

      {/* Силуэт + ячейки */}
      <div
        className="relative mx-auto"
        style={{
          width: "100%",
          maxWidth: 340,
          aspectRatio: "0.75 / 1",
        }}
      >
        {/* AI-арт героя вместо SVG силуэта */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            backgroundImage: `url('${assetUrl("bg/hero-art.png")}')`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            opacity: 0.85,
          }}
        />
        {/* Затемнение по краям для читаемости ячеек */}
        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(8,6,10,0.6) 100%)",
        }} />

        {/* ячейки экипировки поверх AI-арта героя */}
        {/* ячейки экипировки поверх AI-арта героя */}
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
                <span className="text-[11px] text-zinc-500 font-mono uppercase">
                  {slot.name.split(" ")[0]}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Подсказка */}
      <div className="text-[10px] text-zinc-500 text-center mt-2 font-mono">
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
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-md bg-black/30 border border-zinc-700/40 py-1">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono leading-none">
        {label}
      </div>
      <div className="text-sm font-bold font-mono leading-tight" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

// Показывает активные сеты экипировки героя и их бонусы
function ActiveSets() {
  const equipped = useGameStore((s) => s.equipped);

  // считаем количество предметов каждого сета
  const setCounts: Record<string, number> = {};
  for (const key of Object.keys(equipped) as EquipSlotId[]) {
    const item = equipped[key];
    if (item?.set) setCounts[item.set] = (setCounts[item.set] ?? 0) + 1;
  }
  const active = Object.keys(setCounts).map((setId) => {
    const def = SET_BY_ID[setId];
    const count = setCounts[setId];
    return { setId, def, count };
  }).filter((s) => s.def);

  if (active.length === 0) return null;

  return (
    <div className="mb-3 space-y-1">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono mb-1">
        Сеты
      </div>
      {active.map(({ setId, def, count }) => {
        const has2 = count >= 2;
        const has4 = count >= 4;
        const has6 = count >= 6 && !!def.bonus6;
        return (
          <div
            key={setId}
            className="flex items-center gap-2 p-1.5 rounded-md"
            style={{
              background: def.color + "11",
              border: `1px solid ${def.color}${has2 ? "66" : "22"}`,
              boxShadow: has2 ? `0 0 8px ${def.color}33` : "none",
            }}
          >
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-wider"
              style={{ color: def.color }}
            >
              {def.name}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {count}/6
            </span>
            <div className="flex gap-1 ml-auto">
              {[2, 4, 6].map((threshold) => {
                const active2 = threshold === 2 ? has2 : threshold === 4 ? has4 : has6;
                const bonus = threshold === 2 ? def.bonus2 : threshold === 4 ? def.bonus4 : def.bonus6;
                if (!bonus) return null;
                const statName = bonus.stat === "attack" ? "АТК" : bonus.stat === "defense" ? "ЗАЩ" : bonus.stat === "speed" ? "СКР" : "УДЧ";
                return (
                  <span
                    key={threshold}
                    className="text-[10px] px-1 py-0.5 rounded font-mono"
                    style={{
                      background: active2 ? def.color + "33" : "rgba(0,0,0,0.3)",
                      color: active2 ? def.color : "#64748b",
                      border: `1px solid ${def.color}${active2 ? "88" : "22"}`,
                      opacity: active2 ? 1 : 0.5,
                    }}
                  >
                    {threshold}шт:+{Math.round(bonus.mult * 100)}%{statName}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
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
        className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border-2 border-red-800/50 bg-gradient-to-b from-[#1c1c25] to-[#08060a] shadow-2xl p-4"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-zinc-200 font-bold">
            Надеть в слот: {EQUIP_SLOTS.find((s) => s.id === slotId)?.name}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-red-950/60 hover:bg-red-900 text-zinc-300 text-lg flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {compatible.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-8">
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
                    <div className="text-xs font-bold text-zinc-200 truncate">
                      {stack.name}
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: r.color }}>
                      {r.name} · {cat} · ×{stack.count}
                    </div>
                  </div>
                  <div className="text-right text-[10px] font-mono text-zinc-400 leading-tight">
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
