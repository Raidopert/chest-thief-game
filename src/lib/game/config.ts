// Конфигурация игры: редкости, ключи, сундуки, бустеры

export type RarityId =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"
  | "divine";

export interface Rarity {
  id: RarityId;
  name: string;        // русское название
  color: string;       // hex цвет
  glow: string;        // цвет свечения (rgba)
  weight: number;      // базовый вес выпадения (из 1000)
  itemCount: number;   // сколько предметов в этой редкости (в сумме 1000)
  valueMin: number;    // минимальная цена продажи
  valueMax: number;    // максимальная цена продажи
  emoji: string;       // иконка редкости
}

// 7 редкостей, веса подобраны так, чтобы сумма = 1000
export const RARITIES: Rarity[] = [
  {
    id: "common",
    name: "Обычный",
    color: "#9ca3af",
    glow: "rgba(156,163,175,0.55)",
    weight: 500,
    itemCount: 500,
    valueMin: 1,
    valueMax: 8,
    emoji: "▢",
  },
  {
    id: "uncommon",
    name: "Необычный",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.55)",
    weight: 250,
    itemCount: 250,
    valueMin: 8,
    valueMax: 35,
    emoji: "◆",
  },
  {
    id: "rare",
    name: "Редкий",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.6)",
    weight: 150,
    itemCount: 150,
    valueMin: 35,
    valueMax: 140,
    emoji: "✦",
  },
  {
    id: "epic",
    name: "Эпический",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.65)",
    weight: 70,
    itemCount: 70,
    valueMin: 140,
    valueMax: 600,
    emoji: "❖",
  },
  {
    id: "legendary",
    name: "Легендарный",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.7)",
    weight: 22,
    itemCount: 22,
    valueMin: 600,
    valueMax: 2500,
    emoji: "★",
  },
  {
    id: "mythic",
    name: "Мифический",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.75)",
    weight: 6,
    itemCount: 6,
    valueMin: 2500,
    valueMax: 12000,
    emoji: "✺",
  },
  {
    id: "divine",
    name: "Божественный",
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.9)",
    weight: 2,
    itemCount: 2,
    valueMin: 12000,
    valueMax: 60000,
    emoji: "☀",
  },
];

export const RARITY_BY_ID: Record<RarityId, Rarity> = RARITIES.reduce(
  (acc, r) => {
    acc[r.id] = r;
    return acc;
  },
  {} as Record<RarityId, Rarity>,
);

export type KeyRarity =
  | "rusty"
  | "iron"
  | "bronze"
  | "silver"
  | "golden";

export interface KeyType {
  id: KeyRarity;
  name: string;
  color: string;
  emoji: string;
  // Базовый множитель качества лута (от 0 до 1, где 1 = макс)
  qualityBoost: number;
  // Базовый шанс выпадения из кликера (из 10000)
  dropChance: number;
  // Время удержания на сундуке (мс)
  holdTimeMs: number;
  // Цена покупки в магазине (0 = нельзя купить)
  shopPrice?: number;
}

// 5 редкостей ключей. Сумма dropChance = 10000 (100% для случая когда вообще упал ключ)
export const KEY_TYPES: KeyType[] = [
  {
    id: "rusty",
    name: "Ржавый ключ",
    color: "#9ca3af",
    emoji: "🗝",
    qualityBoost: 0.0,
    dropChance: 5000,
    holdTimeMs: 400,
  },
  {
    id: "iron",
    name: "Железный ключ",
    color: "#94a3b8",
    emoji: "🔑",
    qualityBoost: 0.12,
    dropChance: 2800,
    holdTimeMs: 700,
  },
  {
    id: "bronze",
    name: "Бронзовый ключ",
    color: "#d97706",
    emoji: "🪙",
    qualityBoost: 0.28,
    dropChance: 1400,
    holdTimeMs: 1000,
  },
  {
    id: "silver",
    name: "Серебряный ключ",
    color: "#e5e7eb",
    emoji: "🔮",
    qualityBoost: 0.5,
    dropChance: 600,
    holdTimeMs: 1200,
    shopPrice: 1500,
  },
  {
    id: "golden",
    name: "Золотой ключ",
    color: "#fbbf24",
    emoji: "🌟",
    qualityBoost: 0.78,
    dropChance: 200,
    holdTimeMs: 1400,
    shopPrice: 12000,
  },
];

