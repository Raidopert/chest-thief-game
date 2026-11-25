"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { EQUIP_SLOTS, RARITIES, RARITY_BY_ID, type EquipSlotId, type RarityId } from "@/lib/game/config";
import ItemCard from "./ItemCard";

const RARITY_ORDER: RarityId[] = ["divine","mythic","legendary","epic","rare","uncommon","common"];

export default function LootInventory() {
  const inventory = useGameStore((s) => s.inventory);
  const sellStack = useGameStore((s) => s.sellStack);
  const sellAllByRarity = useGameStore((s) => s.sellAllByRarity);
  const lastDrop = useGameStore((s) => s.lastDrop);
  const [filter, setFilter] = useState<RarityId | "all">("all");
  const [selected, setSelected] = useState<typeof inventory[0] | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<RarityId, typeof inventory>();
    for (const r of RARITY_ORDER) map.set(r, []);
    for (const stack of inventory) {
      const list = map.get(stack.rarity) ?? [];
      list.push(stack);
      map.set(stack.rarity, list);
    }
    for (const [, stacks] of map.entries()) {
      stacks.sort((a, b) => {
        if (a.slot && !b.slot) return -1;
        if (!a.slot && b.slot) return 1;
        return b.baseValue - a.baseValue;
      });
    }
    return map;
  }, [inventory]);

  const totalValue = useMemo(() => inventory.reduce((s, st) => s + st.baseValue * st.count, 0), [inventory]);
  const totalCount = useMemo(() => inventory.reduce((s, st) => s + st.count, 0), [inventory]);
  const filteredGrouped = filter === "all" ? grouped : new Map([[filter, grouped.get(filter) ?? []]]);
  const commonCount = grouped.get("common")?.reduce((s, st) => s + st.count, 0) ?? 0;
  const commonValue = grouped.get("common")?.reduce((s, st) => s + st.baseValue * st.count, 0) ?? 0;

  return (
    <div className="flex flex-col h-full rounded-2xl gothic-ornate-panel overflow-hidden">
      {/* Шапка */}
      <div className="p-3 border-b border-zinc-700/40 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-400 font-mono gothic-font">Кладовая</div>
          <div className="text-zinc-200 font-bold text-sm">
            {totalCount} шт · {totalValue.toLocaleString("ru-RU")} 💰
          </div>
        </div>
        {totalCount > 0 && (
          <button onClick={() => { for (const r of RARITY_ORDER) sellAllByRarity(r); }} className="gothic-ornate-btn px-3 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-bold transition-colors">
            Продать всё
          </button>
        )}
      </div>

      {/* Пустое состояние */}
      {inventory.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <motion.div
            className="text-5xl mb-3 opacity-40"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            📦
          </motion.div>
          <div className="text-sm text-zinc-400 gothic-font mb-1">Кладовая пуста</div>
          <div className="text-xs text-zinc-600 mb-4">Открой сундук, чтобы наполнить её лутом</div>
          <div className="text-[10px] text-purple-400/50 font-mono">→ Перейди на вкладку «Добыча»</div>
        </div>
      )}

      {/* Быстрая продажа common */}
      {commonCount > 0 && (
        <button onClick={() => sellAllByRarity("common")} className="gothic-ornate-btn mx-3 my-2 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 text-xs font-bold transition-colors flex items-center justify-center gap-2">
          💰 Продать common ({commonCount}шт · {commonValue.toLocaleString("ru-RU")}💰)
        </button>
      )}

      {/* Фильтр */}
      {inventory.length > 0 && (
        <div className="px-2 py-2 border-b border-zinc-700/40 flex flex-wrap gap-1">
          <button onClick={() => setFilter("all")} className={`text-xs px-2 py-1 rounded font-mono ${filter === "all" ? "bg-zinc-200 text-black" : "text-zinc-400 hover:bg-purple-950/30"}`}>все</button>
          {RARITIES.map((r) => {
            const count = grouped.get(r.id)?.reduce((s, st) => s + st.count, 0) ?? 0;
            return (
              <button key={r.id} onClick={() => setFilter(r.id)} disabled={count === 0} className="text-xs px-2 py-1 rounded font-mono disabled:opacity-30" style={{ color: r.color, background: filter === r.id ? r.color + "33" : "transparent", border: `1px solid ${r.color}55` }}>
                {r.emoji} {count}
              </button>
            );
          })}
        </div>
      )}

      {/* Список */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ maxHeight: "calc(100vh - 380px)" }}>
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
                  <span className="text-xs font-bold gothic-font" style={{ color: r.color }}>{r.name}</span>
                  <span className="text-[11px] text-zinc-500 font-mono">({stacks.length})</span>
                </div>
                <button onClick={() => sellAllByRarity(rarityId)} className="text-xs px-2 py-0.5 rounded font-mono text-emerald-200 hover:bg-emerald-900/40 border border-emerald-700/30">
                  продать · {sumValue.toLocaleString("ru-RU")}💰
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <AnimatePresence>
                  {stacks.map((st) => (
                    <motion.button
                      key={st.uid}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSelected(st)}
                      className="gothic-ornate-btn relative rounded-md p-2 text-left transition-all hover:scale-[1.03]"
                      style={{ background: r.color + "22", border: `1px solid ${r.color}55` }}
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="text-base leading-none" style={{ filter: `drop-shadow(0 0 3px ${r.color}66)` }}>{st.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs leading-tight text-zinc-200 truncate font-medium">{st.name}</div>
                          <div className="text-xs font-mono leading-tight" style={{ color: r.color }}>×{st.count} · {(st.baseValue * st.count).toLocaleString("ru-RU")}💰</div>
                          {st.slot && (
                            <div className="text-[11px] font-mono leading-tight text-zinc-400 mt-0.5">
                              {formatStats(st.stats)}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Карточка предмета */}
      <AnimatePresence>
        {selected && <ItemCard stack={selected} onClose={() => setSelected(null)} />}
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
