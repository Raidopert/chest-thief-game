// Генератор 1000 предметов, распределённых по 7 редкостям.
// Имена формируются процедурно из префиксов + базы + суффиксов.

import { RARITIES, type LootItem, type RarityId } from "./config";

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

// Базы предметов по категориям (русские названия + эмодзи)
interface BaseItem { name: string; emoji: string; }
const ITEM_BASES: BaseItem[] = [
  // Оружие
  { name: "меч",    emoji: "⚔" },
  { name: "кинжал", emoji: "🔪" },
  { name: "лук",    emoji: "🏹" },
  { name: "посох",  emoji: "🪄" },
  { name: "молот",  emoji: "🔨" },
  { name: "копьё",  emoji: "🔱" },
  { name: "секира", emoji: "🪓" },
  { name: "арбалет",emoji: "🎯" },
  { name: "коса",   emoji: "🪦" },
  { name: "булава", emoji: "🔱" },
  // Броня
  { name: "шлем",       emoji: "⛑" },
  { name: "нагрудник",  emoji: "🛡" },
  { name: "сапоги",     emoji: "🥾" },
  { name: "перчатки",   emoji: "🧤" },
  { name: "плащ",       emoji: "🧥" },
  { name: "щит",        emoji: "🛡" },
  { name: "поножи",     emoji: "🦵" },
  { name: "наплечники", emoji: "🎽" },
  // Артефакты
  { name: "амулет",  emoji: "📿" },
  { name: "кольцо",  emoji: "💍" },
  { name: "корона",  emoji: "👑" },
  { name: "скипетр", emoji: "杖" },
  { name: "орб",     emoji: "🔮" },
  { name: "диадема", emoji: "✨" },
  { name: "талисман",emoji: "🧿" },
  { name: "печатка", emoji: "Stamp" },
  // Зелья
  { name: "зелье здоровья", emoji: "🧪" },
  { name: "зелье маны",     emoji: "💧" },
  { name: "зелье силы",     emoji: "💪" },
  { name: "зелье удачи",    emoji: "🍀" },
  { name: "зелье скорости", emoji: "💨" },
  { name: "эликсир жизни",  emoji: "🍷" },
  { name: "настой тьмы",    emoji: "🥶" },
  { name: "отвар хаоса",    emoji: "🫙" },
  // Материалы
  { name: "кристалл",   emoji: "💎" },
  { name: "руна",       emoji: "🪬" },
  { name: "свиток",     emoji: "📜" },
  { name: "фрагмент",   emoji: "🧩" },
  { name: "эссенция",   emoji: "🔆" },
  { name: "осколок",    emoji: "💔" },
  { name: "слиток",     emoji: "🪙" },
  { name: "перо",       emoji: "🪶" },
  { name: "кость",      emoji: "🦴" },
  { name: "сердце",     emoji: "❤" },
  // Драгоценности
  { name: "жемчужина", emoji: "🫧" },
  { name: "рубин",     emoji: "🔴" },
  { name: "сапфир",    emoji: "🔵" },
  { name: "изумруд",   emoji: "🟢" },
  { name: "алмаз",     emoji: "💎" },
  { name: "топаз",     emoji: "🟡" },
  { name: "аметист",   emoji: "🟣" },
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

function buildItems(): LootItem[] {
  const items: LootItem[] = [];
  const seen = new Set<string>();
  let seed = 1337;
  const rng = mulberry32(seed);

  for (const rarity of RARITIES) {
    let created = 0;
    let attempts = 0;
    const target = rarity.itemCount;
    while (created < target && attempts < target * 50) {
      attempts++;
      const base = pick(ITEM_BASES, rng);
      const prefix = pick(PREFIXES, rng);
      const suffix = pick(SUFFIXES, rng);
      // разные шаблоны имён для разнообразия
      const tpl = Math.floor(rng() * 4);
      let name: string;
      if (tpl === 0) name = `${prefix} ${base.name}`;
      else if (tpl === 1) name = `${base.name} ${suffix.toLowerCase()}`;
      else if (tpl === 2) name = `${prefix} ${base.name} ${suffix.toLowerCase()}`;
      else name = `${base.name} «${suffix}»`;

      if (seen.has(name)) continue;
      seen.add(name);

      const value = randInt(rng, rarity.valueMin, rarity.valueMax);
      items.push({
        id: `${rarity.id}-${created}`,
        name,
        rarity: rarity.id,
        emoji: base.emoji,
        baseValue: value,
      });
      created++;
    }
    // если не хватило (мало комбинаций) — добиваем пронумерованными
    let filler = 0;
    while (created < target) {
      const base = pick(ITEM_BASES, rng);
      const prefix = pick(PREFIXES, rng);
      const name = `${prefix} ${base.name} #${filler + 1}`;
      if (seen.has(name)) { filler++; continue; }
      seen.add(name);
      const value = randInt(rng, rarity.valueMin, rarity.valueMax);
      items.push({
        id: `${rarity.id}-${created}`,
        name,
        rarity: rarity.id,
        emoji: base.emoji,
        baseValue: value,
      });
      created++;
      filler++;
    }
  }

  return items;
}

export const ALL_ITEMS: LootItem[] = buildItems();

// Кэш по редкости
export const ITEMS_BY_RARITY: Record<RarityId, LootItem[]> = RARITIES.reduce(
  (acc, r) => {
    acc[r.id] = ALL_ITEMS.filter((i) => i.rarity === r.id);
    return acc;
  },
  {} as Record<RarityId, LootItem[]>,
);

// Подтверждение количества
export const TOTAL_ITEMS = ALL_ITEMS.length;
