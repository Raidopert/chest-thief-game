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
    dropChance: 7000,
    holdTimeMs: 400,
  },
  {
    id: "iron",
    name: "Железный ключ",
    color: "#94a3b8",
    emoji: "🔑",
    qualityBoost: 0.12,
    dropChance: 2000,
    holdTimeMs: 700,
  },
  {
    id: "bronze",
    name: "Бронзовый ключ",
    color: "#d97706",
    emoji: "🪙",
    qualityBoost: 0.28,
    dropChance: 750,
    holdTimeMs: 1100,
  },
  {
    id: "silver",
    name: "Серебряный ключ",
    color: "#e5e7eb",
    emoji: "🔮",
    qualityBoost: 0.5,
    dropChance: 220,
    holdTimeMs: 1600,
    shopPrice: 1500,
  },
  {
    id: "golden",
    name: "Золотой ключ",
    color: "#fbbf24",
    emoji: "🌟",
    qualityBoost: 0.78,
    dropChance: 30,
    holdTimeMs: 2400,
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
  color: string;       // основной цвет
  accent: string;      // акцент
  sizeRange: [number, number]; // px
  baseEmoji: string;
}

// Внешний вид сундука. НЕ коррелирует напрямую со скрытым качеством (игрок не знает)
export const CHEST_VISUALS: ChestVisual[] = [
  { id: "wooden",    name: "Деревянный",  color: "#8b5a2b", accent: "#d9a066", sizeRange: [70, 100], baseEmoji: "📦" },
  { id: "iron",      name: "Железный",    color: "#52525b", accent: "#a1a1aa", sizeRange: [80, 110], baseEmoji: "🗄" },
  { id: "mossy",     name: "Замшелый",    color: "#3f6212", accent: "#84cc16", sizeRange: [70, 105], baseEmoji: "🪵" },
  { id: "steel",     name: "Стальной",    color: "#475569", accent: "#cbd5e1", sizeRange: [85, 115], baseEmoji: "🧰" },
  { id: "silver",    name: "Серебряный",  color: "#64748b", accent: "#f1f5f9", sizeRange: [90, 120], baseEmoji: "🥈" },
  { id: "golden",    name: "Золотой",     color: "#b45309", accent: "#fde047", sizeRange: [95, 125], baseEmoji: "💼" },
  { id: "crimson",   name: "Багровый",    color: "#7f1d1d", accent: "#f87171", sizeRange: [85, 115], baseEmoji: "🩸" },
  { id: "shadow",    name: "Теневой",     color: "#1e1b29", accent: "#7c3aed", sizeRange: [80, 120], baseEmoji: "🌑" },
  { id: "azure",     name: "Лазурный",    color: "#1e3a8a", accent: "#38bdf8", sizeRange: [90, 120], baseEmoji: "🧊" },
  { id: "celestial", name: "Небесный",    color: "#581c87", accent: "#fbbf24", sizeRange: [100, 130], baseEmoji: "✨" },
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
