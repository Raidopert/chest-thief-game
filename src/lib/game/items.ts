// Генератор 1000 предметов, распределённых по 7 редкостям.
// Имена формируются процедурно из префиксов + базы + суффиксов.
// Каждый предмет имеет слот экипировки (или null) и характеристики.

import {
  RARITIES,
  SET_BY_ITEM_KIND,
  type EquipSlotId,
  type ItemStats,
  type LootItem,
  type RarityId,
  RARITY_STAT_MULT,
} from "./config";

const PREFIXES = [
  "Древний", "Проклятый", "Благословенный", "Огненный", "Ледяной",
  "Громовой", "Теневой", "Звёздный", "Кровавый", "Лунный",
  "Солнечный", "Драконий", "Эльфийский", "Гномий", "Орочий",
  "Демонический", "Ангельский", "Безымянный", "Забытый", "Утраченный",
  "Королевский", "Нищенский", "Воровской", "Разбойничий", "Чёрный",
  "Белый", "Алый", "Изумрудный", "Багровый", "Пепельный",
  "Шипастый", "Парящий", "Тлеющий", "Морозный", "Жаркий",
];

const SUFFIXES = [
  "Хаоса", "Пустоты", "Света", "Тьмы", "Огня",
  "Льда", "Молний", "Тени", "Звёзд", "Крови",
  "Луны", "Солнца", "Дракона", "Эльфов", "Гномов",
  "Орков", "Демона", "Ангела", "Вечности", "Забвения",
  "Бездны", "Скорби", "Надежды", "Отчаяния", "Жадности",
  "Вора", "Короля", "Нищего", "Странника", "Палача",
];

// Базы предметов с указанием слота экипировки и характера стат
// slot: null = нельзя надеть
// kind: "weapon" | "shield" | "armor_head" | "armor_body" | "armor_waist" | "armor_feet" | "amulet" | "artifact" | "consumable"
interface BaseItem {
  name: string;
  emoji: string;
  kind: string;
}

const ITEM_BASES: BaseItem[] = [
  // Оружие (leftHand/rightHand)
  { name: "меч",     emoji: "⚔",  kind: "weapon" },
  { name: "кинжал",  emoji: "🔪", kind: "weapon" },
  { name: "посох",   emoji: "🪄", kind: "weapon" },
  { name: "молот",   emoji: "🔨", kind: "weapon" },
  { name: "копьё",   emoji: "🔱", kind: "weapon" },
  { name: "секира",  emoji: "🪓", kind: "weapon" },
  { name: "булава",  emoji: "🔱", kind: "weapon" },
  // Щиты
  { name: "щит",     emoji: "🛡", kind: "shield" },
  // Шлемы
  { name: "шлем",       emoji: "⛑", kind: "armor_head" },
  { name: "корона",     emoji: "👑", kind: "armor_head" },
  { name: "диадема",    emoji: "✨", kind: "armor_head" },
  // Нагрудники
  { name: "нагрудник",  emoji: "🛡", kind: "armor_body" },
  { name: "кираса",     emoji: "🦺", kind: "armor_body" },
  // Пояс
  { name: "пояс",       emoji: "🟫", kind: "armor_waist" },
  // Сапоги
  { name: "сапоги",     emoji: "🥾", kind: "armor_feet" },
  { name: "поножи",     emoji: "🦵", kind: "armor_feet" },
  // Амулеты
  { name: "амулет",     emoji: "📿", kind: "amulet" },
  { name: "ожерелье",   emoji: "📿", kind: "amulet" },
  // Артефакты
  { name: "кольцо",     emoji: "💍", kind: "artifact" },
  { name: "перчатки",   emoji: "🧤", kind: "artifact" },
  { name: "плащ",       emoji: "🧥", kind: "artifact" },
  { name: "наплечники", emoji: "🎽", kind: "artifact" },
  { name: "скипетр",    emoji: "🪄", kind: "artifact" },
  { name: "орб",        emoji: "🔮", kind: "artifact" },
  { name: "талисман",   emoji: "🧿", kind: "artifact" },
  { name: "печатка",    emoji: "Stamp", kind: "artifact" },
  // Расходники (не надеваются)
  { name: "зелье здоровья", emoji: "🧪", kind: "consumable" },
  { name: "зелье маны",     emoji: "💧", kind: "consumable" },
  { name: "зелье силы",     emoji: "💪", kind: "consumable" },
  { name: "зелье удачи",    emoji: "🍀", kind: "consumable" },
  { name: "зелье скорости", emoji: "💨", kind: "consumable" },
  { name: "эликсир жизни",  emoji: "🍷", kind: "consumable" },
  // Материалы (не надеваются)
  { name: "кристалл",   emoji: "💎", kind: "material" },
  { name: "руна",       emoji: "🪬", kind: "material" },
  { name: "свиток",     emoji: "📜", kind: "material" },
  { name: "фрагмент",   emoji: "🧩", kind: "material" },
  { name: "эссенция",   emoji: "🔆", kind: "material" },
  { name: "слиток",     emoji: "🪙", kind: "material" },
  // Драгоценности (артефакты — можно надеть)
  { name: "жемчужина", emoji: "🫧", kind: "artifact" },
  { name: "рубин",     emoji: "🔴", kind: "artifact" },
  { name: "сапфир",    emoji: "🔵", kind: "artifact" },
  { name: "изумруд",   emoji: "🟢", kind: "artifact" },
  { name: "алмаз",     emoji: "💎", kind: "artifact" },
  { name: "топаз",     emoji: "🟡", kind: "artifact" },
  { name: "аметист",   emoji: "🟣", kind: "artifact" },
];