export const KEY_BY_ID: Record<KeyRarity, KeyType> = KEY_TYPES.reduce(
  (acc, k) => {
    acc[k.id] = k;
    return acc;
  },
  {} as Record<KeyRarity, KeyType>,
);

// Шанс, что один клик по кликеру вообще уронит ключ (остальное — просто "сила клика")
export const KEY_DROP_RATE_PER_CLICK = 0.18; // 18% за клик

export type ChestVisualKind =
  | "wooden"
  | "iron"
  | "mossy"
  | "steel"
  | "silver"
  | "golden"
  | "crimson"
  | "shadow"
  | "azure"
  | "celestial";

export interface ChestVisual {
  id: ChestVisualKind;
  name: string;
  color: string;       // основной цвет (для свечения/рамки)
  accent: string;      // акцент
  sizeRange: [number, number]; // px
  baseEmoji: string;
  image: string;       // PNG-картинка сундука
  filter: string;      // CSS-фильтр для вариации цвета
}

// Внешний вид сундука. НЕ коррелирует напрямую со скрытым качеством (игрок не знает)
// Готическая тема: 10 видов в стиле Dark Fantasy (Diablo/Bloodborne)
// 3 PNG-картинки + CSS-фильтры дают 10 разных-looking сундуков
export const CHEST_VISUALS: ChestVisual[] = [
  { id: "wooden",    name: "Гнилой",        color: "#3d2817", accent: "#7a5a3a", sizeRange: [70, 100], baseEmoji: "⚰", image: "/bg/chest-iron.png",   filter: "saturate(0.5) brightness(0.65)" },
  { id: "iron",      name: "Окованный",     color: "#27272a", accent: "#71717a", sizeRange: [80, 110], baseEmoji: "⛓", image: "/bg/chest-iron.png",   filter: "none" },
  { id: "mossy",     name: "Чумной",        color: "#365314", accent: "#84cc16", sizeRange: [70, 105], baseEmoji: "☣", image: "/bg/chest-iron.png",   filter: "hue-rotate(70deg) saturate(1.6) brightness(0.85)" },
  { id: "steel",     name: "Могильный",     color: "#3f3f46", accent: "#a1a1aa", sizeRange: [85, 115], baseEmoji: "🪦", image: "/bg/chest-iron.png",   filter: "brightness(1.25) saturate(0.4)" },
  { id: "silver",    name: "Инквизиторский",color: "#4b5563", accent: "#e5e7eb", sizeRange: [90, 120], baseEmoji: "✝", image: "/bg/chest-iron.png",   filter: "brightness(1.45) saturate(0.15) contrast(1.1)" },
  { id: "golden",    name: "Реликварий",    color: "#854d0e", accent: "#fbbf24", sizeRange: [95, 125], baseEmoji: "⛪", image: "/bg/chest-gold.png",   filter: "none" },
  { id: "crimson",   name: "Кровавый",      color: "#7f1d1d", accent: "#dc2626", sizeRange: [85, 115], baseEmoji: "🩸", image: "/bg/chest-cursed.png", filter: "hue-rotate(-15deg) brightness(1.1) saturate(1.3)" },
  { id: "shadow",    name: "Проклятый",     color: "#18181b", accent: "#7c3aed", sizeRange: [80, 120], baseEmoji: "👁", image: "/bg/chest-cursed.png", filter: "brightness(0.55) hue-rotate(40deg)" },
  { id: "azure",     name: "Ледяной",       color: "#0c4a6e", accent: "#38bdf8", sizeRange: [90, 120], baseEmoji: "❄", image: "/bg/chest-cursed.png", filter: "hue-rotate(180deg) brightness(1.15) saturate(1.2)" },
  { id: "celestial", name: "Адский",        color: "#450a0a", accent: "#f97316", sizeRange: [100, 130], baseEmoji: "🔥", image: "/bg/chest-gold.png",   filter: "hue-rotate(-30deg) brightness(1.1) saturate(1.4) contrast(1.15)" },
];

// Скрытое качество сундука (1-7) — игрок не видит, влияет на редкость лута
export const CHEST_HIDDEN_TIERS = 7;

export interface SpawnedChest {
  id: string;
  visual: ChestVisualKind;
  size: number;
  x: number;           // позиция в % от 0..100
  y: number;           // позиция в % от 0..100
  hiddenTier: number;  // 1..7 (скрытое качество)
  spawnAt: number;     // ts появления
  fadeMs: number;      // длительность появления из прозрачности
  lifeMs: number;      // полное время жизни после проявления
  opened: boolean;
  openingBy?: KeyRarity;
  openProgress: number; // 0..1 прогресс удержания
}

