const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const bg = path.join(process.cwd(), 'public', 'bg');
const out = path.join(process.cwd(), 'download', 'screenshots');
fs.mkdirSync(out, { recursive: true });

const W = 1280, H = 720;

async function makeScreenshot1() {
  // "Добыча" — кликер (воришка) слева + 3 сундука справа
  const thief = await sharp(path.join(bg, 'thief-portrait.png')).resize(400, 400, { fit: 'cover' }).composite([{ input: Buffer.from('<svg width="400" height="80"><rect x="0" y="320" width="400" height="80" fill="rgba(0,0,0,0.7)"/><text x="200" y="365" font-size="16" fill="#e5e7eb" text-anchor="middle" font-family="sans-serif" font-weight="bold">БЕЙ ВОРИШКУ — ПОЛУЧАЙ КЛЮЧИ</text></svg>'), top: 0, left: 0 }]).png().toBuffer();

  const chestIron = await sharp(path.join(bg, 'chest-iron.png')).resize(220, 220, { fit: 'contain', background: { r: 8, g: 6, b: 10, alpha: 1 } }).png().toBuffer();
  const chestGold = await sharp(path.join(bg, 'chest-gold.png')).resize(220, 220, { fit: 'contain', background: { r: 8, g: 6, b: 10, alpha: 1 } }).png().toBuffer();
  const chestCursed = await sharp(path.join(bg, 'chest-cursed.png')).resize(220, 220, { fit: 'contain', background: { r: 8, g: 6, b: 10, alpha: 1 } }).png().toBuffer();

  // Заголовок
  const titleSvg = Buffer.from(`<svg width="${W}" height="60"><rect x="0" y="0" width="${W}" height="60" fill="rgba(15,13,21,0.9)"/><text x="640" y="40" font-size="24" fill="#e5e7eb" text-anchor="middle" font-family="sans-serif" font-weight="900" letter-spacing="6">СУНДУЧНЫЙ ВОР — ТЁМНОЕ ФЭНТЕЗИ</text></svg>`);

  await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 8, g: 6, b: 10, alpha: 1 } }
  })
    .composite([
      { input: thief, top: 80, left: 40 },
      { input: chestIron, top: 120, left: 500 },
      { input: chestGold, top: 120, left: 750 },
      { input: chestCursed, top: 120, left: 1000 },
      { input: Buffer.from(`<svg width="780" height="200"><rect x="0" y="0" width="780" height="200" fill="rgba(15,13,21,0.8)" rx="12"/><text x="390" y="40" font-size="14" fill="#94a3b8" text-anchor="middle" font-family="monospace" letter-spacing="3">🏹 ДОВЫЧА — КЛИКЕР И СУНДУКИ</text><text x="390" y="80" font-size="12" fill="#64748b" text-anchor="middle" font-family="monospace">Зажми сундук ключом · на поле: 3</text><text x="120" y="130" font-size="40" text-anchor="middle">⛓</text><text x="120" y="170" font-size="10" fill="#71717a" text-anchor="middle" font-family="monospace">Окованный</text><text x="370" y="130" font-size="40" text-anchor="middle">⛪</text><text x="370" y="170" font-size="10" fill="#fbbf24" text-anchor="middle" font-family="monospace">Реликварий</text><text x="620" y="130" font-size="40" text-anchor="middle">🔥</text><text x="620" y="170" font-size="10" fill="#f97316" text-anchor="middle" font-family="monospace">Адский</text></svg>`), top: 380, left: 460 },
      { input: Buffer.from(`<svg width="400" height="200"><rect x="0" y="0" width="400" height="200" fill="rgba(15,13,21,0.8)" rx="12"/><text x="200" y="40" font-size="14" fill="#94a3b8" text-anchor="middle" font-family="monospace" letter-spacing="3">🗝 КЛЮЧИ</text><text x="80" y="90" font-size="28" text-anchor="middle">🗝</text><text x="80" y="120" font-size="11" fill="#9ca3af" text-anchor="middle" font-family="monospace">×5 РЖАВЫЙ</text><text x="200" y="90" font-size="28" text-anchor="middle">🔑</text><text x="200" y="120" font-size="11" fill="#94a3b8" text-anchor="middle" font-family="monospace">×1 ЖЕЛЕЗНЫЙ</text><text x="320" y="90" font-size="28" text-anchor="middle">🔮</text><text x="320" y="120" font-size="11" fill="#e5e7eb" text-anchor="middle" font-family="monospace">×0 СЕРЕБР.</text><text x="200" y="170" font-size="10" fill="#64748b" text-anchor="middle" font-family="monospace">💰 234 · 🍀 нет</text></svg>`), top: 500, left: 40 },
      { input: titleSvg, top: 0, left: 0 },
    ])
    .png()
    .toFile(path.join(out, '01-dobycha.png'));
  console.log('✓ 01-dobycha.png');
}

