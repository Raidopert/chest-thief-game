"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import {
  EQUIP_SLOTS,
  RARITIES,
  RARITY_BY_ID,
  type EquipSlotId,
  type RarityId,
} from "@/lib/game/config";

const RARITY_ORDER: RarityId[] = [
  "divine",
  "mythic",
  "legendary",
  "epic",
  "rare",
  "uncommon",
  "common",
];

export default function LootInventory() {
  const inventory = useGameStore((s) => s.inventory);
  const sellStack = useGameStore((s) => s.sellStack);
  const sellAllByRarity = useGameStore((s) => s.sellAllByRarity);
  const lastDrop = useGameStore((s) => s.lastDrop);
  const [filter, setFilter] = useState<RarityId | "all">("all");

  const grouped = useMemo(() => {
    const map = new Map<RarityId, typeof inventory>();
    for (const r of RARITY_ORDER) map.set(r, []);
    for (const stack of inventory) {
      const list = map.get(stack.rarity) ?? [];
      list.push(stack);
      map.set(stack.rarity, list);
    }
    return map;
  }, [inventory]);

  const totalValue = useMemo(
    () => inventory.reduce((s, st) => s + st.baseValue * st.count, 0),
    [inventory],
  );

  const totalCount = useMemo(
    () => inventory.reduce((s, st) => s + st.count, 0),
    [inventory],
  );

  const filteredGrouped = filter === "all" ? grouped : new Map([[filter, grouped.get(filter) ?? []]]);

  return (
    <div className="flex flex-col h-full rounded-2xl gothic-panel overflow-hidden">
      {/* шапка */}
      <div className="p-3 border-b border-zinc-700 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono">
            Кошель воришки
          </div>
          <div className="text-zinc-200 font-bold text-sm">
            {totalCount} шт · {totalValue.toLocaleString("ru-RU")} 💰
          </div>
        </div>
        {totalCount > 0 && (
          <button
            onClick={() => {
              for (const r of RARITY_ORDER) sellAllByRarity(r);
            }}
            className="px-2 py-1 rounded-md bg-emerald-700 hover:bg-emerald-600 text-emerald-100 text-[11px] font-bold transition-colors"
          >
            Продать всё
          </button>
        )}
      </div>

      {/* фильтр */}
      <div className="px-2 py-2 border-b border-zinc-700 flex flex-wrap gap-1">
        <button
          onClick={() => setFilter("all")}
          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            filter === "all"
              ? "bg-zinc-200 text-black"
              : "text-zinc-400 hover:bg-red-950/40"
          }`}
        >
          все
        </button>
        {RARITIES.map((r) => {
          const count = grouped.get(r.id)?.reduce((s, st) => s + st.count, 0) ?? 0;
          return (
            <button
              key={r.id}
              onClick={() => setFilter(r.id)}
              disabled={count === 0}
              className="text-[10px] px-1.5 py-0.5 rounded font-mono disabled:opacity-30"
              style={{
                color: r.color,
                background: filter === r.id ? r.color + "33" : "transparent",
                border: `1px solid ${r.color}55`,
              }}
            >
              {r.emoji} {count}
            </button>
          );
        })}
      </div>

      {/* список */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]" style={{ maxHeight: "calc(100vh - 360px)" }}>
        {inventory.length === 0 && (
          <div className="text-center text-zinc-500 text-xs py-12">
            Пока пусто. Открой сундук, чтобы собрать лут.
          </div>
        )}
        {RARITY_ORDER.map((rarityId) => {
          const stacks = filteredGrouped.get(rarityId) ?? [];
          if (stacks.length === 0) return null;
          const r = RARITY_BY_ID[rarityId];
          const sumValue = stacks.reduce((s, st) => s + st.baseValue * st.count, 0);
          return (
            <div key={rarityId} className="rounded-lg p-2" style={{ background: r.color + "11", border: `1px solid ${r.color}33` }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: r.color }}>{r.emoji}</span>
                  <span className="text-[11px] font-bold" style={{ color: r.color }}>
                    {r.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    ({stacks.length})
                  </span>
                </div>
                <button
                  onClick={() => sellAllByRarity(rarityId)}
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono text-emerald-200 hover:bg-emerald-900/40 border border-emerald-700/30"
                >
                  продать · {sumValue.toLocaleString("ru-RU")}💰
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <AnimatePresence>
                  {stacks.map((st) => {
                    const canEquip = st.slot !== null;
                    return (
                      <motion.div
                        key={st.uid}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="group relative rounded-md p-1.5 text-left"
                        style={{
                          background: r.color + "22",
                          border: `1px solid ${r.color}55`,
                        }}
                      >
                        <div className="flex items-start gap-1.5">
                          <span className="text-base leading-none" style={{ filter: `drop-shadow(0 0 3px ${r.color}66)` }}>
                            {st.emoji}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] leading-tight text-zinc-200 truncate font-medium">
                              {st.name}
                            </div>
                            <div className="text-[10px] font-mono leading-tight" style={{ color: r.color }}>
                              ×{st.count} · {(st.baseValue * st.count).toLocaleString("ru-RU")}💰
                            </div>
                            {canEquip && (
                              <div className="text-[9px] font-mono leading-tight text-zinc-400 mt-0.5">
                                {formatStats(st.stats)}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* кнопки действий */}
                        <div className="mt-1.5 flex gap-1">
                          <button
                            onClick={() => sellStack(st.uid)}
                            className="flex-1 text-[9px] py-0.5 rounded font-mono bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200 transition-colors"
                            title="Продать весь стэк"
                          >
                            продать
                          </button>
                          {canEquip && (
                            <EquipButton stackUid={st.uid} itemSlot={st.slot as EquipSlotId} />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* последний выпавший предмет */}
      <AnimatePresence>
        {lastDrop && (
          <motion.div
            key={lastDrop.uid}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="m-2 rounded-lg p-2"
            style={{
              background: RARITY_BY_ID[lastDrop.rarity].color + "22",
              border: `1px solid ${RARITY_BY_ID[lastDrop.rarity].color}`,
            }}
          >
            <div className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">
              Последний лут
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg" style={{ filter: `drop-shadow(0 0 4px ${RARITY_BY_ID[lastDrop.rarity].color})` }}>
                {lastDrop.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-zinc-200 truncate">
                  {lastDrop.name}
                </div>
                <div className="text-[10px] font-mono" style={{ color: RARITY_BY_ID[lastDrop.rarity].color }}>
                  {RARITY_BY_ID[lastDrop.rarity].name} · {lastDrop.value.toLocaleString("ru-RU")}💰
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatStats(stats: { attack: number; defense: number; speed: number; luck: number }): string {
  const parts: string[] = [];
  if (stats.attack > 0) parts.push(`⚔${stats.attack}`);
  if (stats.defense > 0) parts.push(`🛡${stats.defense}`);
  if (stats.speed > 0) parts.push(`💨${stats.speed}`);
  if (stats.luck > 0) parts.push(`🍀${stats.luck}`);
  return parts.join(" ");
}

// Кнопка «Надеть» — автоматически надевает в первый подходящий слот

function EquipButton({ stackUid, itemSlot }: { stackUid: string; itemSlot: EquipSlotId }) {
  const equipItem = useGameStore((s) => s.equipItem);
  const equipped = useGameStore((s) => s.equipped);

  // ищем первый подходящий свободный слот
  const candidates = EQUIP_SLOTS.filter((s) => {
    if (itemSlot === "leftHand") {
      return s.id === "leftHand" || s.id === "rightHand";
    }
    if (itemSlot.startsWith("artifact")) {
      return s.id.startsWith("artifact");
    }
    return s.id === itemSlot;
  });
  const firstFree = candidates.find((s) => !equipped[s.id]) ?? candidates[0];
  if (!firstFree) return null;

  return (
    <button
      onClick={() => equipItem(stackUid, firstFree.id)}
      className="flex-1 text-[9px] py-0.5 rounded font-mono bg-red-950/40 hover:bg-red-800/60 text-zinc-300 transition-colors"
      title={`Надеть в слот: ${firstFree.name}`}
    >
      надеть
    </button>
  );
}