export interface LootItem {
  id: string;          // уникальный id предмета из списка 1000
  name: string;
  rarity: RarityId;
  emoji: string;
  baseValue: number;
  // Категория для надевания: null = нельзя надеть (зелья, материалы, драгоценности)
  slot: EquipSlotId | null;
  stats: ItemStats;
  // Сет экипировки (для bonus 2/4/6)
  set: string | null;
}

// Стэк в инвентаре
export interface InventoryStack {
  uid: string;         // уникальный id стэка
  itemId: string;
  name: string;
  rarity: RarityId;
  emoji: string;
  baseValue: number;
  count: number;
  slot: EquipSlotId | null;
  stats: ItemStats;
  set: string | null;
}

// Надетый предмет (один экземпляр, не стэк) — для equipped
export interface EquippedItemData {
  uid: string;
  itemId: string;
  name: string;
  rarity: RarityId;
  emoji: string;
  baseValue: number;
  stats: ItemStats;
  slot: EquipSlotId | null;
  set: string | null;
}

export interface LuckBoost {
  multiplier: number;  // множитель к качеству (0..1)
  untilTs: number;     // до какого timestamp действует
}

export interface ShopBooster {
  id: string;
  name: string;
  description: string;
  price: number;
  multiplier: number;
  durationMs: number;
  emoji: string;
}

export const SHOP_BOOSTERS: ShopBooster[] = [
  {
    id: "luck_minor",
    name: "Лёгкая удача",
    description: "+15% к шансу хорошего лута на 3 минуты",
    price: 300,
    multiplier: 0.15,
    durationMs: 3 * 60 * 1000,
    emoji: "🍀",
  },
  {
    id: "luck_medium",
    name: "Зелье удачи",
    description: "+30% к шансу хорошего лута на 5 минут",
    price: 900,
    multiplier: 0.3,
    durationMs: 5 * 60 * 1000,
    emoji: "⚗",
  },
  {
    id: "luck_major",
    name: "Благословение вора",
    description: "+55% к шансу хорошего лута на 10 минут",
    price: 3000,
    multiplier: 0.55,
    durationMs: 10 * 60 * 1000,
    emoji: "🙏",
  },
  {
    id: "luck_mega",
    name: "Длань судьбы",
    description: "+90% к шансу хорошего лута на 20 минут",
    price: 12000,
    multiplier: 0.9,
    durationMs: 20 * 60 * 1000,
    emoji: "👑",
  },
];

// Частота спавна сундуков (мс между попытками)
export const SPAWN_INTERVAL_MS = 1400;
// Максимальное количество сундуков на экране
export const MAX_CHESTS_ON_SCREEN = 7;
// Длительность появления из прозрачности
export const CHEST_FADE_MS_MIN = 1800;
export const CHEST_FADE_MS_MAX = 3400;
// Время жизни после полного проявления
export const CHEST_LIFE_MS_MIN = 14000;
export const CHEST_LIFE_MS_MAX = 22000;

// ============================================================================
// ЭКИПИРОВКА ГЕРОЯ
// ============================================================================

export type EquipSlotId =
  | "head"        // шлем
  | "amulet"      // ожерелье
  | "body"        // нагрудник
  | "leftHand"    // левая рука (оружие или щит) — душит воришку
  | "rightHand"   // правая рука (оружие или щит) — авто-боец
  | "waist"       // пояс
  | "feet"        // сапоги
  | "artifact1"
  | "artifact2"
  | "artifact3"
  | "artifact4"
  | "artifact5"
  | "artifact6"
  | "artifact7"
  | "artifact8"
  | "artifact9"
  | "artifact10";

export interface EquipSlot {
  id: EquipSlotId;
  name: string;
  // координаты ячейки на силуэте (в % от 0..100, центр ячейки)
  x: number;
  y: number;
  // размер ячейки (px в относительной системе 0..1 от ширины силуэта)
  w: number;  // доля от ширины
  h: number;
  // категория предметов которые можно вставить
  category: "weapon" | "shield" | "armor" | "amulet" | "artifact" | "any";
}