async function makeScreenshot2() {
  // "Герой" — авто-бой + экипировка
  const battle = await sharp(path.join(bg, 'battle-bg.png')).resize(560, 560, { fit: 'cover' }).png().toBuffer();
  const hero = await sharp(path.join(bg, 'hero-bg.png')).resize(560, 560, { fit: 'cover' }).png().toBuffer();

  const titleSvg = Buffer.from(`<svg width="${W}" height="60"><rect x="0" y="0" width="${W}" height="60" fill="rgba(15,13,21,0.9)"/><text x="640" y="40" font-size="24" fill="#e5e7eb" text-anchor="middle" font-family="sans-serif" font-weight="900" letter-spacing="6">⚔ ГЕРОЙ — ЭКИПИРОВКА И АВТО-БОЙ</text></svg>`);

  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 8, g: 6, b: 10, alpha: 1 } } })
    .composite([
      { input: hero, top: 70, left: 40 },
      { input: battle, top: 70, left: 620 },
      { input: Buffer.from(`<svg width="560" height="40"><rect x="0" y="0" width="560" height="40" fill="rgba(15,13,21,0.8)"/><text x="280" y="28" font-size="14" fill="#94a3b8" text-anchor="middle" font-family="monospace" letter-spacing="3">ГЕРОЙ-ДУШИТЕЛЬ · УРОВЕНЬ 5</text></svg>`), top: 70, left: 40 },
      { input: Buffer.from(`<svg width="560" height="40"><rect x="0" y="0" width="560" height="40" fill="rgba(15,13,21,0.8)"/><text x="280" y="28" font-size="14" fill="#94a3b8" text-anchor="middle" font-family="monospace" letter-spacing="3">БОЙ · 47 УБИТО · СКЛЕП ТЬМЫ</text></svg>`), top: 70, left: 620 },
      { input: Buffer.from(`<svg width="${W}" height="80"><rect x="0" y="0" width="${W}" height="80" fill="rgba(15,13,21,0.85)"/><text x="200" y="30" font-size="12" fill="#ef4444" text-anchor="middle" font-family="monospace">⚔ АТК 28</text><text x="440" y="30" font-size="12" fill="#3b82f6" text-anchor="middle" font-family="monospace">🛡 ЗАЩ 12</text><text x="680" y="30" font-size="12" fill="#22c55e" text-anchor="middle" font-family="monospace">💨 СКОР 8</text><text x="920" y="30" font-size="12" fill="#fbbf24" text-anchor="middle" font-family="monospace">🍀 УДЧ 15</text><text x="640" y="60" font-size="11" fill="#a855f7" text-anchor="middle" font-family="monospace">💀 Престиж: 12 душ · ×1.60 множитель</text></svg>`), top: 640, left: 0 },
      { input: titleSvg, top: 0, left: 0 },
    ])
    .png()
    .toFile(path.join(out, '02-geroy.png'));
  console.log('✓ 02-geroy.png');
}