// Простой детерминированный ГПСЧ для повторяемых предметов
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// Определяет слот экипировки по типу базы
function slotForKind(kind: string): EquipSlotId | null {
  switch (kind) {
    case "weapon":
    case "shield":
      // конкретная рука выбирается игроком при надевании — храним как any-hand
      // но всё равно помечаем какEquipSlotId для категории "any"
      return "leftHand"; // заглушка — real slot определяется при надевании
    case "armor_head":   return "head";
    case "armor_body":   return "body";
    case "armor_waist":  return "waist";
    case "armor_feet":   return "feet";
    case "amulet":       return "amulet";
    case "artifact":     return "artifact1"; // заглушка — реальные артефактные слоты
    default:             return null; // consumable, material
  }
}

// Категория предмета для фильтрации в UI надевания
export type ItemCategory =
  | "weapon"
  | "shield"
  | "armor_head"
  | "armor_body"
  | "armor_waist"
  | "armor_feet"
  | "amulet"
  | "artifact"
  | "consumable"
  | "material";

// Характеристики по типу базы и редкости
function statsForKind(kind: string, mult: number): ItemStats {
  const isJunk = kind === "consumable" || kind === "material";
  const atk = isJunk ? 0 : Math.max(1, Math.round(randIntStats(kind, mult, "atk")));
  const def = Math.max(0, Math.round(randIntStats(kind, mult, "def")));
  const spd = Math.max(0, Math.round(randIntStats(kind, mult, "spd")));
  const luk = Math.max(0, Math.round(randIntStats(kind, mult, "luk")));
  return { attack: atk, defense: def, speed: spd, luck: luk };
}

// детерминированный ролл стат по типу — для разнообразия используем mulberry32 с seed = kind+mult
function randIntStats(kind: string, mult: number, stat: "atk" | "def" | "spd" | "luk"): number {
  // базовые значения по типу
  const base: Record<string, { atk: number; def: number; spd: number; luk: number }> = {
    weapon:        { atk: 3, def: 0, spd: 0, luk: 0 },
    shield:        { atk: 0, def: 3, spd: 0, luk: 0 },
    armor_head:    { atk: 0, def: 2, spd: 0, luk: 1 },
    armor_body:    { atk: 0, def: 4, spd: 0, luk: 0 },
    armor_waist:   { atk: 1, def: 1, spd: 1, luk: 1 },
    armor_feet:    { atk: 0, def: 1, spd: 3, luk: 0 },
    amulet:        { atk: 0, def: 0, spd: 0, luk: 4 },
    artifact:      { atk: 1, def: 1, spd: 1, luk: 2 },
    consumable:    { atk: 0, def: 0, spd: 0, luk: 0 },
    material:      { atk: 0, def: 0, spd: 0, luk: 0 },
  };
  const b = base[kind] ?? base.artifact;
  // лёгкий разброс ±20%
  const variance = 0.8 + Math.random() * 0.5;
  return Math.floor(b[stat] * mult * variance);
}