// 16 ячеек экипировки на силуэте героя (1 голова + 1 амулет + 1 тело + 2 руки + 1 пояс + 1 сапоги + 10 артефактов)
export const EQUIP_SLOTS: EquipSlot[] = [
  { id: "head",      name: "Голова",      x: 50, y: 12, w: 0.18, h: 0.10, category: "armor" },
  { id: "amulet",    name: "Ожерелье",    x: 50, y: 26, w: 0.14, h: 0.08, category: "amulet" },
  { id: "body",      name: "Нагрудник",   x: 50, y: 38, w: 0.22, h: 0.16, category: "armor" },
  { id: "leftHand",  name: "Левая рука",  x: 22, y: 42, w: 0.16, h: 0.12, category: "any" },
  { id: "rightHand", name: "Правая рука", x: 78, y: 42, w: 0.16, h: 0.12, category: "any" },
  { id: "waist",     name: "Пояс",        x: 50, y: 54, w: 0.20, h: 0.06, category: "armor" },
  { id: "feet",      name: "Сапоги",      x: 50, y: 82, w: 0.22, h: 0.10, category: "armor" },
  // артефакты: 2 ряда по 5 (внизу, под силуэтом)
  { id: "artifact1",  name: "Артефакт 1",  x: 12, y: 95, w: 0.12, h: 0.07, category: "artifact" },
  { id: "artifact2",  name: "Артефакт 2",  x: 31, y: 95, w: 0.12, h: 0.07, category: "artifact" },
  { id: "artifact3",  name: "Артефакт 3",  x: 50, y: 95, w: 0.12, h: 0.07, category: "artifact" },
  { id: "artifact4",  name: "Артефакт 4",  x: 69, y: 95, w: 0.12, h: 0.07, category: "artifact" },
  { id: "artifact5",  name: "Артефакт 5",  x: 88, y: 95, w: 0.12, h: 0.07, category: "artifact" },
  { id: "artifact6",  name: "Артефакт 6",  x: 12, y: 104, w: 0.12, h: 0.07, category: "artifact" },
  { id: "artifact7",  name: "Артефакт 7",  x: 31, y: 104, w: 0.12, h: 0.07, category: "artifact" },
  { id: "artifact8",  name: "Артефакт 8",  x: 50, y: 104, w: 0.12, h: 0.07, category: "artifact" },
  { id: "artifact9",  name: "Артефакт 9",  x: 69, y: 104, w: 0.12, h: 0.07, category: "artifact" },
  { id: "artifact10", name: "Артефакт 10", x: 88, y: 104, w: 0.12, h: 0.07, category: "artifact" },
];

export const ARTIFACT_SLOTS: EquipSlotId[] = [
  "artifact1", "artifact2", "artifact3", "artifact4", "artifact5",
  "artifact6", "artifact7", "artifact8", "artifact9", "artifact10",
];

// Базовые статы героя (без экипировки)
export const HERO_BASE = {
  attack: 5,      // урон авто-боя
  defense: 0,
  speed: 0,       // ускоряет интервал атаки
  luck: 0,        // добавка к luck boost
};

// ============================================================================
// АВТО-БОЙ (правая рука героя)
// ============================================================================

export interface EnemyType {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  xpReward: number;
  moneyReward: [number, number]; // [min, max]
  keyDropChance: number;         // шанс что с врага выпадет ржавый ключ
  color: string;
}

// 4 типа врагов — готическая тема Dark Fantasy, появляются поочерёдно
export const ENEMY_TYPES: EnemyType[] = [
  {
    id: "plague",
    name: "Чумной мертвец",
    emoji: "🧟",
    hp: 18,
    xpReward: 3,
    moneyReward: [1, 4],
    keyDropChance: 0.02,
    color: "#84cc16",
  },
  {
    id: "skeleton",
    name: "Скелет-воин",
    emoji: "💀",
    hp: 26,
    xpReward: 5,
    moneyReward: [2, 6],
    keyDropChance: 0.03,
    color: "#e5e7eb",
  },
  {
    id: "gargoyle",
    name: "Горгулья",
    emoji: "👹",
    hp: 42,
    xpReward: 9,
    moneyReward: [4, 12],
    keyDropChance: 0.04,
    color: "#71717a",
  },
  {
    id: "demon",
    name: "Демон",
    emoji: "👿",
    hp: 60,
    xpReward: 14,
    moneyReward: [8, 20],
    keyDropChance: 0.06,
    color: "#dc2626",
  },
];

