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

  const [attackAnim, setAttackAnim] = useState(0); // 0..1, 0 = idle
  const [hitFlash, setHitFlash] = useState(false);

  // Анимация удара — синхронизирована с изменением lastAttackAt в store.
  // Сами тики боя идут в page.tsx (setInterval), чтобы бой работал
  // даже когда вкладка "Герой" не активна.
  const lastAttackAt = battle.lastAttackAt;
  useEffect(() => {
    if (!lastAttackAt) return;
    // запускаем анимацию в rAF, чтобы не синхронно в теле эффекта
    const raf = requestAnimationFrame(() => {
      setAttackAnim(1);
      setHitFlash(true);
    });
    const t1 = setTimeout(() => setAttackAnim(0), 200);
    const t2 = setTimeout(() => setHitFlash(false), 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [lastAttackAt]);

  const currentEnemyType = battle.currentEnemy
    ? ENEMY_TYPES.find((e) => e.id === battle.currentEnemy!.typeId)
    : null;
  const enemyHp = battle.currentEnemy?.hp ?? 0;
  const enemyMaxHp = battle.currentEnemy?.maxHp ?? 1;
  const hpPct = Math.max(0, (enemyHp / enemyMaxHp) * 100);

  const xpPct = Math.min(100, (battle.heroXp / battle.heroXpNext) * 100);

  const weaponEmoji = equippedRight?.emoji ?? "✊";

  return (
    <div className="rounded-2xl border border-zinc-700 bg-gradient-to-b from-[#15131c] to-[#08060a] p-3 md:p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono">
          Бой
        </div>
        <div className="text-[10px] text-zinc-500 font-mono">
          {battle.enemiesKilled} убито
        </div>
      </div>

      {/* Сцена боя — каменная арена склепа */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-zinc-700"
        style={{
          aspectRatio: "1 / 1",
          backgroundImage: "url('/bg/battle-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* тёмная подложка для контраста */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/80 pointer-events-none" />

        {/* кровавые пятна поверх фона для динамики */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="none">
          {/* пятна крови */}
          <ellipse cx="50" cy="190" rx="15" ry="3" fill="rgba(120,30,30,0.5)" />
          <ellipse cx="140" cy="188" rx="18" ry="3" fill="rgba(120,30,30,0.6)" />
          {/* череп на полу */}
          <g transform="translate(110, 192) scale(0.7)" opacity="0.7">
            <ellipse cx="0" cy="0" rx="6" ry="4" fill="#e7e5e4" />
            <ellipse cx="-2" cy="-1" rx="1" ry="1.5" fill="#0a0a0f" />
            <ellipse cx="2" cy="-1" rx="1" ry="1.5" fill="#0a0a0f" />
          </g>
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
            {/* латное плечо — наплечник с шипами */}
            <ellipse cx="90" cy="30" rx="16" ry="15" fill="#2a2a35" stroke="#0a0a0f" strokeWidth="1.5" />
            <ellipse cx="90" cy="28" rx="13" ry="11" fill="#3a3a45" stroke="#0a0a0f" strokeWidth="1" />
            {/* шип на наплечнике */}
            <path d="M 90 13 L 93 22 L 87 22 Z" fill="#1c1c25" stroke="#0a0a0f" strokeWidth="0.8" />
            {/* заклёпки */}
            <circle cx="84" cy="32" r="1.2" fill="#71717a" />
            <circle cx="96" cy="32" r="1.2" fill="#71717a" />

            {/* рука — латный бицепс+предплечье с сегментами */}
            <path
              d="M 88 38 Q 80 60 75 90 Q 70 120 72 150 Q 80 158 88 150 Q 92 120 90 90 Q 95 60 96 40 Z"
              fill="#3a3a45"
              stroke="#0a0a0f"
              strokeWidth="1.5"
            />
            {/* локтевой сегмент */}
            <ellipse cx="74" cy="90" rx="6" ry="5" fill="#1c1c25" stroke="#0a0a0f" strokeWidth="1" />
            {/* предплечье — латная трубка с ребрами */}
            <path d="M 71 110 L 71 140 M 76 110 L 76 140 M 80 110 L 80 140" stroke="#1c1c25" strokeWidth="0.6" />

            {/* кисть — латная перчатка */}
            <ellipse cx="80" cy="155" rx="8" ry="9" fill="#2a2a35" stroke="#0a0a0f" strokeWidth="1.5" />
            {/* суставы пальцев */}
            <circle cx="76" cy="158" r="1.5" fill="#1c1c25" />
            <circle cx="80" cy="160" r="1.5" fill="#1c1c25" />
            <circle cx="84" cy="158" r="1.5" fill="#1c1c25" />

            {/* оружие в руке — готический меч */}
            {equippedRight ? (
              <>
                {/* рукоять — обмотана тёмной кожей */}
                <rect x="78" y="155" width="5" height="14" fill="#3a2a18" stroke="#0a0a0f" strokeWidth="0.5" transform="rotate(15 80 162)" />
                <path d="M 78 158 L 82 162 M 78 162 L 82 166" stroke="#1a1208" strokeWidth="0.6" transform="rotate(15 80 162)" />
                {/* гарда — крестовина */}
                <path d="M 65 167 L 95 167 L 95 171 L 65 171 Z" fill="#71717a" stroke="#0a0a0f" strokeWidth="0.8" transform="rotate(15 80 168)" />
                {/* клинок — широкий с кровостоком */}
                <motion.path
                  d="M 80 168 L 35 110 L 38 105 L 83 163 Z"
                  fill="#cbd5e1"
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                {/* блик на клинке */}
                <path d="M 75 165 L 40 115 L 42 113 L 77 163 Z" fill="#e5e7eb" />
                {/* кровосток */}
                <path d="M 80 168 L 40 117" stroke="#71717a" strokeWidth="0.6" fill="none" />
                {/* капля крови на кончике */}
                <circle cx="36" cy="108" r="1.5" fill="#dc2626" opacity="0.85" />
              </>
            ) : (
              // латный кулак без оружия
              <ellipse cx="80" cy="158" rx="10" ry="10" fill="#2a2a35" stroke="#0a0a0f" strokeWidth="2" />
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
                <div className="w-24 h-2 bg-black/60 rounded-full overflow-hidden mt-1 border border-zinc-700">
                  <motion.div
                    className="h-full"
                    style={{ background: currentEnemyType.color }}
                    animate={{ width: `${hpPct}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div className="text-[9px] text-zinc-400 font-mono mt-0.5">
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
        <div className="absolute top-2 left-2 text-[9px] uppercase tracking-widest text-zinc-500 font-mono">
          AUTO
        </div>
      </div>

      {/* Параметры героя под картинкой */}
      <div className="mt-3 space-y-2">
        {/* Уровень + XP бар */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
            <span className="text-zinc-200 font-bold">
              Уровень {battle.heroLevel}
            </span>
            <span className="text-zinc-500">
              {battle.heroXp}/{battle.heroXpNext} XP
            </span>
          </div>
          <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-zinc-700/50">
            <motion.div
              className="h-full bg-gradient-to-r from-red-800 to-red-500"
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Статы в строку */}
        <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-mono">
          <div className="rounded bg-black/30 py-1 border border-red-900/30">
            <div className="text-red-400">⚔ АТК</div>
            <div className="text-zinc-200 font-bold">{heroStats.attack}</div>
          </div>
          <div className="rounded bg-black/30 py-1 border border-blue-900/30">
            <div className="text-blue-400">🛡 ЗАЩ</div>
            <div className="text-zinc-200 font-bold">{heroStats.defense}</div>
          </div>
          <div className="rounded bg-black/30 py-1 border border-green-900/30">
            <div className="text-green-400">💨 СКОР</div>
            <div className="text-zinc-200 font-bold">{heroStats.speed}</div>
          </div>
          <div className="rounded bg-black/30 py-1 border border-yellow-700/30">
            <div className="text-yellow-400">🍀 УДЧ</div>
            <div className="text-zinc-200 font-bold">{heroStats.luck}</div>
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
              <span className="text-yellow-400">+{battle.lastReward.money}💰</span>
              {battle.lastReward.key && <span className="text-zinc-300">+1 🗝</span>}
              <span className="text-zinc-500">за {battle.lastReward.enemyName}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
