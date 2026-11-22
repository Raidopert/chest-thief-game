"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import {
  ATTACK_INTERVAL_BASE_MS,
  ATTACK_INTERVAL_MIN_MS,
  ENEMY_TYPES,
  HERO_BASE,
  type ItemStats,
} from "@/lib/game/config";

// Вычисление статов героя (дублирует логику store, чтобы не вызывать селектор-функцию)
function computeStats(equipped: Record<string, { stats: ItemStats } | undefined>, heroLevel: number): ItemStats {
  let atk = HERO_BASE.attack + heroLevel;
  let def = HERO_BASE.defense;
  let spd = HERO_BASE.speed;
  let luk = HERO_BASE.luck;
  for (const key of Object.keys(equipped)) {
    const item = equipped[key];
    if (!item) continue;
    atk += item.stats.attack;
    def += item.stats.defense;
    spd += item.stats.speed;
    luk += item.stats.luck;
  }
  return { attack: atk, defense: def, speed: spd, luck: luk };
}

export default function AutoBattle() {
  const battle = useGameStore((s) => s.battle);
  const battleTick = useGameStore((s) => s.battleTick);
  const equipped = useGameStore((s) => s.equipped);
  const equippedRight = equipped.rightHand;
  const heroStats = useMemo(
    () => computeStats(equipped, battle.heroLevel),
    [equipped, battle.heroLevel],
  );
  const interval = Math.max(
    ATTACK_INTERVAL_MIN_MS,
    ATTACK_INTERVAL_BASE_MS - heroStats.speed * 25 - (battle.heroLevel - 1) * 12,
  );

  const [now, setNow] = useState(Date.now());
  const [attackAnim, setAttackAnim] = useState(0); // 0..1, 0 = idle
  const [hitFlash, setHitFlash] = useState(false);

  // основной цикл боя — каждые 60мс тикаем
  useEffect(() => {
    let raf: number;
    const tickFn = () => {
      const n = Date.now();
      setNow(n);
      battleTick(n);
      raf = requestAnimationFrame(tickFn);
    };
    raf = requestAnimationFrame(tickFn);
    return () => cancelAnimationFrame(raf);
  }, [battleTick]);

  // анимация удара — синхронизирована с интервалом атаки
  const lastAttackAt = battle.lastAttackAt;
  useEffect(() => {
    if (!lastAttackAt) return;
    // запускаем короткую анимацию
    setAttackAnim(1);
    setHitFlash(true);
    const t1 = setTimeout(() => setAttackAnim(0), 200);
    const t2 = setTimeout(() => setHitFlash(false), 150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [lastAttackAt]);

  void now; // now используется для перерисовки в RAF

  const currentEnemyType = battle.currentEnemy
    ? ENEMY_TYPES.find((e) => e.id === battle.currentEnemy!.typeId)
    : null;
  const enemyHp = battle.currentEnemy?.hp ?? 0;
  const enemyMaxHp = battle.currentEnemy?.maxHp ?? 1;
  const hpPct = Math.max(0, (enemyHp / enemyMaxHp) * 100);

  const xpPct = Math.min(100, (battle.heroXp / battle.heroXpNext) * 100);

  const weaponEmoji = equippedRight?.emoji ?? "✊";

  return (
    <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#1a1208] to-[#0e0a05] p-3 md:p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-amber-200/60 font-mono">
          Авто-боец (правая рука)
        </div>
        <div className="text-[10px] text-amber-200/40 font-mono">
          {interval}мс / удар
        </div>
      </div>

      {/* Сцена боя */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-amber-900/30"
        style={{
          aspectRatio: "1 / 1",
          background:
            "radial-gradient(ellipse at 70% 50%, #2a1d12 0%, #150e08 60%, #070504 100%)",
        }}
      >
        {/* битая земля */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
          <ellipse cx="100" cy="195" rx="80" ry="6" fill="rgba(0,0,0,0.6)" />
          {/* пятна крови/травы */}
          <ellipse cx="40" cy="190" rx="20" ry="3" fill="rgba(120,30,30,0.3)" />
          <ellipse cx="160" cy="188" rx="25" ry="3" fill="rgba(60,80,30,0.3)" />
        </svg>

        {/* рука героя с мечом — справа, от плеча до кисти */}
        <div className="absolute right-0 top-0 bottom-0 w-[45%] pointer-events-none">
          <motion.svg
            viewBox="0 0 100 200"
            className="w-full h-full"
            animate={{
              rotate: attackAnim ? [-25, 5, -25] : -25,
              x: attackAnim ? [0, -10, 0] : 0,
            }}
            transition={{ duration: 0.18 }}
            style={{ transformOrigin: "90px 30px" }}
          >
            {/* плечо */}
            <ellipse cx="90" cy="30" rx="14" ry="14" fill="#3a2a18" stroke="#5b3a1a" strokeWidth="1.5" />
            {/* доспех на плече */}
            <ellipse cx="90" cy="28" rx="12" ry="10" fill="#5b3a1a" stroke="#3a2a18" strokeWidth="1" />
            {/* рука — бицепс+предплечье */}
            <path
              d="M 88 38 Q 80 60 75 90 Q 70 120 72 150 Q 80 158 88 150 Q 92 120 90 90 Q 95 60 96 40 Z"
              fill="#3a2a18"
              stroke="#5b3a1a"
              strokeWidth="1.5"
            />
            {/* кисть */}
            <ellipse cx="80" cy="155" rx="7" ry="8" fill="#3a2a18" stroke="#5b3a1a" strokeWidth="1.5" />

            {/* оружие в руке — меч по умолчанию */}
            {equippedRight ? (
              <>
                {/* рукоять */}
                <rect x="78" y="155" width="4" height="14" fill="#5b3a1a" transform="rotate(15 80 162)" />
                {/* гарда */}
                <rect x="71" y="167" width="18" height="3" fill="#a06a2e" transform="rotate(15 80 168)" />
                {/* клинок — направлен вверх-влево от кисти */}
                <motion.path
                  d="M 80 168 L 35 110 L 38 105 L 83 163 Z"
                  fill="#d1d5db"
                  stroke="#9ca3af"
                  strokeWidth="1"
                />
                {/* блик на клинке */}
                <path d="M 75 165 L 40 115 L 42 113 L 77 163 Z" fill="#e5e7eb" />
              </>
            ) : (
              // кулак без оружия
              <ellipse cx="80" cy="158" rx="9" ry="9" fill="#3a2a18" stroke="#5b3a1a" strokeWidth="2" />
            )}
          </motion.svg>
        </div>

        {/* Враг — слева, поочерёдно */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-[45%] h-[80%] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {battle.currentEnemy && currentEnemyType && (
              <motion.div
                key={battle.currentEnemy.id}
                className="flex flex-col items-center"
                initial={{ x: -100, opacity: 0, scale: 0.6 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -40, opacity: 0, scale: 0.8, rotate: -25 }}
                transition={{ duration: 0.25 }}
              >
                <motion.div
                  className="text-5xl md:text-6xl"
                  style={{ filter: `drop-shadow(0 0 8px ${currentEnemyType.color})` }}
                  animate={hitFlash ? { x: [0, 6, -6, 0], scale: [1, 0.95, 1.05, 1] } : { x: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {currentEnemyType.emoji}
                </motion.div>
                <div
                  className="text-[10px] font-mono mt-1"
                  style={{ color: currentEnemyType.color }}
                >
                  {currentEnemyType.name}
                </div>
                {/* HP bar врага */}
                <div className="w-24 h-2 bg-black/60 rounded-full overflow-hidden mt-1 border border-amber-900/40">
                  <motion.div
                    className="h-full"
                    style={{ background: currentEnemyType.color }}
                    animate={{ width: `${hpPct}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div className="text-[9px] text-amber-200/60 font-mono mt-0.5">
                  {enemyHp}/{enemyMaxHp}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Эффект удара — вспышка на враге */}
        <AnimatePresence>
          {hitFlash && (
            <motion.div
              className="absolute left-[25%] top-1/2 -translate-y-1/2 pointer-events-none"
              initial={{ opacity: 0.8, scale: 0.5 }}
              animate={{ opacity: 0, scale: 1.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="text-3xl">💥</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* надпись авто-боя */}
        <div className="absolute top-2 left-2 text-[9px] uppercase tracking-widest text-amber-200/40 font-mono">
          AUTO
        </div>
        <div className="absolute bottom-2 right-2 text-[9px] text-amber-200/40 font-mono">
          {battle.enemiesKilled} убито
        </div>
      </div>

      {/* Параметры героя под картинкой */}
      <div className="mt-3 space-y-2">
        {/* Уровень + XP бар */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
            <span className="text-amber-300 font-bold">
              Уровень {battle.heroLevel}
            </span>
            <span className="text-amber-200/50">
              {battle.heroXp}/{battle.heroXpNext} XP
            </span>
          </div>
          <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-amber-900/30">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-700 to-amber-400"
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Статы в строку */}
        <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-mono">
          <div className="rounded bg-black/30 py-1 border border-red-900/30">
            <div className="text-red-400">⚔ АТК</div>
            <div className="text-amber-100 font-bold">{heroStats.attack}</div>
          </div>
          <div className="rounded bg-black/30 py-1 border border-blue-900/30">
            <div className="text-blue-400">🛡 ЗАЩ</div>
            <div className="text-amber-100 font-bold">{heroStats.defense}</div>
          </div>
          <div className="rounded bg-black/30 py-1 border border-green-900/30">
            <div className="text-green-400">💨 СКОР</div>
            <div className="text-amber-100 font-bold">{heroStats.speed}</div>
          </div>
          <div className="rounded bg-black/30 py-1 border border-amber-700/30">
            <div className="text-amber-400">🍀 УДЧ</div>
            <div className="text-amber-100 font-bold">{heroStats.luck}</div>
          </div>
        </div>

        {/* Последняя награда */}
        <AnimatePresence>
          {battle.lastReward && (
            <motion.div
              key={battle.enemiesKilled + "-" + battle.lastReward.enemyName}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-mono flex items-center justify-center gap-3 py-1 rounded bg-emerald-900/20 border border-emerald-900/30"
            >
              <span className="text-emerald-300">+{battle.lastReward.xp} XP</span>
              <span className="text-amber-300">+{battle.lastReward.money}💰</span>
              {battle.lastReward.key && <span className="text-zinc-300">+1 🗝</span>}
              <span className="text-amber-200/50">за {battle.lastReward.enemyName}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