export interface BattleEnemy {
  id: string;
  typeId: string;
  hp: number;
  maxHp: number;
  spawnAt: number;
  isElite?: boolean;
  isBoss?: boolean;
}

export interface BattleState {
  currentEnemy: BattleEnemy | null;
  heroLevel: number;
  heroXp: number;
  heroXpNext: number;
  enemiesKilled: number;
  lastAttackAt: number;
  lastReward: { xp: number; money: number; key: boolean; enemyName: string } | null;
}

// Базовый интервал атаки (мс) — уменьшается с уровнем и скоростью
export const ATTACK_INTERVAL_BASE_MS = 1100;
export const ATTACK_INTERVAL_MIN_MS = 280;
// XP для следующего уровня: 100 * level^1.4
export function xpForLevel(level: number): number {
  return Math.floor(80 * Math.pow(level, 1.4));
}

// Боссы появляются каждые N убийств
export const BOSS_INTERVAL = 25;
// Шанс элитного врага
export const ELITE_CHANCE = 0.07;
// Множители для элиты/босса
export const ELITE_HP_MULT = 2;
export const ELITE_REWARD_MULT = 2;
export const BOSS_HP_MULT = 5;
export const BOSS_REWARD_MULT = 5;
export const BOSS_KEY_DROP_CHANCE = 0.5; // босс часто даёт ключ

// ============================================================================
// ХАРАКТЕРИСТИКИ ПРЕДМЕТОВ
// ============================================================================

export interface ItemStats {
  attack: number;
  defense: number;
  speed: number;
  luck: number;
}

// Базовый множитель стат по редкости
export const RARITY_STAT_MULT: Record<RarityId, number> = {
  common: 1,
  uncommon: 2.4,
  rare: 5.5,
  epic: 12,
  legendary: 28,
  mythic: 65,
  divine: 150,
};

// ============================================================================
// СЕТЫ ЭКИПИРОВКИ
// ============================================================================
export interface EquipSet {
  id: string;
  name: string;
  color: string;
  // бонусы за 2/4/6 предметов одного сета
  bonus2: { stat: keyof ItemStats; mult: number };
  bonus4: { stat: keyof ItemStats; mult: number };
  bonus6?: { stat: keyof ItemStats; mult: number };
}

export const EQUIP_SETS: EquipSet[] = [
  {
    id: "dragon",
    name: "Драконий",
    color: "#dc2626",
    bonus2: { stat: "attack", mult: 0.15 },
    bonus4: { stat: "attack", mult: 0.35 },
    bonus6: { stat: "attack", mult: 0.7 },
  },
  {
    id: "shadow",
    name: "Теневой",
    color: "#7c3aed",
    bonus2: { stat: "luck", mult: 0.2 },
    bonus4: { stat: "luck", mult: 0.5 },
    bonus6: { stat: "luck", mult: 1.0 },
  },
  {
    id: "light",
    name: "Ангельский",
    color: "#fbbf24",
    bonus2: { stat: "defense", mult: 0.2 },
    bonus4: { stat: "defense", mult: 0.5 },
    bonus6: { stat: "defense", mult: 1.0 },
  },
  {
    id: "plague",
    name: "Чумной",
    color: "#84cc16",
    bonus2: { stat: "speed", mult: 0.2 },
    bonus4: { stat: "speed", mult: 0.5 },
    bonus6: { stat: "speed", mult: 1.0 },
  },
  {
    id: "iron",
    name: "Железный",
    color: "#a1a1aa",
    bonus2: { stat: "defense", mult: 0.15 },
    bonus4: { stat: "defense", mult: 0.35 },
  },
  {
    id: "rogue",
    name: "Воровской",
    color: "#f97316",
    bonus2: { stat: "luck", mult: 0.15 },
    bonus4: { stat: "luck", mult: 0.35 },
  },
  {
    id: "mage",
    name: "Магический",
    color: "#3b82f6",
    bonus2: { stat: "attack", mult: 0.12 },
    bonus4: { stat: "luck", mult: 0.3 },
  },
  {
    id: "royal",
    name: "Королевский",
    color: "#a855f7",
    bonus2: { stat: "attack", mult: 0.1 },
    bonus4: { stat: "defense", mult: 0.25 },
  },
];

export const SET_BY_ID: Record<string, EquipSet> = EQUIP_SETS.reduce(
  (acc, s) => { acc[s.id] = s; return acc; },
  {} as Record<string, EquipSet>,
);