function buildItems(): LootItem[] {
  const items: LootItem[] = [];
  const seen = new Set<string>();
  const rng = mulberry32(1337);

  for (const rarity of RARITIES) {
    const mult = RARITY_STAT_MULT[rarity.id];
    let created = 0;
    let attempts = 0;
    const target = rarity.itemCount;
    while (created < target && attempts < target * 50) {
      attempts++;
      const base = pick(ITEM_BASES, rng);
      const prefix = pick(PREFIXES, rng);
      const suffix = pick(SUFFIXES, rng);
      const tpl = Math.floor(rng() * 4);
      let name: string;
      if (tpl === 0) name = `${prefix} ${base.name}`;
      else if (tpl === 1) name = `${base.name} ${suffix.toLowerCase()}`;
      else if (tpl === 2) name = `${prefix} ${base.name} ${suffix.toLowerCase()}`;
      else name = `${base.name} «${suffix}»`;

      if (seen.has(name)) continue;
      seen.add(name);

      const value = randInt(rng, rarity.valueMin, rarity.valueMax);
      const slot = slotForKind(base.kind);
      const stats = statsForKind(base.kind, mult);
      // сет по типу базы (null для consumable/material)
      const set = slot === null ? null : (SET_BY_ITEM_KIND[base.kind] ?? null);

      items.push({
        id: `${rarity.id}-${created}`,
        name,
        rarity: rarity.id,
        emoji: base.emoji,
        baseValue: value,
        slot,
        stats,
        set,
      });
      created++;
    }
    let filler = 0;
    while (created < target) {
      const base = pick(ITEM_BASES, rng);
      const prefix = pick(PREFIXES, rng);
      const name = `${prefix} ${base.name} #${filler + 1}`;
      if (seen.has(name)) { filler++; continue; }
      seen.add(name);
      const value = randInt(rng, rarity.valueMin, rarity.valueMax);
      const slot = slotForKind(base.kind);
      const stats = statsForKind(base.kind, mult);
      const set = slot === null ? null : (SET_BY_ITEM_KIND[base.kind] ?? null);
      items.push({
        id: `${rarity.id}-${created}`,
        name,
        rarity: rarity.id,
        emoji: base.emoji,
        baseValue: value,
        slot,
        stats,
        set,
      });
      created++;
      filler++;
    }
  }

  return items;
}

export const ALL_ITEMS: LootItem[] = buildItems();

export const ITEMS_BY_RARITY: Record<RarityId, LootItem[]> = RARITIES.reduce(
  (acc, r) => {
    acc[r.id] = ALL_ITEMS.filter((i) => i.rarity === r.id);
    return acc;
  },
  {} as Record<RarityId, LootItem[]>,
);

export const TOTAL_ITEMS = ALL_ITEMS.length;

// Маппинг эмодзи на SVG иконку
const EMOJI_TO_ICON: Record<string, string> = {
  '⚔': 'sword', '🔪': 'dagger', '🏹': 'bow', '🪄': 'staff',
  '🔨': 'hammer', '🔱': 'spear', '🪓': 'axe',
  '🛡': 'shield', '⛑': 'helmet', '👑': 'crown',
  '🦺': 'armor', '🥾': 'boots', '🟫': 'belt',
  '📿': 'amulet', '💍': 'ring', '🔮': 'crystal',
  '🧪': 'potion', '💧': 'potion', '💪': 'potion',
  '🍀': 'potion', '💨': 'potion', '🍷': 'potion',
  '💎': 'crystal', '🪬': 'scroll', '📜': 'scroll',
  '🧩': 'crystal', '🔆': 'crystal', '🪙': 'crystal',
  '🧿': 'amulet', '✨': 'crystal',
};

export function getIconId(emoji: string): string | null {
  return EMOJI_TO_ICON[emoji] ?? null;
}



// Категория для надевания (используется в UI)
export function itemCategory(itemId: string): ItemCategory {
  const it = ALL_ITEMS.find((i) => i.id === itemId);
  if (!it) return "consumable";
  // восстанавливаем kind по slot/stats — проще: ищем по emoji+name
  // но у нас есть только slot. Используем slot:
  if (it.slot === null) {
    // расходник или материал — различаем по эмодзи
    if (it.emoji === "🧪" || it.emoji === "💧" || it.emoji === "💪" ||
        it.emoji === "🍀" || it.emoji === "💨" || it.emoji === "🍷") return "consumable";
    return "material";
  }
  // оружие даёт attack > 0 без defense; щит — defense > 0 без attack
  if (it.slot === "leftHand") {
    return it.stats.attack > it.stats.defense ? "weapon" : "shield";
  }
  if (it.slot === "head") return "armor_head";
  if (it.slot === "body") return "armor_body";
  if (it.slot === "waist") return "armor_waist";
  if (it.slot === "feet") return "armor_feet";
  if (it.slot === "amulet") return "amulet";
  return "artifact";
}
