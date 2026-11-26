"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import {
  ATTACK_INTERVAL_BASE_MS,
  ATTACK_INTERVAL_MIN_MS,
  ENEMY_TYPES,
  HERO_BASE,
  HERO_SKILLS,
  type ItemStats,
} from "@/lib/game/config";
import { assetUrl } from "@/lib/utils";

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
  const [bloodParticles, setBloodParticles] = useState<
    { id: number; dx: number; dy: number; size: number; rotate: number }[]
  >([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  const lastRewardRef = useRef<{ enemyName: string } | null>(null);
  const particleCounter = useRef(0);

  // Анимация удара — синхронизирована с изменением lastAttackAt в store.
  // Сами тики боя идут в page.tsx (setInterval), чтобы бой работал
  // даже когда вкладка "Герой" не активна.
  // Полный цикл взмаха: замах → удар → отскок → возврат = 450мс.
  const lastAttackAt = battle.lastAttackAt;
  useEffect(() => {
    if (!lastAttackAt) return;
    // запускаем анимацию в rAF, чтобы не синхронно в теле эффекта
    const raf = requestAnimationFrame(() => {
      setAttackAnim(1);
      setHitFlash(true);
      // спавним частицы крови — 8-12 штук разлетающихся от врага
      const count = 8 + Math.floor(Math.random() * 5);
      const newParts = Array.from({ length: count }, () => ({
        id: ++particleCounter.current,
        dx: (Math.random() - 0.5) * 100,
        dy: -25 - Math.random() * 60,
        size: 4 + Math.random() * 6,
        rotate: (Math.random() - 0.5) * 360,
      }));
      setBloodParticles(newParts);
    });
    // Анимация меча длится 450мс — синхронизируем сброс с ней
    const t1 = setTimeout(() => setAttackAnim(0), 450);
    // Хит-флэш и след клинка гаснут чуть раньше
    const t2 = setTimeout(() => setHitFlash(false), 200);
    // Частицы крови падают под гравитацией ~800мс
    const t3 = setTimeout(() => setBloodParticles([]), 800);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [lastAttackAt]);

  // Тряска экрана при убийстве врага (когда меняется lastReward)
  useEffect(() => {
    if (!battle.lastReward) return;
    // если это новое убийство (не то же что в прошлый рендер)
    if (lastRewardRef.current && lastRewardRef.current !== battle.lastReward) {
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      // запускаем тряску в rAF, чтобы не синхронно в теле эффекта
      const raf = requestAnimationFrame(() => {
        setShakeScreen(true);
      });
      const t = setTimeout(() => setShakeScreen(false), 450);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t);
      };
    }
    lastRewardRef.current = battle.lastReward;
  }, [battle.lastReward]);

  const currentEnemyType = battle.currentEnemy
    ? ENEMY_TYPES.find((e) => e.id === battle.currentEnemy!.typeId)
    : null;
  const enemyHp = battle.currentEnemy?.hp ?? 0;
  const enemyMaxHp = battle.currentEnemy?.maxHp ?? 1;
  const hpPct = Math.max(0, (enemyHp / enemyMaxHp) * 100);

  const xpPct = Math.min(100, (battle.heroXp / battle.heroXpNext) * 100);

  const ultCooldownUntil = useGameStore((s) => s.ultCooldownUntil);
  const ultAction = useGameStore((s) => s.useUlt);
  const [ultNow, setUltNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setUltNow(Date.now()), 250); return () => clearInterval(t); }, []);
  const ultReady = ultNow >= ultCooldownUntil;
  const ultRemaining = ultReady ? 0 : Math.ceil((ultCooldownUntil - ultNow) / 1000);
  const weaponEmoji = equippedRight?.emoji ?? "✊";

  return (
    <div
      className={`rounded-2xl gothic-panel p-3 md:p-4 ${shakeScreen ? "screen-shake" : ""}`}
    >
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
          backgroundImage: `url('${assetUrl("bg/battle-bg-new.png")}')`,
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

        {/* рука героя с мечом — справа, от плеча до кисти.
            Готическая латная рука с детальным мечом.
            Анимация: замах → удар → отскок → возврат. */}
        <div className="absolute right-0 top-0 bottom-0 w-[48%] pointer-events-none">
          <motion.svg
            viewBox="0 0 100 220"
            preserveAspectRatio="xMaxYMid meet"
            className="w-full h-full"
            style={{ transformOrigin: "82px 32px", filter: attackAnim ? "drop-shadow(0 0 6px rgba(220,38,38,0.55))" : "drop-shadow(0 0 4px rgba(0,0,0,0.6))" }}
            animate={{
              rotate: attackAnim ? [-8, -28, 26, -4, -8] : -8,
              x: attackAnim ? [0, 6, -10, 2, 0] : 0,
            }}
            transition={{ duration: 0.45, times: [0, 0.22, 0.5, 0.72, 1], ease: "easeOut" }}
          >
            <defs>
              <linearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="45%" stopColor="#cbd5e1" />
                <stop offset="55%" stopColor="#f1f5f9" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
              <linearGradient id="armorGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#52525b" />
                <stop offset="50%" stopColor="#3a3a45" />
                <stop offset="100%" stopColor="#1c1c25" />
              </linearGradient>
              <radialGradient id="pauldronGrad" cx="0.35" cy="0.35" r="0.7">
                <stop offset="0%" stopColor="#52525b" />
                <stop offset="60%" stopColor="#3a3a45" />
                <stop offset="100%" stopColor="#1c1c25" />
              </radialGradient>
            </defs>

            {/* === НАПЛЕЧНИК (pauldron) с шипами === */}
            {/* Внешнее кольцо */}
            <ellipse cx="82" cy="32" rx="20" ry="18" fill="#1c1c25" stroke="#0a0a0f" strokeWidth="1.6" />
            {/* Основной купол наплечника */}
            <ellipse cx="82" cy="30" rx="17" ry="15" fill="url(#pauldronGrad)" stroke="#0a0a0f" strokeWidth="1" />
            {/* Блик на куполе */}
            <ellipse cx="76" cy="25" rx="6" ry="3.5" fill="#71717a" opacity="0.55" />
            {/* 3 шипа на наплечнике */}
            <path d="M 72 18 L 74 6 L 76 18 Z" fill="#1c1c25" stroke="#0a0a0f" strokeWidth="0.7" />
            <path d="M 82 16 L 84 4 L 86 16 Z" fill="#1c1c25" stroke="#0a0a0f" strokeWidth="0.7" />
            <path d="M 90 18 L 92 7 L 94 18 Z" fill="#1c1c25" stroke="#0a0a0f" strokeWidth="0.7" />
            {/* Заклёпки */}
            <circle cx="72" cy="34" r="1.4" fill="#a1a1aa" />
            <circle cx="92" cy="34" r="1.4" fill="#a1a1aa" />
            <circle cx="82" cy="42" r="1.4" fill="#a1a1aa" />

            {/* === ПЛЕЧО (upper arm) — сегментированный латный рукав === */}
            <path
              d="M 78 44 Q 70 70 64 96 Q 60 102 54 100 Q 60 72 72 46 Z"
              fill="url(#armorGrad)"
              stroke="#0a0a0f"
              strokeWidth="1.4"
            />
            {/* Линии сочленения пластин */}
            <path d="M 71 58 Q 68 60 67 62" stroke="#0a0a0f" strokeWidth="0.6" fill="none" />
            <path d="M 68 72 Q 65 74 64 76" stroke="#0a0a0f" strokeWidth="0.6" fill="none" />
            <path d="M 65 86 Q 62 88 61 90" stroke="#0a0a0f" strokeWidth="0.6" fill="none" />
            {/* Блик на бицепсе */}
            <path d="M 73 50 Q 70 65 66 88" stroke="#52525b" strokeWidth="0.8" fill="none" opacity="0.6" />

            {/* === ЛОКОТЬ (elbow cop) с шипом === */}
            <ellipse cx="56" cy="100" rx="10" ry="8" fill="#1c1c25" stroke="#0a0a0f" strokeWidth="1.5" />
            <ellipse cx="54" cy="98" rx="7" ry="5.5" fill="url(#armorGrad)" stroke="#0a0a0f" strokeWidth="0.9" />
            {/* Шип на локте */}
            <path d="M 47 100 L 40 95 L 47 105 Z" fill="#1c1c25" stroke="#0a0a0f" strokeWidth="0.7" />
            {/* Блик на локте */}
            <ellipse cx="51" cy="96" rx="3" ry="1.5" fill="#71717a" opacity="0.6" />

            {/* === ПРЕДПЛЕЧЬЕ (forearm) — латная трубка с рёбрами === */}
            <path
              d="M 52 108 Q 45 130 42 152 Q 47 158 53 154 Q 58 130 60 110 Z"
              fill="url(#armorGrad)"
              stroke="#0a0a0f"
              strokeWidth="1.4"
            />
            {/* Рёбра предплечья (горизонтальные линии) */}
            <line x1="46" y1="120" x2="55" y2="118" stroke="#0a0a0f" strokeWidth="0.7" />
            <line x1="44" y1="132" x2="54" y2="130" stroke="#0a0a0f" strokeWidth="0.7" />
            <line x1="42" y1="144" x2="53" y2="142" stroke="#0a0a0f" strokeWidth="0.7" />
            {/* Блик на предплечье */}
            <path d="M 56 112 Q 53 130 50 150" stroke="#52525b" strokeWidth="0.7" fill="none" opacity="0.6" />

            {/* === КИСТЬ — латная перчатка (gauntlet) === */}
            {/* Запястная манжета */}
            <rect x="38" y="152" width="16" height="7" rx="2.5" fill="#1c1c25" stroke="#0a0a0f" strokeWidth="1.2" />
            {/* Основная пластина кулака */}
            <path
              d="M 36 158 Q 36 172 44 176 Q 52 176 56 168 L 56 158 Z"
              fill="url(#armorGrad)"
              stroke="#0a0a0f"
              strokeWidth="1.4"
            />
            {/* Сочленение пальцев (вертикальные линии) */}
            <line x1="40" y1="162" x2="40" y2="172" stroke="#0a0a0f" strokeWidth="0.55" />
            <line x1="44" y1="163" x2="44" y2="174" stroke="#0a0a0f" strokeWidth="0.55" />
            <line x1="48" y1="163" x2="48" y2="174" stroke="#0a0a0f" strokeWidth="0.55" />
            <line x1="52" y1="162" x2="52" y2="170" stroke="#0a0a0f" strokeWidth="0.55" />
            {/* Большой палец */}
            <ellipse cx="58" cy="162" rx="3.5" ry="4.5" fill="url(#armorGrad)" stroke="#0a0a0f" strokeWidth="0.9" />
            {/* Блик на кулаке */}
            <ellipse cx="42" cy="161" rx="3" ry="2" fill="#71717a" opacity="0.55" />
            {/* Заклёпка на манжете */}
            <circle cx="46" cy="155.5" r="1" fill="#a1a1aa" />

            {/* === ОРУЖИЕ — готический меч или латный кулак === */}
            {equippedRight ? (
              <g>
                {/* Навершие (pommel) — бронзовый шар с гравировкой */}
                <circle cx="46" cy="178" r="4" fill="#713f12" stroke="#0a0a0f" strokeWidth="0.9" />
                <circle cx="44.5" cy="176.5" r="1.8" fill="#a16207" />
                <circle cx="46" cy="178" r="1" fill="#fbbf24" opacity="0.85" />

                {/* Рукоять — кожаная обмотка крест-накрест */}
                <rect x="43.5" y="158" width="5" height="20" rx="1.2" fill="#3a2a18" stroke="#0a0a0f" strokeWidth="0.9" />
                {/* Обмотка рукояти */}
                <line x1="43.5" y1="161" x2="48.5" y2="163" stroke="#1a1208" strokeWidth="0.55" />
                <line x1="43.5" y1="165" x2="48.5" y2="167" stroke="#1a1208" strokeWidth="0.55" />
                <line x1="43.5" y1="169" x2="48.5" y2="171" stroke="#1a1208" strokeWidth="0.55" />
                <line x1="43.5" y1="173" x2="48.5" y2="175" stroke="#1a1208" strokeWidth="0.55" />

                {/* Гарда (cross-guard) — готическая с загнутыми концами и декором */}
                <path
                  d="M 28 158 Q 22 154 26 148 L 35 152 L 46 154 L 57 152 L 66 148 Q 70 154 64 158 L 46 160 Z"
                  fill="#52525b"
                  stroke="#0a0a0f"
                  strokeWidth="1.1"
                />
                {/* Блик на гарде */}
                <path d="M 30 156 L 46 157 L 62 156" stroke="#a1a1aa" strokeWidth="0.55" fill="none" />
                {/* Центральный кабошон на гарде — аметист */}
                <circle cx="46" cy="155" r="1.7" fill="#a855f7" stroke="#0a0a0f" strokeWidth="0.4" />
                <circle cx="45.5" cy="154.5" r="0.7" fill="#d8b4fe" />

                {/* Клинок — длинный, с долом (fuller) и гравировкой */}
                {/* Основное лезвие: от гарды (46, 154) к острию (50, 24) */}
                <path
                  d="M 42 154 L 50 24 L 54 154 Z"
                  fill="url(#bladeGrad)"
                  stroke="#94a3b8"
                  strokeWidth="0.9"
                />
                {/* Дол (кровосток) — центральная линия */}
                <line x1="50" y1="32" x2="50" y2="152" stroke="#475569" strokeWidth="0.9" fill="none" />
                <line x1="50.5" y1="34" x2="50.5" y2="150" stroke="#cbd5e1" strokeWidth="0.4" fill="none" opacity="0.7" />

                {/* Блик на клинке (вертикальный) */}
                <path d="M 48 145 L 49.5 28 L 50.5 28 L 51 145 Z" fill="#f8fafc" opacity="0.55" />

                {/* Заточенное остриё (тёмный оттенок) */}
                <path d="M 47 35 L 50 24 L 53 35 Z" fill="#cbd5e1" opacity="0.75" />

                {/* Готическая гравировка на клинке — крест с кровавым камнем */}
                <path d="M 47 78 L 53 78 M 50 75 L 50 81" stroke="#1c1c25" strokeWidth="0.5" fill="none" />
                <circle cx="50" cy="78" r="1.2" fill="#dc2626" opacity="0.85" />

                {/* Вторая гравировка ниже — руна */}
                <path d="M 48 110 L 52 110 M 49 108 L 49 114 M 51 108 L 51 114" stroke="#1c1c25" strokeWidth="0.4" fill="none" opacity="0.7" />

                {/* Капля крови на острие */}
                <circle cx="50" cy="22" r="1.4" fill="#dc2626" opacity="0.9" />
                <circle cx="49.6" cy="21.5" r="0.5" fill="#fca5a5" opacity="0.7" />
              </g>
            ) : (
              /* Без оружия — латный кулак с шипами */
              <g>
                {/* Утолщённый кулак */}
                <ellipse cx="46" cy="166" rx="11" ry="12" fill="url(#armorGrad)" stroke="#0a0a0f" strokeWidth="1.6" />
                {/* Шипы на костяшках */}
                <path d="M 38 158 L 39 152 L 40 158 Z" fill="#1c1c25" stroke="#0a0a0f" strokeWidth="0.7" />
                <path d="M 43 157 L 44 151 L 45 157 Z" fill="#1c1c25" stroke="#0a0a0f" strokeWidth="0.7" />
                <path d="M 48 157 L 49 151 L 50 157 Z" fill="#1c1c25" stroke="#0a0a0f" strokeWidth="0.7" />
                <path d="M 53 158 L 54 152 L 55 158 Z" fill="#1c1c25" stroke="#0a0a0f" strokeWidth="0.7" />
                {/* Блик */}
                <ellipse cx="42" cy="160" rx="4" ry="3" fill="#71717a" opacity="0.5" />
              </g>
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
                {/* аура для элитных врагов и боссов */}
                {battle.currentEnemy.isElite && !battle.currentEnemy.isBoss && (
                  <motion.div
                    className="absolute -inset-2 rounded-full pointer-events-none"
                    style={{
                      background: "radial-gradient(circle, rgba(56,189,248,0.4) 0%, transparent 70%)",
                      boxShadow: "0 0 20px rgba(56,189,248,0.6)",
                    }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                {battle.currentEnemy.isBoss && (
                  <motion.div
                    className="absolute -inset-4 rounded-full pointer-events-none"
                    style={{
                      background: "radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%)",
                      boxShadow: "0 0 30px rgba(251,191,36,0.8)",
                    }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}

                <motion.div
                  className="text-5xl md:text-6xl relative"
                  style={{
                    filter: `drop-shadow(0 0 8px ${currentEnemyType.color})`,
                    transform: battle.currentEnemy.isBoss ? "scale(1.4)" : battle.currentEnemy.isElite ? "scale(1.15)" : "scale(1)",
                  }}
                  animate={hitFlash ? { x: [0, 6, -6, 0], scale: battle.currentEnemy.isBoss ? [1.4, 1.3, 1.45, 1.4] : battle.currentEnemy.isElite ? [1.15, 1.05, 1.2, 1.15] : [1, 0.95, 1.05, 1] } : {}}
                  transition={{ duration: 0.15 }}
                >
                  {currentEnemyType.emoji}
                </motion.div>
                <div
                  className="text-[10px] font-mono mt-1 relative font-bold"
                  style={{ color: currentEnemyType.color }}
                >
                  {battle.currentEnemy.isBoss ? "☠ БОСС: " : battle.currentEnemy.isElite ? "★ ЭЛИТА: " : ""}
                  {currentEnemyType.name}
                </div>
                {/* HP bar врага */}
                <div
                  className={`w-24 h-2 bg-black/60 rounded-full overflow-hidden mt-1 border ${
                    battle.currentEnemy.isBoss ? "border-yellow-500" : battle.currentEnemy.isElite ? "border-cyan-400" : "border-zinc-700"
                  }`}
                >
                  <motion.div
                    className="h-full"
                    style={{ background: currentEnemyType.color }}
                    animate={{ width: `${hpPct}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  {enemyHp}/{enemyMaxHp}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Частицы крови при ударе */}
        <div className="absolute left-[25%] top-1/2 -translate-y-1/2 pointer-events-none">
          {bloodParticles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: "linear-gradient(135deg, #dc2626, #7f1d1d)",
                boxShadow: "0 0 4px rgba(220,38,38,0.8)",
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: p.dx,
                y: p.dy + 60, // падает вниз под гравитацией
                opacity: [1, 1, 0],
                scale: [1, 1.2, 0.8],
                rotate: p.rotate,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ))}
        </div>

        {/* Эффект удара — вспышка на враге */}
        <AnimatePresence>
          {hitFlash && (
            <motion.div
              className="absolute left-[25%] top-1/2 -translate-y-1/2 pointer-events-none"
              initial={{ opacity: 0.85, scale: 0.5 }}
              animate={{ opacity: 0, scale: 1.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="text-3xl">💥</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* След клинка — белая дуга появляется при ударе */}
        <AnimatePresence>
          {attackAnim > 0 && (
            <motion.div
              className="absolute pointer-events-none"
              style={{
                left: "15%",
                top: "15%",
                width: "65%",
                height: "70%",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.95, 0.7, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, times: [0, 0.2, 0.5, 0.7, 1], ease: "easeOut" }}
            >
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                {/* Внешний красный glow-слой */}
                <motion.path
                  d="M 88 12 Q 50 32 15 78"
                  stroke="#dc2626"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.6"
                  style={{ filter: "blur(3px)" }}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.22, times: [0, 1], ease: "easeOut" }}
                />
                {/* Основной белый след клинка */}
                <motion.path
                  d="M 88 12 Q 50 32 15 78"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.95))" }}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
                {/* Внутренний яркий блик */}
                <motion.path
                  d="M 88 12 Q 50 32 15 78"
                  stroke="#fef2f2"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.17, ease: "easeOut" }}
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Искры от удара — маленькие белые частицы */}
        <AnimatePresence>
          {hitFlash && (
            <div className="absolute left-[25%] top-1/2 -translate-y-1/2 pointer-events-none">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={`spark-${lastAttackAt}-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: 2 + Math.random() * 2,
                    height: 2 + Math.random() * 2,
                    background: "white",
                    boxShadow: "0 0 4px rgba(255,255,255,0.9)",
                  }}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 60,
                    y: (Math.random() - 0.5) * 60,
                    opacity: [1, 0],
                  }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* надпись авто-боя */}
        <div className="absolute top-2 left-2 text-[11px] uppercase tracking-widest text-zinc-500 font-mono">
          AUTO
        </div>
      </div>

      {/* Параметры героя под картинкой */}
      <ComboIndicator />
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

        {/* Навыки героя — открываются с ростом уровня */}
        {/* Кнопка Ульт */}
        <button
          onClick={() => ultAction()}
          disabled={!ultReady}
          className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            ultReady
              ? 'bg-gradient-to-r from-amber-700 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 text-white shadow-[0_0_15px_rgba(251,191,36,0.4)] animate-pulse'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          {ultReady ? '⚡ УЛЬТ (×3 награда)' : `⚡ Перезарядка: ${ultRemaining}с`}
        </button>
        <SkillsList heroLevel={battle.heroLevel} />

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
      <style jsx>{`
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-3px, 2px); }
          20% { transform: translate(3px, -2px); }
          30% { transform: translate(-2px, -3px); }
          40% { transform: translate(2px, 3px); }
          50% { transform: translate(-3px, 1px); }
          60% { transform: translate(3px, -1px); }
          70% { transform: translate(-1px, 2px); }
          80% { transform: translate(1px, -2px); }
          90% { transform: translate(-2px, 1px); }
        }
        .screen-shake {
          animation: screenShake 0.45s ease-in-out;
        }
      `}</style>
    </div>
  );
}

// Список навыков героя с замком для заблокированных
function SkillsList({ heroLevel }: { heroLevel: number }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono mb-1">
        Навыки
      </div>
      <div className="grid grid-cols-5 gap-1">
        {HERO_SKILLS.map((skill) => {
          const unlocked = heroLevel >= skill.unlockLevel;
          return (
            <div
              key={skill.id}
              className="relative rounded-md p-1.5 text-center transition-all"
              style={{
                background: unlocked ? skill.color + "1a" : "rgba(0,0,0,0.4)",
                border: `1px solid ${unlocked ? skill.color + "88" : "#27272a"}`,
                opacity: unlocked ? 1 : 0.5,
                boxShadow: unlocked ? `0 0 8px ${skill.color}44` : "none",
              }}
              title={`${skill.name} — ${skill.description}${unlocked ? "" : ` (откроется на ур. ${skill.unlockLevel})`}`}
            >
              <div className="text-base leading-none">{unlocked ? skill.emoji : "🔒"}</div>
              <div
                className="text-[10px] font-mono leading-tight mt-0.5"
                style={{ color: unlocked ? skill.color : "#64748b" }}
              >
                {skill.name.split(" ")[0]}
              </div>
              {!unlocked && (
                <div className="text-[7px] text-zinc-600 font-mono leading-none mt-0.5">
                  ур.{skill.unlockLevel}
                </div>
              )}
              {unlocked && (
                <div className="text-[7px] text-zinc-500 font-mono leading-none mt-0.5">
                  {Math.round(skill.triggerChance * 100)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function ComboIndicator() {
  const combo = useGameStore((s) => s.combo);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);
  const active = combo.count > 0 && now - combo.lastOpenAt < 10000;
  const remaining = active ? Math.max(0, 10 - (now - combo.lastOpenAt) / 1000) : 0;
  if (!active && combo.count === 0) return null;
  return (
    <motion.div
      key={combo.count}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-lg p-2 flex items-center gap-2 border ${
        active ? 'bg-amber-950/40 border-amber-600/40' : 'bg-zinc-900/40 border-zinc-700/30 opacity-50'
      }`}
    >
      <span className="text-lg">⚡</span>
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-wider text-amber-400 font-mono font-bold">
          COMBO ×{active ? combo.count : 0}
        </div>
        <div className="h-1 bg-black/60 rounded-full overflow-hidden mt-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
            style={{ width: `${remaining * 10}%` }}
          />
        </div>
      </div>
      {active && combo.count >= 3 && (
        <span className="text-[11px] text-amber-300 font-mono">
          +{(combo.count * 10)}% редкость
        </span>
      )}
    </motion.div>
  );
}