// Присваиваем слотам базовые сеты (по типу предмета)
export const SET_BY_ITEM_KIND: Record<string, string> = {
  weapon:        "dragon",
  shield:        "iron",
  armor_head:    "royal",
  armor_body:    "light",
  armor_waist:   "rogue",
  armor_feet:    "plague",
  amulet:        "mage",
  artifact:      "shadow", // артефакты по умолчанию
};

// ============================================================================
// НАВЫКИ ГЕРОЯ
// ============================================================================
export interface HeroSkill {
  id: string;
  name: string;
  description: string;
  unlockLevel: number;
  // множитель эффекта при активации
  effectMult: number;
  // шанс активации (0..1)
  triggerChance: number;
  color: string;
  emoji: string;
}

export const HERO_SKILLS: HeroSkill[] = [
  {
    id: "power_strike",
    name: "Мощный удар",
    description: "+50% к урону следующего удара",
    unlockLevel: 5,
    effectMult: 1.5,
    triggerChance: 0.15,
    color: "#dc2626",
    emoji: "💥",
  },
  {
    id: "vampirism",
    name: "Вампиризм",
    description: "+50% монет при убийстве",
    unlockLevel: 10,
    effectMult: 1.5,
    triggerChance: 0.12,
    color: "#7f1d1d",
    emoji: "🩸",
  },
  {
    id: "critical",
    name: "Критический удар",
    description: "×3 урон следующего удара",
    unlockLevel: 15,
    effectMult: 3,
    triggerChance: 0.1,
    color: "#fbbf24",
    emoji: "⚡",
  },
  {
    id: "chain_lightning",
    name: "Цепная молния",
    description: "Мгновенное убийство (если HP < 30%)",
    unlockLevel: 20,
    effectMult: 999,
    triggerChance: 0.08,
    color: "#67e8f9",
    emoji: "🌩",
  },
  {
    id: "mass_attack",
    name: "Массовая атака",
    description: "×2 урон + удвоенный шанс ключа",
    unlockLevel: 25,
    effectMult: 2,
    triggerChance: 0.1,
    color: "#a855f7",
    emoji: "⚔",
  },
];

// ============================================================================
// ПОДЗЕМЕЛЬЯ / ЭТАЖИ
// ============================================================================
export const DUNGEON_KILLS_PER_FLOOR = 50;
// Линейный рост (было ×1.5 — экспонента, к 10 этажу ×58HP, непроходимо)
// Теперь ×0.8 за этаж — мягче, всегда пробивается героем
export const DUNGEON_HP_MULT_PER_FLOOR = 0.8;
export const DUNGEON_REWARD_MULT_PER_FLOOR = 0.6;
export const DUNGEON_NAMES: string[] = [
  "Склеп Тьмы",
  "Костница",
  "Чумной Корпус",
  "Катакомбы",
  "Адит Инквизиции",
  "Логово Демона",
  "Проклятый Саркофаг",
  "Сердце Бездны",
  "Трон Крови",
  "Бездна Забвения",
];