async function makeScreenshot3() {
  // "Сундуки" — 3 типа крупно
  const iron = await sharp(path.join(bg, 'chest-iron.png')).resize(350, 350, { fit: 'contain', background: { r: 8, g: 6, b: 10, alpha: 1 } }).png().toBuffer();
  const gold = await sharp(path.join(bg, 'chest-gold.png')).resize(350, 350, { fit: 'contain', background: { r: 8, g: 6, b: 10, alpha: 1 } }).png().toBuffer();
  const cursed = await sharp(path.join(bg, 'chest-cursed.png')).resize(350, 350, { fit: 'contain', background: { r: 8, g: 6, b: 10, alpha: 1 } }).png().toBuffer();

  const titleSvg = Buffer.from(`<svg width="${W}" height="60"><rect x="0" y="0" width="${W}" height="60" fill="rgba(15,13,21,0.9)"/><text x="640" y="40" font-size="24" fill="#e5e7eb" text-anchor="middle" font-family="sans-serif" font-weight="900" letter-spacing="6">10 ВИДОВ СУНДУКОВ · 1000 ПРЕДМЕТОВ · 7 РЕДКОСТЕЙ</text></svg>`);

  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 8, g: 6, b: 10, alpha: 1 } } })
    .composite([
      { input: iron, top: 100, left: 50 },
      { input: gold, top: 100, left: 465 },
      { input: cursed, top: 100, left: 880 },
      { input: Buffer.from(`<svg width="${W}" height="250"><text x="225" y="500" font-size="16" fill="#71717a" text-anchor="middle" font-family="monospace" font-weight="bold">Окованный</text><text x="225" y="525" font-size="11" fill="#52525b" text-anchor="middle" font-family="monospace">⛓ железо и дуб</text><text x="640" y="500" font-size="16" fill="#fbbf24" text-anchor="middle" font-family="monospace" font-weight="bold">Реликварий</text><text x="640" y="525" font-size="11" fill="#d97706" text-anchor="middle" font-family="monospace">⛪ золото и рубины</text><text x="1055" y="500" font-size="16" fill="#f97316" text-anchor="middle" font-family="monospace" font-weight="bold">Адский</text><text x="1055" y="525" font-size="11" fill="#dc2626" text-anchor="middle" font-family="monospace">🔥 обсидиан и руны</text></svg>`), top: 0, left: 0 },
      { input: titleSvg, top: 0, left: 0 },
      { input: Buffer.from(`<svg width="${W}" height="80"><rect x="0" y="0" width="${W}" height="80" fill="rgba(15,13,21,0.85)"/><text x="160" y="30" font-size="11" fill="#9ca3af" text-anchor="middle" font-family="monospace">▢ Обычный</text><text x="320" y="30" font-size="11" fill="#22c55e" text-anchor="middle" font-family="monospace">◆ Необычный</text><text x="480" y="30" font-size="11" fill="#3b82f6" text-anchor="middle" font-family="monospace">✦ Редкий</text><text x="640" y="30" font-size="11" fill="#a855f7" text-anchor="middle" font-family="monospace">❖ Эпический</text><text x="800" y="30" font-size="11" fill="#f59e0b" text-anchor="middle" font-family="monospace">★ Легендарный</text><text x="960" y="30" font-size="11" fill="#ef4444" text-anchor="middle" font-family="monospace">✺ Мифический</text><text x="1120" y="30" font-size="11" fill="#fbbf24" text-anchor="middle" font-family="monospace">☀ Божественный</text><text x="640" y="60" font-size="14" fill="#94a3b8" text-anchor="middle" font-family="monospace" letter-spacing="3">PWA · Android / iOS / ПК · офлайн · бесплатно</text></svg>`), top: 640, left: 0 },
    ])
    .png()
    .toFile(path.join(out, '03-sunduki.png'));
  console.log('✓ 03-sunduki.png');
}

(async () => {
  await makeScreenshot1();
  await makeScreenshot2();
  await makeScreenshot3();
  console.log('All screenshots done!');
})();
