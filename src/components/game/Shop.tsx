"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { KEY_TYPES, SHOP_BOOSTERS } from "@/lib/game/config";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Shop({ open, onClose }: Props) {
  const money = useGameStore((s) => s.money);
  const buyKey = useGameStore((s) => s.buyKey);
  const buyBooster = useGameStore((s) => s.buyBooster);
  const luckBoost = useGameStore((s) => s.luckBoost);

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border-2 border-amber-700/50 bg-gradient-to-b from-[#231811] to-[#150e08] shadow-2xl"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* шапка */}
        <div className="p-4 border-b border-amber-900/40 flex items-center justify-between sticky top-0 bg-[#1a1208]/95 backdrop-blur z-10">
          <div>
            <h2 className="text-amber-300 font-bold text-lg flex items-center gap-2">
              🛒 Лавка вора
            </h2>
            <p className="text-[11px] text-amber-200/60 font-mono">
              В кошельке: <span className="text-amber-300 font-bold">{money.toLocaleString("ru-RU")}💰</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-amber-900/50 hover:bg-amber-800 text-amber-200 text-xl flex items-center justify-center"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Редкие ключи */}
          <section>
            <h3 className="text-[11px] uppercase tracking-widest text-amber-200/70 font-mono mb-2 flex items-center gap-2">
              🔑 Редкие ключи
            </h3>
            <div className="space-y-2">
              {KEY_TYPES.filter((k) => k.shopPrice).map((k) => {
                const canBuy = money >= (k.shopPrice ?? 0);
                return (
                  <div
                    key={k.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg"
                    style={{ background: k.color + "11", border: `1px solid ${k.color}44` }}
                  >
                    <span className="text-2xl" style={{ filter: `drop-shadow(0 0 4px ${k.color})` }}>
                      {k.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold" style={{ color: k.color }}>
                        {k.name}
                      </div>
                      <div className="text-[10px] text-amber-200/60 font-mono">
                        качество +{Math.round(k.qualityBoost * 100)}% · удержание {k.holdTimeMs}мс
                      </div>
                    </div>
                    <button
                      onClick={() => buyKey(k.id)}
                      disabled={!canBuy}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        canBuy
                          ? "bg-amber-700 hover:bg-amber-600 text-amber-100"
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      {(k.shopPrice ?? 0).toLocaleString("ru-RU")}💰
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-amber-200/40 mt-2 italic">
              Золотой и серебряный ключи очень редко выпадают из кликера. Здесь — за деньги.
            </p>
          </section>

          {/* Бустеры удачи */}
          <section>
            <h3 className="text-[11px] uppercase tracking-widest text-amber-200/70 font-mono mb-2 flex items-center gap-2">
              🍀 Временные бусты удачи
            </h3>
            {luckBoost && (
              <div className="mb-2 p-2 rounded-lg bg-emerald-900/30 border border-emerald-700/40 text-[11px] text-emerald-200">
                Сейчас активно: +{Math.round(luckBoost.multiplier * 100)}%. Покупка суммируется.
              </div>
            )}
            <div className="grid grid-cols-1 gap-2">
              {SHOP_BOOSTERS.map((b) => {
                const canBuy = money >= b.price;
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-900/15 border border-emerald-700/30"
                  >
                    <span className="text-2xl">{b.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-emerald-200">
                        {b.name}
                      </div>
                      <div className="text-[10px] text-amber-200/60">
                        {b.description}
                      </div>
                    </div>
                    <button
                      onClick={() => buyBooster(b.id)}
                      disabled={!canBuy}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        canBuy
                          ? "bg-emerald-700 hover:bg-emerald-600 text-emerald-100"
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      {b.price.toLocaleString("ru-RU")}💰
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* подсказка */}
          <div className="text-[10px] text-amber-200/50 italic border-t border-amber-900/30 pt-3">
            Деньги — продажа лута из инвентаря справа. Клик по предмету = продажа.
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