// ============================================================================
// ДОСТИЖЕНИЯ / ДЕЙЛИКИ
// ============================================================================
export interface Achievement {
  id: string;
  name: string;
  description: string;
  goal: number;
  metric: "clicks" | "chestsOpened" | "itemsFound" | "enemiesKilled" | "heroLevel" | "bossKills" | "eliteKills" | "moneyEarned";
  reward: { money: number; keys?: { rarity: KeyRarity; count: number } };
  emoji: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "click_10",      name: "Палец-Воин",        description: "10 кликов по воришке",       goal: 10,      metric: "clicks",        reward: { money: 50 }, emoji: "👆" },
  { id: "click_100",     name: "Молотильщик",       description: "100 кликов",                  goal: 100,     metric: "clicks",        reward: { money: 200, keys: { rarity: "iron", count: 1 } }, emoji: "🔨" },
  { id: "click_1000",    name: "Несчётный",          description: "1000 кликов",                 goal: 1000,    metric: "clicks",        reward: { money: 5000, keys: { rarity: "silver", count: 1 } }, emoji: "🌀" },
  { id: "chests_5",      name: "Искатель",          description: "Открой 5 сундуков",           goal: 5,       metric: "chestsOpened",  reward: { money: 100 }, emoji: "📦" },
  { id: "chests_25",     name: "Кладоискатель",     description: "Открой 25 сундуков",          goal: 25,      metric: "chestsOpened",  reward: { money: 500, keys: { rarity: "iron", count: 2 } }, emoji: "🗝" },
  { id: "chests_100",    name: "Сундук-Лорд",       description: "Открой 100 сундуков",         goal: 100,     metric: "chestsOpened",  reward: { money: 3000, keys: { rarity: "silver", count: 1 } }, emoji: "👑" },
  { id: "enemy_10",      name: "Палач",             description: "Убей 10 врагов",              goal: 10,      metric: "enemiesKilled", reward: { money: 80 }, emoji: "⚔" },
  { id: "enemy_100",     name: "Лютый",              description: "Убей 100 врагов",             goal: 100,     metric: "enemiesKilled", reward: { money: 800, keys: { rarity: "iron", count: 2 } }, emoji: "💀" },
  { id: "enemy_500",     name: "Истребитель",        description: "Убей 500 врагов",             goal: 500,     metric: "enemiesKilled", reward: { money: 5000, keys: { rarity: "silver", count: 1 } }, emoji: "☠" },
  { id: "level_5",       name: "Стажёр",            description: "Достигни уровня 5",           goal: 5,       metric: "heroLevel",     reward: { money: 200 }, emoji: "📈" },
  { id: "level_10",      name: "Ветеран",           description: "Достигни уровня 10",          goal: 10,      metric: "heroLevel",     reward: { money: 1000, keys: { rarity: "bronze", count: 1 } }, emoji: "🏆" },
  { id: "level_20",      name: "Легенда",           description: "Достигни уровня 20",          goal: 20,      metric: "heroLevel",     reward: { money: 5000, keys: { rarity: "silver", count: 1 } }, emoji: "🌟" },
  { id: "boss_1",        name: "Покоритель Боссов", description: "Убей первого босса",          goal: 1,       metric: "bossKills",     reward: { money: 500, keys: { rarity: "bronze", count: 1 } }, emoji: "👹" },
  { id: "boss_5",        name: "Убийца Громил",     description: "Убей 5 боссов",               goal: 5,       metric: "bossKills",     reward: { money: 3000, keys: { rarity: "silver", count: 1 } }, emoji: "🗡" },
  { id: "elite_5",       name: "Охотник на Элиту",  description: "Убей 5 элитных врагов",       goal: 5,       metric: "eliteKills",    reward: { money: 800, keys: { rarity: "bronze", count: 1 } }, emoji: "★" },
  { id: "money_1000",    name: "Накопитель",        description: "Заработай 1000💰",            goal: 1000,    metric: "moneyEarned",   reward: { money: 500 }, emoji: "💰" },
];

export interface DailyQuest {
  id: string;
  description: string;
  goal: number;
  metric: "clicks" | "chestsOpened" | "enemiesKilled" | "itemsFound" | "moneyEarned";
  reward: { money: number; keys?: { rarity: KeyRarity; count: number } };
  emoji: string;
}

export const DAILY_POOL: DailyQuest[] = [
  { id: "d_click_50",    description: "Кликни 50 раз по воришке",  goal: 50,    metric: "clicks",        reward: { money: 200, keys: { rarity: "iron", count: 1 } }, emoji: "👆" },
  { id: "d_click_200",   description: "Кликни 200 раз",            goal: 200,   metric: "clicks",        reward: { money: 600, keys: { rarity: "iron", count: 2 } }, emoji: "🔥" },
  { id: "d_chests_5",    description: "Открой 5 сундуков",         goal: 5,     metric: "chestsOpened",  reward: { money: 300, keys: { rarity: "iron", count: 1 } }, emoji: "📦" },
  { id: "d_chests_15",   description: "Открой 15 сундуков",        goal: 15,    metric: "chestsOpened",  reward: { money: 800, keys: { rarity: "bronze", count: 1 } }, emoji: "🗝" },
  { id: "d_enemy_20",    description: "Убей 20 врагов",            goal: 20,    metric: "enemiesKilled", reward: { money: 300, keys: { rarity: "iron", count: 1 } }, emoji: "⚔" },
  { id: "d_enemy_50",    description: "Убей 50 врагов",            goal: 50,    metric: "enemiesKilled", reward: { money: 700, keys: { rarity: "bronze", count: 1 } }, emoji: "💀" },
  { id: "d_money_500",   description: "Заработай 500💰 за день",   goal: 500,   metric: "moneyEarned",   reward: { money: 300, keys: { rarity: "iron", count: 1 } }, emoji: "💰" },
  { id: "d_items_10",    description: "Найди 10 предметов лута",  goal: 10,    metric: "itemsFound",    reward: { money: 250, keys: { rarity: "iron", count: 1 } }, emoji: "🎒" },
];

// ============================================================================
// КРАФТ / АЛТАРЬ ЖЕРТВЫ
// ============================================================================
export const CRAFT_REQUIRED = 5; // 5 одинаковых → 1 следующей редкости
export const SACRIFICE_LUCK_PER_ITEM = 0.005; // 0.5% за каждый пожертвованный предмет



// ============================================================================
// ГОТИЧЕСКАЯ UI-ПАЛИТРА (Dark Fantasy — Diablo/Bloodborne)
// ============================================================================
export const GOTHIC_UI = {
  // фоны
  bgDeep:    "#0a0a0f",   // почти чёрный с синевой
  bgStone:   "#15151c",   // тёмный камень
  bgCard:    "#1c1c25",   // карточка
  bgCardHi:  "#252531",   // подсветка карточки
  // текст
  textPri:   "#cbd5e1",   // серебристый основной
  textSec:   "#94a3b8",   // приглушённый
  textMute:  "#64748b",   // совсем тусклый
  // акценты
  blood:     "#dc2626",   // кровь (главный акцент)
  bloodDark: "#7f1d1d",
  silver:    "#cbd5e1",   // серебро
  gold:      "#d97706",   // реликвное золото
  goldLight: "#fbbf24",
  rust:      "#854d0e",   // ржавчина
  bone:      "#e7e5e4",   // кость
  // бордюры
  border:    "#3f3f46",
  borderHi:  "#71717a",
  // свечение
  glow:      "rgba(220,38,38,0.5)",
} as const;

// ============================================================================
// ПРЕСТИЖ-СИСТЕМА
// ============================================================================
// Игрок может «принести жертву» — скинуть весь прогресс (деньги, ключи, лут,
// экипировку, уровень героя, этажи) ради перманентного множителя ко всем наградам.
// Души начисляются на основе общего прогресса и НЕ сбрасываются при престиже.

export interface PrestigeConfig {
  // Сколько душ даёт каждый показатель прогресса
  soulsPerFloor: number;       // за каждый пройденный этаж подземелья
  soulsPerBoss: number;        // за каждого убитого босса
  soulsPerHeroLevel: number;  // за каждый уровень героя
  soulsPerDivine: number;      // за каждый divine предмет найденный
  // Множитель ко всем наградам = 1 + totalSouls * multPerSoul
  multPerSoul: number;
  // Минимальный прогресс для первого престижа (чтобы не престижил сразу)
  minSoulsToPrestige: number;
}

export const PRESTIGE_CONFIG: PrestigeConfig = {
  soulsPerFloor: 2,       // 10 этажей = 20 душ
  soulsPerBoss: 1,        // 5 боссов = 5 душ
  soulsPerHeroLevel: 0.5, // ур.20 = 10 душ
  soulsPerDivine: 5,      // 2 divine = 10 душ
  multPerSoul: 0.05,      // 1 душа = +5% ко всем наградам
  minSoulsToPrestige: 3,  // минимум 3 души для престижа
};

// Расчёт душ, которые игрок получит при престиже
export function calculateSoulsGained(stats: {
  enemiesKilled: number;
  bossKills: number;
  heroLevel: number;
  bestRarityFound: RarityId | null;
}): number {
  const floor = Math.floor(stats.enemiesKilled / DUNGEON_KILLS_PER_FLOOR) + 1;
  const floorsPassed = Math.max(0, floor - 1);
  const fromFloors = floorsPassed * PRESTIGE_CONFIG.soulsPerFloor;
  const fromBosses = stats.bossKills * PRESTIGE_CONFIG.soulsPerBoss;
  const fromLevel = Math.floor(stats.heroLevel * PRESTIGE_CONFIG.soulsPerHeroLevel);
  const fromDivine = stats.bestRarityFound === "divine" ? PRESTIGE_CONFIG.soulsPerDivine : 0;
  return Math.floor(fromFloors + fromBosses + fromLevel + fromDivine);
}

// Расчёт множителя престижа
export function calculatePrestigeMult(totalSouls: number): number {
  return 1 + totalSouls * PRESTIGE_CONFIG.multPerSoul;
}


