// Zustand store с полной игровой логикой: кликер, сундуки, лут, магазин.

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ACHIEVEMENTS,
  ATTACK_INTERVAL_BASE_MS,
  ATTACK_INTERVAL_MIN_MS,
  BOSS_INTERVAL,
  BOSS_HP_MULT,
  BOSS_KEY_DROP_CHANCE,
  BOSS_REWARD_MULT,
  calculatePrestigeMult,
  calculateSoulsGained,
  CHEST_FADE_MS_MAX,
  CHEST_FADE_MS_MIN,
  CHEST_HIDDEN_TIERS,
  CHEST_LIFE_MS_MAX,
  CHEST_LIFE_MS_MIN,
  CHEST_VISUALS,
  CRAFT_REQUIRED,
  DAILY_POOL,
  DUNGEON_HP_MULT_PER_FLOOR,
  DUNGEON_KILLS_PER_FLOOR,
  DUNGEON_NAMES,
  DUNGEON_REWARD_MULT_PER_FLOOR,
  ELITE_CHANCE,
  ELITE_HP_MULT,
  ELITE_REWARD_MULT,
  ENEMY_TYPES,
  EQUIP_SETS,
  EQUIP_SLOTS,
  HERO_BASE,
  HERO_SKILLS,
  KEY_BY_ID,
  KEY_DROP_RATE_PER_CLICK,
  KEY_TYPES,
  MAX_CHESTS_ON_SCREEN,
  RARITIES,
  RARITY_BY_ID,
  PRESTIGE_CONFIG,
  SACRIFICE_LUCK_PER_ITEM,
  SET_BY_ID,
  SHOP_BOOSTERS,
  UPGRADE_BY_ID,
  CLICKER_UPGRADES,
  EVENT_CONFIG,
  COMBO_TIMEOUT_MS,
  COMBO_BONUS_PER,
  COMBO_MAX,
  upgradePrice,
  xpForLevel,
  type Achievement,
  type BattleEnemy,
  type BattleState,
  type ChestVisualKind,
  type DailyQuest,
  type EquipSlotId,
  type InventoryStack,
  type ItemStats,
  type KeyRarity,
  type LuckBoost,
  type RarityId,
  type SpawnedChest,
} from "./config";
import { ITEMS_BY_RARITY } from "./items";

interface GameStats {
  totalClicks: number;
  chestsOpened: number;
  itemsFound: number;
  moneyEarned: number;
  bestRarityFound: RarityId | null;
  enemiesKilled: number;
  heroLevel: number;
  bossKills: number;
  eliteKills: number;
}

// Надетый предмет (один экземпляр, не стэк)
export interface EquippedItem {
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

type EquippedMap = Partial<Record<EquipSlotId, EquippedItem>>;

// Состояние одного дейлика (выбран сегодня + прогресс)
interface DailyState {
  date: string;             // YYYY-MM-DD
  quests: { id: string; progress: number; claimed: boolean }[];
}

// Состояние одного достижения
interface AchievementState {
  claimed: boolean;
}

interface GameState {
  hydrated: boolean;

  // ресурсы
  keys: Record<KeyRarity, number>;
  money: number;
  selectedKey: KeyRarity;

  // буст удачи
  luckBoost: LuckBoost | null;

  // сундуки на экране
  chests: SpawnedChest[];

  // инвентарь
  inventory: InventoryStack[];

  // надетая экипировка героя
  equipped: EquippedMap;

  // авто-бой правой руки
  battle: BattleState;

  // последний выпавший предмет (для показа анимации)
  lastDrop: { uid: string; itemId: string; name: string; rarity: RarityId; emoji: string; value: number; fromChest: string } | null;
  clearLastDrop: () => void;

  // последнее всплывающее уведомление (достижение/дейлик/крафт)
  lastNotice: { id: string; text: string; color: string; emoji: string } | null;
  clearLastNotice: () => void;

  // престиж
  prestige: { souls: number; count: number };
  prestigeReset: () => boolean;
  getPrestigeMult: () => number;
  getSoulsGained: () => number;

  // апгрейды кликера
  upgrades: Record<string, number>;
  buyUpgrade: (id: string) => boolean;

  // события/ивенты
  events: { nextGoldenChest: number; nextDemonInvasion: number; demonInvasionUntil: number };
  checkEvents: (now: number) => void;
  combo: { count: number; lastOpenAt: number };
  ultCooldownUntil: number;
  useUlt: () => boolean;

  // достижения
  achievements: Record<string, AchievementState>;

  // дейлики
  dailies: DailyState;

  // статистика
  stats: GameStats;

  // действия
  clickClicker: () => { droppedKey: KeyRarity | null; clickPower: number };
  spawnChestTick: () => void;
  pruneChests: (now: number) => void;
  canOpenChest: (chestId: string) => boolean;
  startOpening: (chestId: string) => boolean;
  updateOpeningProgress: (chestId: string, progress: number) => void;
  cancelOpening: (chestId: string) => void;
  completeOpening: (chestId: string) => InventoryStack | null;
  sellStack: (uid: string) => void;
  sellAllByRarity: (rarity: RarityId) => void;
  sellAllCommon: () => void;
  buyKey: (rarity: KeyRarity) => boolean;
  buyBooster: (boosterId: string) => boolean;
  setSelectedKey: (rarity: KeyRarity) => void;
  clearLuckIfExpired: (now: number) => void;
  setHydrated: () => void;
  resetGame: () => void;

  // экипировка
  isSlotCompatible: (itemSlot: EquipSlotId | null, targetSlot: EquipSlotId) => boolean;
  equipItem: (stackUid: string, targetSlot: EquipSlotId) => boolean;
  unequipSlot: (slot: EquipSlotId) => void;
  computeHeroStats: () => ItemStats;
  computeAttackIntervalMs: () => number;
  computeActiveSets: () => { setId: string; count: number; bonus2: boolean; bonus4: boolean; bonus6: boolean }[];

  // крафт и жертва
  craftItems: (itemId: string) => boolean;
  sacrificeItem: (uid: string, count: number) => boolean;

  // достижения и дейлики
  claimAchievement: (id: string) => boolean;
  claimDaily: (id: string) => boolean;
  resetDailiesIfNewDay: () => void;

  // авто-бой
  spawnEnemy: () => void;
  battleTick: (now: number) => void;
}

// Утилиты рандома
function randRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number): number {
  return Math.floor(randRange(min, max + 1));
}
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let chestCounter = 0;
function newChestId(): string {
  chestCounter++;
  return `chest-${Date.now()}-${chestCounter}`;
}

function rollKeyFromClick(prestigeMult = 1): KeyRarity | null {
  // сначала проверим, упадёт ли вообще ключ (с учётом множителя престижа)
  if (Math.random() > KEY_DROP_RATE_PER_CLICK * prestigeMult) return null;
  // если упал — выбираем редкость по dropChance
  const total = KEY_TYPES.reduce((s, k) => s + k.dropChance, 0);
  let r = Math.random() * total;
  for (const k of KEY_TYPES) {
    r -= k.dropChance;
    if (r <= 0) return k.id;
  }
  return "rusty";
}

// Ролл редкости лута с учётом ключа, скрытого тира сундука, буста удачи и тёмной силы
function rollLootRarity(
  keyRarity: KeyRarity,
  hiddenTier: number,
  luckBoost: LuckBoost | null,
  darkForceLevel = 0,
): RarityId {
  const key = KEY_BY_ID[keyRarity];
  const keyQ = key.qualityBoost;
  const chestQ = ((hiddenTier - 1) / (CHEST_HIDDEN_TIERS - 1)) * 0.45; // 0..0.45
  const boostQ = (luckBoost?.multiplier ?? 0) * 0.4;
  // Тёмная сила: +10% за уровень к quality boost
  const darkQ = darkForceLevel * 0.1;
  const q = Math.min(0.95, keyQ + chestQ + boostQ + darkQ);

  const weights = RARITIES.map((r) => ({ id: r.id, w: r.weight }));
  // подавляем common, усиливаем высокие редкости пропорционально q
  weights.forEach((entry, idx) => {
    if (idx === 0) {
      entry.w *= Math.max(0.04, 1 - q * 0.9);
    } else {
      // каждая следующая редкость получает больший буст
      const shift = 1 + q * Math.pow(idx, 1.35) * 0.9;
      entry.w *= shift;
    }
  });

  const total = weights.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  for (const entry of weights) {
    r -= entry.w;
    if (r <= 0) return entry.id;
  }
  return weights[0].id;
}

function pickLootItem(rarity: RarityId) {
  const pool = ITEMS_BY_RARITY[rarity];
  return pickRandom(pool);
}

function findStackFor(inventory: InventoryStack[], itemId: string): InventoryStack | null {
  return inventory.find((s) => s.itemId === itemId) ?? null;
}

const initialKeys: Record<KeyRarity, number> = {
  rusty: 3,
  iron: 0,
  bronze: 0,
  silver: 0,
  golden: 0,
};

const BEST_RARITY_ORDER: RarityId[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "divine",
];

function rarityRank(r: RarityId): number {
  return BEST_RARITY_ORDER.indexOf(r);
}

// Совместимость слота предмета с целевым слотом экипировки
function isSlotCompatibleFn(itemSlot: EquipSlotId | null, targetSlot: EquipSlotId): boolean {
  if (!itemSlot) return false;
  // Артефакты — можно в любой artifact-слот
  if (targetSlot.startsWith("artifact") && itemSlot.startsWith("artifact")) return true;
  // Оружие/щит (leftHand-категория) — можно в любую руку
  if (itemSlot === "leftHand" && (targetSlot === "leftHand" || targetSlot === "rightHand")) return true;
  // Прочее — точное совпадение
  return itemSlot === targetSlot;
}

// Создаёт врага по случайному типу. На каждом BOSS_INTERVAL-убийстве спавним
// босса (5x HP, 5x награда), иначе с шансом ELITE_CHANCE — элитного (2x).
// HP врага дополнительно множится на этаж подземелья (×1.5 за каждый этаж).
function makeEnemy(enemiesKilled: number, demonInvasionUntil: number = 0): BattleEnemy {
  const isInvasion = demonInvasionUntil > 0 && Date.now() < demonInvasionUntil;
  const t = isInvasion ? ENEMY_TYPES.find(e => e.id === "demon")! : pickRandom(ENEMY_TYPES);
  const isBoss = enemiesKilled > 0 && enemiesKilled % BOSS_INTERVAL === 0;
  const isElite = !isBoss && Math.random() < ELITE_CHANCE;
  const floor = getCurrentFloor(enemiesKilled);
  const floorMult = floorHpMult(floor);
  let hp = t.hp;
  if (isBoss) hp = Math.round(t.hp * BOSS_HP_MULT * floorMult);
  else if (isElite) hp = Math.round(t.hp * ELITE_HP_MULT * floorMult);
  else hp = Math.round(t.hp * floorMult);
  if (isInvasion) hp = Math.round(hp * EVENT_CONFIG.demonHpMult);
  return {
    id: `enemy-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    typeId: t.id,
    hp,
    maxHp: hp,
    spawnAt: Date.now(),
    isElite,
    isBoss,
  };
}

// Суммарные статы героя с учётом сет-бонусов
function computeHeroStatsFn(equipped: EquippedMap, heroLevel: number): ItemStats {
  let atk = HERO_BASE.attack + heroLevel;
  let def = HERO_BASE.defense;
  let spd = HERO_BASE.speed;
  let luk = HERO_BASE.luck;
  for (const key of Object.keys(equipped) as EquipSlotId[]) {
    const item = equipped[key];
    if (!item) continue;
    atk += item.stats.attack;
    def += item.stats.defense;
    spd += item.stats.speed;
    luk += item.stats.luck;
  }
  // сет-бонусы
  const setCounts: Record<string, number> = {};
  for (const key of Object.keys(equipped) as EquipSlotId[]) {
    const item = equipped[key];
    if (item?.set) setCounts[item.set] = (setCounts[item.set] ?? 0) + 1;
  }
  for (const setId of Object.keys(setCounts)) {
    const def_set = SET_BY_ID[setId];
    if (!def_set) continue;
    const cnt = setCounts[setId];
    let bonus: { stat: keyof ItemStats; mult: number } | undefined;
    if (cnt >= 6 && def_set.bonus6) bonus = def_set.bonus6;
    else if (cnt >= 4) bonus = def_set.bonus4;
    else if (cnt >= 2) bonus = def_set.bonus2;
    if (!bonus) continue;
    if (bonus.stat === "attack") atk = Math.round(atk * (1 + bonus.mult));
    else if (bonus.stat === "defense") def = Math.round(def * (1 + bonus.mult));
    else if (bonus.stat === "speed") spd = Math.round(spd * (1 + bonus.mult));
    else if (bonus.stat === "luck") luk = Math.round(luk * (1 + bonus.mult));
  }
  return { attack: atk, defense: def, speed: spd, luck: luk };
}

// Текущий этаж подземелья (1+)
function getCurrentFloor(enemiesKilled: number): number {
  return Math.floor(enemiesKilled / DUNGEON_KILLS_PER_FLOOR) + 1;
}
// Множитель HP для текущего этажа
function floorHpMult(floor: number): number {
  return Math.pow(DUNGEON_HP_MULT_PER_FLOOR, floor - 1);
}
// Множитель награды для текущего этажа
function floorRewardMult(floor: number): number {
  return Math.pow(DUNGEON_REWARD_MULT_PER_FLOOR, floor - 1);
}

// Дата в формате YYYY-MM-DD (локально)
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

// Генерация 3 случайных дейликов на сегодня
function rollDailyQuests(): { id: string; progress: number; claimed: boolean }[] {
  const pool = [...DAILY_POOL];
  const picked: { id: string; progress: number; claimed: boolean }[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push({ id: pool[idx].id, progress: 0, claimed: false });
    pool.splice(idx, 1);
  }
  return picked;
}

// Метрики для достижений/дейликов — получают значение из stats
function getMetricValue(stats: GameStats, metric: Achievement["metric"]): number {
  switch (metric) {
    case "clicks": return stats.totalClicks;
    case "chestsOpened": return stats.chestsOpened;
    case "itemsFound": return stats.itemsFound;
    case "enemiesKilled": return stats.enemiesKilled;
    case "heroLevel": return stats.heroLevel;
    case "bossKills": return stats.bossKills;
    case "eliteKills": return stats.eliteKills;
    case "moneyEarned": return stats.moneyEarned;
  }
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      hydrated: false,

      keys: { ...initialKeys },
      money: 0,
      selectedKey: "rusty",
      luckBoost: null,
      chests: [],
      inventory: [],
      equipped: {},
      battle: {
        currentEnemy: null,
        heroLevel: 1,
        heroXp: 0,
        heroXpNext: xpForLevel(1),
        enemiesKilled: 0,
        lastAttackAt: 0,
        lastReward: null,
      },
      lastDrop: null,
      lastNotice: null,
      prestige: { souls: 0, count: 0 },
      upgrades: {},
      events: {
        nextGoldenChest: Date.now() + 60_000,
        nextDemonInvasion: Date.now() + EVENT_CONFIG.demonInvasionInterval,
        demonInvasionUntil: 0,
      },
      combo: { count: 0, lastOpenAt: 0 },
      ultCooldownUntil: 0,
      achievements: {},
      dailies: { date: todayStr(), quests: rollDailyQuests() },
      stats: {
        totalClicks: 0,
        chestsOpened: 0,
        itemsFound: 0,
        moneyEarned: 0,
        bestRarityFound: null,
        enemiesKilled: 0,
        heroLevel: 1,
        bossKills: 0,
        eliteKills: 0,
      },

      clickClicker: () => {
        const state = get();
        const prestigeMult = calculatePrestigeMult(state.prestige.souls);
        // Апгрейд: Стальная тетива — +5% за уровень к шансу ключа
        const steelLevel = state.upgrades.steel_string ?? 0;
        // Апгрейд: Кровавые монеты — +1💰 за уровень
        const bloodLevel = state.upgrades.blood_coins ?? 0;
        // Апгрейд: Двойной ключ — 5% за уровень шанс 2 ключей
        const doubleKeyLevel = state.upgrades.double_key ?? 0;
        const droppedKey = rollKeyFromClick(prestigeMult * (1 + steelLevel * 0.05));
        // Деньги за клик (кровавые монеты)
        const clickMoney = bloodLevel;
        if (droppedKey) {
          // шанс двойного ключа
          const isDouble = Math.random() < doubleKeyLevel * 0.05;
          const keyCount = isDouble ? 2 : 1;
          set({
            keys: { ...state.keys, [droppedKey]: state.keys[droppedKey] + keyCount },
            money: state.money + clickMoney,
            stats: { ...state.stats, totalClicks: state.stats.totalClicks + 1, moneyEarned: state.stats.moneyEarned + clickMoney },
          });
        } else {
          set({
            money: state.money + clickMoney,
            stats: { ...state.stats, totalClicks: state.stats.totalClicks + 1, moneyEarned: state.stats.moneyEarned + clickMoney },
          });
        }
        return { droppedKey, clickPower: 1 };
      },

      spawnChestTick: () => {
        const state = get();
        if (state.chests.length >= MAX_CHESTS_ON_SCREEN) return;
        const visual: ChestVisualKind = pickRandom(CHEST_VISUALS).id;
        const visualDef = CHEST_VISUALS.find((v) => v.id === visual)!;
        const size = Math.round(randRange(visualDef.sizeRange[0], visualDef.sizeRange[1]));

        // Анти-пересечение сундуков — используем прямоугольную проверку
        // с запасом по размеру сундука. Поле ~700×400px, сундук до 130px.
        // В процентах: 130px / 700px ≈ 19% ширины, 130px / 400px ≈ 33% высоты.
        // Минимальное расстояние = половина суммы размеров двух сундуков + 5% зазор.
        const MIN_DIST_X = 28; // % по горизонтали (сундук + зазор)
        const MIN_DIST_Y = 40; // % по вертикали (поле короче, сундуки крупнее относительно)
        let chosenX = 0;
        let chosenY = 0;
        let foundValid = false;
        const activeChests = state.chests.filter((c) => !c.opened);
        for (let attempt = 0; attempt < 50; attempt++) {
          const x = randRange(6, 84);
          const y = randRange(18, 76);
          let ok = true;
          for (const c of activeChests) {
            const dx = Math.abs(c.x - x);
            const dy = Math.abs(c.y - y);
            // Пересечение только если оба расстояния меньше минимальных
            if (dx < MIN_DIST_X && dy < MIN_DIST_Y) {
              ok = false;
              break;
            }
          }
          if (ok) {
            chosenX = x;
            chosenY = y;
            foundValid = true;
            break;
          }
          chosenX = x;
          chosenY = y;
        }
        // Если не нашли свободное место — не спавним, чтобы не наслаивать.
        if (!foundValid) return;

        const hiddenTier = randInt(1, CHEST_HIDDEN_TIERS);
        const fadeMs = Math.round(randRange(CHEST_FADE_MS_MIN, CHEST_FADE_MS_MAX));
        const lifeMs = Math.round(randRange(CHEST_LIFE_MS_MIN, CHEST_LIFE_MS_MAX));
        const chest: SpawnedChest = {
          id: newChestId(),
          visual,
          size,
          x: chosenX,
          y: chosenY,
          hiddenTier,
          spawnAt: Date.now(),
          fadeMs,
          lifeMs,
          opened: false,
          openProgress: 0,
        };
        set({ chests: [...state.chests, chest] });
      },

      pruneChests: (now) => {
        const state = get();
        const kept = state.chests.filter((c) => {
          if (c.opened) return false; // открытые сразу удаляются после анимации
          const age = now - c.spawnAt;
          // живёт fadeMs + lifeMs
          if (age > c.fadeMs + c.lifeMs) return false;
          return true;
        });
        if (kept.length !== state.chests.length) {
          set({ chests: kept });
        }
      },

      canOpenChest: (chestId) => {
        const state = get();
        const chest = state.chests.find((c) => c.id === chestId);
        if (!chest || chest.opened) return false;
        // должен быть полностью проявлен
        const age = Date.now() - chest.spawnAt;
        if (age < chest.fadeMs) return false;
        // и не истёк
        if (age > chest.fadeMs + chest.lifeMs) return false;
        // выбранный ключ должен быть в наличии
        if (state.keys[state.selectedKey] <= 0) return false;
        return true;
      },

      startOpening: (chestId) => {
        const state = get();
        if (!state.canOpenChest(chestId)) return false;
        const chest = state.chests.find((c) => c.id === chestId)!;
        set({
          chests: state.chests.map((c) =>
            c.id === chestId ? { ...c, openingBy: state.selectedKey, openProgress: 0 } : c,
          ),
        });
        return true;
      },

      updateOpeningProgress: (chestId, progress) => {
        const state = get();
        const chest = state.chests.find((c) => c.id === chestId);
        if (!chest || !chest.openingBy) return;
        set({
          chests: state.chests.map((c) =>
            c.id === chestId ? { ...c, openProgress: progress } : c,
          ),
        });
      },

      cancelOpening: (chestId) => {
        const state = get();
        const chest = state.chests.find((c) => c.id === chestId);
        if (!chest || !chest.openingBy) return;
        set({
          chests: state.chests.map((c) =>
            c.id === chestId ? { ...c, openingBy: undefined, openProgress: 0 } : c,
          ),
        });
      },

      completeOpening: (chestId) => {
        const state = get();
        const chest = state.chests.find((c) => c.id === chestId);
        if (!chest || !chest.openingBy || chest.opened) return null;
        const keyRarity = chest.openingBy;
        // списываем ключ
        if (state.keys[keyRarity] <= 0) {
          // на всякий случай — кто-то открыл двумя пальцами
          set({
            chests: state.chests.map((c) =>
              c.id === chestId ? { ...c, openingBy: undefined, openProgress: 0 } : c,
            ),
          });
          return null;
        }
        const newKeys = { ...state.keys, [keyRarity]: state.keys[keyRarity] - 1 };
        // Combo Chain бонус
        const comboCount = state.combo.count;
        const comboBonus = Math.min(COMBO_MAX, comboCount) * COMBO_BONUS_PER;
        let rarity = rollLootRarity(keyRarity, chest.hiddenTier, state.luckBoost, state.upgrades.dark_force ?? 0);
        // Золотой сундук — гарантированный epic+
        if (chest.isGolden) {
          const minRank = 3; // epic
          if (rarityRank(rarity) < minRank) {
            // перероллим пока не получим epic+
            const epicPool = RARITIES.filter(r => rarityRank(r.id) >= minRank);
            rarity = pickRandom(epicPool).id;
          }
        }
        // Combo: повышаем редкость если ролл был низкий
        if (comboBonus > 0 && rarityRank(rarity) < 6) {
          // шанс повысить редкость на 1 ступень
          if (Math.random() < comboBonus) {
            const nextRank = Math.min(6, rarityRank(rarity) + 1);
            rarity = BEST_RARITY_ORDER[nextRank];
          }
        }
        const item = pickLootItem(rarity);
        const uid = `stack-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const newStack: InventoryStack = {
          uid,
          itemId: item.id,
          name: item.name,
          rarity: item.rarity,
          emoji: item.emoji,
          baseValue: item.baseValue,
          count: 1,
          slot: item.slot,
          stats: item.stats,
          set: item.set,
        };

        // мерж в инвентарь
        const existing = findStackFor(state.inventory, item.id);
        let newInventory: InventoryStack[];
        if (existing) {
          newInventory = state.inventory.map((s) =>
            s.itemId === item.id ? { ...s, count: s.count + 1 } : s,
          );
        } else {
          newInventory = [...state.inventory, newStack];
        }

        const bestRarity =
          state.stats.bestRarityFound == null ||
          rarityRank(rarity) > rarityRank(state.stats.bestRarityFound)
            ? rarity
            : state.stats.bestRarityFound;

        set({
          keys: newKeys,
          inventory: newInventory,
          chests: state.chests.map((c) =>
            c.id === chestId ? { ...c, opened: true, openProgress: 1 } : c,
          ),
          lastDrop: {
            uid,
            itemId: item.id,
            name: item.name,
            rarity: item.rarity,
            emoji: item.emoji,
            value: item.baseValue,
            fromChest: chestId,
          },
          stats: {
            ...state.stats,
            chestsOpened: state.stats.chestsOpened + 1,
            itemsFound: state.stats.itemsFound + 1,
            bestRarityFound: bestRarity,
          },
        });
        return existing ? { ...existing, count: existing.count + 1 } : newStack;
      },

      sellStack: (uid) => {
        const state = get();
        const stack = state.inventory.find((s) => s.uid === uid || s.itemId === uid);
        if (!stack) return;
        const earn = stack.baseValue * stack.count;
        set({
          inventory: state.inventory.filter((s) => s.uid !== stack.uid),
          money: state.money + earn,
          stats: { ...state.stats, moneyEarned: state.stats.moneyEarned + earn },
        });
      },

      sellAllByRarity: (rarity) => {
        const state = get();
        const toSell = state.inventory.filter((s) => s.rarity === rarity);
        if (toSell.length === 0) return;
        const earn = toSell.reduce((s, st) => s + st.baseValue * st.count, 0);
        set({
          inventory: state.inventory.filter((s) => s.rarity !== rarity),
          money: state.money + earn,
          stats: { ...state.stats, moneyEarned: state.stats.moneyEarned + earn },
        });
      },

      sellAllCommon: () => {
        get().sellAllByRarity("common");
      },

      buyKey: (rarity) => {
        const state = get();
        const key = KEY_BY_ID[rarity];
        if (!key.shopPrice) return false;
        if (state.money < key.shopPrice) return false;
        set({
          money: state.money - key.shopPrice,
          keys: { ...state.keys, [rarity]: state.keys[rarity] + 1 },
        });
        return true;
      },

      buyBooster: (boosterId) => {
        const state = get();
        const booster = SHOP_BOOSTERS.find((b) => b.id === boosterId);
        if (!booster) return false;
        if (state.money < booster.price) return false;
        const now = Date.now();
        // если уже есть активный буст — продлеваем/усиливаем
        const existing = state.luckBoost;
        let newBoost: LuckBoost;
        if (existing && existing.untilTs > now) {
          // складываем множители (с капом 0.95) и продлеваем
          const combined = Math.min(0.95, existing.multiplier + booster.multiplier);
          newBoost = {
            multiplier: combined,
            untilTs: Math.max(existing.untilTs, now + booster.durationMs),
          };
        } else {
          newBoost = {
            multiplier: booster.multiplier,
            untilTs: now + booster.durationMs,
          };
        }
        set({ money: state.money - booster.price, luckBoost: newBoost });
        return true;
      },

      setSelectedKey: (rarity) => set({ selectedKey: rarity }),

      clearLastDrop: () => set({ lastDrop: null }),

      clearLuckIfExpired: (now) => {
        const state = get();
        if (state.luckBoost && state.luckBoost.untilTs <= now) {
          set({ luckBoost: null });
        }
      },

      setHydrated: () => set({ hydrated: true }),

      // ========== ЭКИПИРОВКА ==========

      isSlotCompatible: (itemSlot, targetSlot) =>
        isSlotCompatibleFn(itemSlot, targetSlot),

      equipItem: (stackUid, targetSlot) => {
        const state = get();
        const stack = state.inventory.find((s) => s.uid === stackUid);
        if (!stack) return false;
        if (!isSlotCompatibleFn(stack.slot, targetSlot)) return false;

        // копируем equipped для изменения
        const newEquipped: EquippedMap = { ...state.equipped };
        // если в целевом слоте что-то есть — снимаем (вернём в инвентарь)
        const displaced = newEquipped[targetSlot];
        delete newEquipped[targetSlot];

        // создаём equipped-копию предмета
        const equippedItem: EquippedItem = {
          uid: stack.uid + "-eq",
          itemId: stack.itemId,
          name: stack.name,
          rarity: stack.rarity,
          emoji: stack.emoji,
          baseValue: stack.baseValue,
          stats: stack.stats,
          slot: stack.slot,
          set: stack.set,
        };
        newEquipped[targetSlot] = equippedItem;

        // обновляем инвентарь: убираем 1 из стэка; если 0 — убираем стэк
        let newInventory: InventoryStack[];
        if (stack.count > 1) {
          newInventory = state.inventory.map((s) =>
            s.uid === stack.uid ? { ...s, count: s.count - 1 } : s,
          );
        } else {
          newInventory = state.inventory.filter((s) => s.uid !== stack.uid);
        }

        // если было что-то в слоту — добавляем обратно
        if (displaced) {
          const existing = findStackFor(newInventory, displaced.itemId);
          if (existing) {
            newInventory = newInventory.map((s) =>
              s.itemId === displaced.itemId ? { ...s, count: s.count + 1 } : s,
            );
          } else {
            newInventory = [
              ...newInventory,
              {
                uid: displaced.uid + "-back",
                itemId: displaced.itemId,
                name: displaced.name,
                rarity: displaced.rarity,
                emoji: displaced.emoji,
                baseValue: displaced.baseValue,
                count: 1,
                slot: displaced.slot,
                stats: displaced.stats,
                set: displaced.set,
              },
            ];
          }
        }

        set({ equipped: newEquipped, inventory: newInventory });
        return true;
      },

      unequipSlot: (slot) => {
        const state = get();
        const item = state.equipped[slot];
        if (!item) return;
        const newEquipped = { ...state.equipped };
        delete newEquipped[slot];

        // возвращаем в инвентарь
        const existing = findStackFor(state.inventory, item.itemId);
        let newInventory: InventoryStack[];
        if (existing) {
          newInventory = state.inventory.map((s) =>
            s.itemId === item.itemId ? { ...s, count: s.count + 1 } : s,
          );
        } else {
          newInventory = [
            ...state.inventory,
            {
              uid: item.uid + "-back",
              itemId: item.itemId,
              name: item.name,
              rarity: item.rarity,
              emoji: item.emoji,
              baseValue: item.baseValue,
              count: 1,
              slot: item.slot,
              stats: item.stats,
              set: item.set,
            },
          ];
        }
        set({ equipped: newEquipped, inventory: newInventory });
      },

      computeHeroStats: () => {
        const state = get();
        return computeHeroStatsFn(state.equipped, state.battle.heroLevel);
      },

      computeAttackIntervalMs: () => {
        const state = get();
        const stats = computeHeroStatsFn(state.equipped, state.battle.heroLevel);
        const interval =
          ATTACK_INTERVAL_BASE_MS - stats.speed * 25 - (state.battle.heroLevel - 1) * 12;
        return Math.max(ATTACK_INTERVAL_MIN_MS, interval);
      },

      computeActiveSets: () => {
        const state = get();
        const counts: Record<string, number> = {};
        for (const key of Object.keys(state.equipped) as EquipSlotId[]) {
          const item = state.equipped[key];
          if (item?.set) counts[item.set] = (counts[item.set] ?? 0) + 1;
        }
        return Object.keys(counts).map((setId) => {
          const def = SET_BY_ID[setId];
          const count = counts[setId];
          return {
            setId,
            count,
            bonus2: count >= 2,
            bonus4: count >= 4,
            bonus6: count >= 6 && !!def?.bonus6,
          };
        });
      },

      // ========== КРАФТ И ЖЕРТВА ==========

      craftItems: (itemId) => {
        const state = get();
        const stack = state.inventory.find((s) => s.itemId === itemId);
        if (!stack || stack.count < CRAFT_REQUIRED) return false;
        // предмет должен иметь редкость < divine
        const rarityOrder: RarityId[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "divine"];
        const idx = rarityOrder.indexOf(stack.rarity);
        if (idx < 0 || idx >= rarityOrder.length - 1) return false;
        const nextRarity = rarityOrder[idx + 1];
        // выбираем случайный предмет nextRarity с тем же slot
        const sameSlotPool = ITEMS_BY_RARITY[nextRarity].filter(
          (i) => i.slot === stack.slot && (!stack.set || i.set === stack.set),
        );
        const pool = sameSlotPool.length > 0 ? sameSlotPool : ITEMS_BY_RARITY[nextRarity];
        const newItem = pickRandom(pool);
        // списываем CRAFT_REQUIRED предметов
        const remaining = stack.count - CRAFT_REQUIRED;
        let newInventory: InventoryStack[];
        if (remaining > 0) {
          newInventory = state.inventory.map((s) =>
            s.itemId === itemId ? { ...s, count: remaining } : s,
          );
        } else {
          newInventory = state.inventory.filter((s) => s.itemId !== itemId);
        }
        // добавляем новый предмет (стэк с тем же itemId)
        const existingNew = findStackFor(newInventory, newItem.id);
        if (existingNew) {
          newInventory = newInventory.map((s) =>
            s.itemId === newItem.id ? { ...s, count: s.count + 1 } : s,
          );
        } else {
          newInventory = [
            ...newInventory,
            {
              uid: `stack-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
              itemId: newItem.id,
              name: newItem.name,
              rarity: newItem.rarity,
              emoji: newItem.emoji,
              baseValue: newItem.baseValue,
              count: 1,
              slot: newItem.slot,
              stats: newItem.stats,
              set: newItem.set,
            },
          ];
        }
        set({
          inventory: newInventory,
          lastNotice: {
            id: `craft-${Date.now()}`,
            text: `Скрафчено: ${newItem.name}`,
            color: "#fbbf24",
            emoji: "⚗",
          },
        });
        return true;
      },

      sacrificeItem: (uid, count) => {
        const state = get();
        const stack = state.inventory.find((s) => s.uid === uid || s.itemId === uid);
        if (!stack) return false;
        const actualCount = Math.min(count, stack.count);
        if (actualCount <= 0) return false;
        // добавляем permanent luck = count * SACRIFICE_LUCK_PER_ITEM
        const luckGain = actualCount * SACRIFICE_LUCK_PER_ITEM;
        const now = Date.now();
        const existing = state.luckBoost;
        let newBoost: LuckBoost;
        if (existing && existing.untilTs > now) {
          newBoost = {
            multiplier: Math.min(0.95, existing.multiplier + luckGain),
            untilTs: now + 30 * 60 * 1000, // продлеваем на 30 мин
          };
        } else {
          newBoost = {
            multiplier: Math.min(0.95, luckGain),
            untilTs: now + 30 * 60 * 1000,
          };
        }
        // убираем actualCount из стэка
        const remaining = stack.count - actualCount;
        let newInventory: InventoryStack[];
        if (remaining > 0) {
          newInventory = state.inventory.map((s) =>
            s.uid === stack.uid ? { ...s, count: remaining } : s,
          );
        } else {
          newInventory = state.inventory.filter((s) => s.uid !== stack.uid);
        }
        set({
          inventory: newInventory,
          luckBoost: newBoost,
          lastNotice: {
            id: `sac-${Date.now()}`,
            text: `Жертва: +${Math.round(luckGain * 100)}% удачи на 30 мин`,
            color: "#a855f7",
            emoji: "🙏",
          },
        });
        return true;
      },

      // ========== ДОСТИЖЕНИЯ И ДЕЙЛИКИ ==========

      claimAchievement: (id) => {
        const state = get();
        const ach = ACHIEVEMENTS.find((a) => a.id === id);
        if (!ach) return false;
        const achState = state.achievements[id];
        if (achState?.claimed) return false;
        // проверяем что цель достигнута
        const value = getMetricValue(state.stats, ach.metric);
        if (value < ach.goal) return false;
        // выдаём награду
        const newKeys = ach.reward.keys
          ? { ...state.keys, [ach.reward.keys.rarity]: state.keys[ach.reward.keys.rarity] + ach.reward.keys.count }
          : state.keys;
        set({
          keys: newKeys,
          money: state.money + ach.reward.money,
          achievements: { ...state.achievements, [id]: { claimed: true } },
          lastNotice: {
            id: `ach-${id}-${Date.now()}`,
            text: `Достижение: ${ach.name} (+${ach.reward.money}💰${ach.reward.keys ? ` +${ach.reward.keys.count} ${ach.reward.keys.rarity} ключ` : ""})`,
            color: "#fbbf24",
            emoji: ach.emoji,
          },
        });
        return true;
      },

      claimDaily: (id) => {
        const state = get();
        const dq = state.dailies.quests.find((q) => q.id === id);
        if (!dq || dq.claimed) return false;
        const def = DAILY_POOL.find((d) => d.id === id);
        if (!def) return false;
        // прогресс = текущее значение метрики - baseline (dq.progress = значение на старте дня)
        const value = getMetricValue(state.stats, def.metric);
        if (value - dq.progress < def.goal) return false;
        // выдаём награду
        const newKeys = def.reward.keys
          ? { ...state.keys, [def.reward.keys.rarity]: state.keys[def.reward.keys.rarity] + def.reward.keys.count }
          : state.keys;
        set({
          keys: newKeys,
          money: state.money + def.reward.money,
          dailies: {
            ...state.dailies,
            quests: state.dailies.quests.map((q) =>
              q.id === id ? { ...q, claimed: true } : q,
            ),
          },
          lastNotice: {
            id: `daily-${id}-${Date.now()}`,
            text: `Дейлик: ${def.description} выполнен!`,
            color: "#22c55e",
            emoji: def.emoji,
          },
        });
        return true;
      },

      resetDailiesIfNewDay: () => {
        const state = get();
        const today = todayStr();
        if (state.dailies.date !== today) {
          // обновляем дейлики: свежие 3 квеста, progress = baseline текущей метрики
          const newQuests = rollDailyQuests().map((q) => {
            const def = DAILY_POOL.find((d) => d.id === q.id);
            if (!def) return q;
            return { ...q, progress: getMetricValue(state.stats, def.metric) };
          });
          set({ dailies: { date: today, quests: newQuests } });
        }
      },

      // ========== СОБЫТИЯ / ИВЕНТЫ ==========
      checkEvents: (now) => {
        const state = get();
        let updates: Partial<GameState> = {};
        let notice = state.lastNotice;

        // Золотой сундук
        if (now >= state.events.nextGoldenChest && state.chests.filter(c => !c.opened).length < MAX_CHESTS_ON_SCREEN) {
          // спавним золотой сундук: visual=golden, hiddenTier=7 (max), size=130
          const chest: SpawnedChest = {
            id: newChestId(),
            visual: "golden",
            size: 130,
            x: randRange(20, 70),
            y: randRange(20, 70),
            hiddenTier: CHEST_HIDDEN_TIERS,
            spawnAt: now,
            fadeMs: 1000, // быстрое появление
            lifeMs: 30000, // живёт 30 сек
            opened: false,
            openProgress: 0,
            isGolden: true,
          };
          // следующий золотой сундук — через 3-5 мин
          const nextDelay = randRange(EVENT_CONFIG.goldenChestIntervalMin, EVENT_CONFIG.goldenChestIntervalMax);
          updates.chests = [...state.chests, chest];
          updates.events = { ...state.events, nextGoldenChest: now + nextDelay };
          notice = {
            id: `golden-${now}`,
            text: "🥚 Золотой сундук появился! 30 сек до исчезновения",
            color: "#fbbf24",
            emoji: "🥚",
          };
        }

        // Вторжение демонов — старт
        if (now >= state.events.nextDemonInvasion && state.events.demonInvasionUntil === 0) {
          const until = now + EVENT_CONFIG.demonInvasionDuration;
          updates.events = { ...(updates.events ?? state.events), demonInvasionUntil: until };
          notice = {
            id: `invasion-start-${now}`,
            text: "🔥 ВТОРЖЕНИЕ ДЕМОНОВ! ×5 награды на 30 сек",
            color: "#dc2626",
            emoji: "🔥",
          };
        }

        // Вторжение демонов — конец
        if (state.events.demonInvasionUntil > 0 && now >= state.events.demonInvasionUntil) {
          updates.events = {
            ...(updates.events ?? state.events),
            demonInvasionUntil: 0,
            nextDemonInvasion: now + EVENT_CONFIG.demonInvasionInterval,
          };
          notice = {
            id: `invasion-end-${now}`,
            text: "Вторжение окончено. Демоны отступили.",
            color: "#71717a",
            emoji: "🌫",
          };
        }

        // Сброс комбо если пауза > 10 сек
        if (state.combo.count > 0 && now - state.combo.lastOpenAt > COMBO_TIMEOUT_MS) {
          updates.combo = { count: 0, lastOpenAt: 0 };
        }
        if (updates.events || updates.chests || updates.combo) {
          updates.lastNotice = notice;
          set(updates as any);
        }
      },

      // ========== АПГРЕЙДЫ КЛИКЕРА ==========
      buyUpgrade: (id) => {
        const state = get();
        const def = UPGRADE_BY_ID[id];
        if (!def) return false;
        const currentLevel = state.upgrades[id] ?? 0;
        if (currentLevel >= def.maxLevel) return false;
        const price = upgradePrice(def, currentLevel);
        if (state.money < price) return false;
        set({
          money: state.money - price,
          upgrades: { ...state.upgrades, [id]: currentLevel + 1 },
          lastNotice: currentLevel === 0
            ? { id: `upgrade-${id}-${Date.now()}`, text: `${def.emoji} ${def.name} ур.1!`, color: def.color, emoji: def.emoji }
            : state.lastNotice,
        });
        return true;
      },

      // ========== ПРЕСТИЖ ==========
      getSoulsGained: () => {
        const state = get();
        return calculateSoulsGained({
          enemiesKilled: state.stats.enemiesKilled,
          bossKills: state.stats.bossKills,
          heroLevel: state.battle.heroLevel,
          bestRarityFound: state.stats.bestRarityFound,
        });
      },

      getPrestigeMult: () => {
        const state = get();
        return calculatePrestigeMult(state.prestige.souls);
      },

      prestigeReset: () => {
        const state = get();
        const soulsGained = calculateSoulsGained({
          enemiesKilled: state.stats.enemiesKilled,
          bossKills: state.stats.bossKills,
          heroLevel: state.battle.heroLevel,
          bestRarityFound: state.stats.bestRarityFound,
        });
        if (soulsGained < PRESTIGE_CONFIG.minSoulsToPrestige) return false;
        const newTotalSouls = state.prestige.souls + soulsGained;
        const newMult = calculatePrestigeMult(newTotalSouls);
        // Сбрасываем прогресс, но сохраняем души, достижения, дейлики
        set({
          keys: { ...initialKeys },
          money: 0,
          selectedKey: "rusty",
          luckBoost: null,
          chests: [],
          inventory: [],
          equipped: {},
          battle: {
            currentEnemy: null,
            heroLevel: 1,
            heroXp: 0,
            heroXpNext: xpForLevel(1),
            enemiesKilled: 0,
            lastAttackAt: 0,
            lastReward: null,
          },
          lastDrop: null,
          lastNotice: {
            id: `prestige-${Date.now()}`,
            text: `Престиж! +${soulsGained} душ · множитель ×${newMult.toFixed(2)}`,
            color: "#a855f7",
            emoji: "💀",
          },
          prestige: { souls: newTotalSouls, count: state.prestige.count + 1 },
          stats: {
            totalClicks: 0,
            chestsOpened: 0,
            itemsFound: 0,
            moneyEarned: 0,
            bestRarityFound: null,
            enemiesKilled: 0,
            heroLevel: 1,
            bossKills: 0,
            eliteKills: 0,
          },
          // достижения и дейлики НЕ сбрасываются, апгрейды и события сбрасываются
          upgrades: {},
          events: { nextGoldenChest: Date.now() + 60_000, nextDemonInvasion: Date.now() + 600_000, demonInvasionUntil: 0 },
          combo: { count: 0, lastOpenAt: 0 },
          combo: { count: 0, lastOpenAt: 0 },
        });
        return true;
      },

      // ========== УЛЬТ ==========
      useUlt: () => {
        const state = get();
        if (Date.now() < state.ultCooldownUntil) return false;
        const now = Date.now();
        // Ульт: мгновенно убивает текущего врага + ×3 награда
        if (!state.battle.currentEnemy) return false;
        const enemy = state.battle.currentEnemy;
        const enemyType = ENEMY_TYPES.find((e) => e.id === enemy.typeId)!;
        const enemyMult = enemy.isBoss ? BOSS_REWARD_MULT : enemy.isElite ? ELITE_REWARD_MULT : 1;
        const floor = getCurrentFloor(state.battle.enemiesKilled);
        const fMult = floorRewardMult(floor);
        const pMult = calculatePrestigeMult(state.prestige.souls);
        const xpGain = Math.round(enemyType.xpReward * enemyMult * fMult * pMult * 3);
        const moneyGain = Math.round(randInt(enemyType.moneyReward[0], enemyType.moneyReward[1]) * enemyMult * fMult * pMult * 3);
        const keyDrop = Math.random() < 0.5;
        const keyRarity: KeyRarity = enemy.isBoss ? 'golden' : enemy.isElite ? 'silver' : 'bronze';
        let level = state.battle.heroLevel;
        let xp = state.battle.heroXp + xpGain;
        let xpNext = state.battle.heroXpNext;
        while (xp >= xpNext) { xp -= xpNext; level++; xpNext = xpForLevel(level); }
        const newKeys = keyDrop ? { ...state.keys, [keyRarity]: state.keys[keyRarity] + 1 } : state.keys;
        const newEnemiesKilled = state.battle.enemiesKilled + 1;
        set({
          keys: newKeys,
          money: state.money + moneyGain,
          battle: {
            ...state.battle,
            currentEnemy: makeEnemy(newEnemiesKilled, state.events.demonInvasionUntil),
            heroLevel: level, heroXp: xp, heroXpNext: xpNext,
            enemiesKilled: newEnemiesKilled, lastAttackAt: now,
            lastReward: { xp: xpGain, money: moneyGain, key: keyDrop, enemyName: 'УЛЬТ! ' + enemyType.name },
          },
          ultCooldownUntil: now + 60_000,
          stats: { ...state.stats, enemiesKilled: newEnemiesKilled, heroLevel: level, moneyEarned: state.stats.moneyEarned + moneyGain,
            bossKills: state.stats.bossKills + (enemy.isBoss ? 1 : 0), eliteKills: state.stats.eliteKills + (enemy.isElite ? 1 : 0) },
          lastNotice: { id: 'ult-' + now, text: '⚡ УЛЬТ! ×3 награда', color: '#fbbf24', emoji: '⚡' },
        });
        return true;
      },

      clearLastNotice: () => set({ lastNotice: null }),

      // ========== АВТО-БОЙ ==========

      spawnEnemy: () => {
        const state = get();
        if (state.battle.currentEnemy) return;
        set({
          battle: {
            ...state.battle,
            currentEnemy: makeEnemy(state.battle.enemiesKilled, state.events.demonInvasionUntil),
          },
        });
      },

      battleTick: (now) => {
        const state = get();
        if (!state.battle.currentEnemy) {
          // спавним нового
          set({
            battle: {
              ...state.battle,
              currentEnemy: makeEnemy(state.battle.enemiesKilled, state.events.demonInvasionUntil),
              lastAttackAt: now,
            },
          });
          return;
        }
        const interval = state.computeAttackIntervalMs();
        if (now - state.battle.lastAttackAt < interval) return;

        const heroStats = state.computeHeroStats();
        const enemy = state.battle.currentEnemy;

        // ===== Навыки героя =====
        // случайным образом активируется один из открытых навыков
        let damage = heroStats.attack;
        let moneyMult = 1;
        let keyChanceMult = 1;
        let instantKill = false;
        let activeSkill: { emoji: string; name: string; color: string } | null = null;
        for (const skill of HERO_SKILLS) {
          if (state.battle.heroLevel < skill.unlockLevel) continue;
          if (Math.random() < skill.triggerChance) {
            if (skill.id === "power_strike") {
              damage = Math.round(damage * skill.effectMult);
              activeSkill = { emoji: skill.emoji, name: skill.name, color: skill.color };
              break;
            } else if (skill.id === "vampirism") {
              moneyMult = skill.effectMult;
              activeSkill = { emoji: skill.emoji, name: skill.name, color: skill.color };
              break;
            } else if (skill.id === "critical") {
              damage = Math.round(damage * skill.effectMult);
              activeSkill = { emoji: skill.emoji, name: skill.name, color: skill.color };
              break;
            } else if (skill.id === "chain_lightning") {
              // мгновенное убийство только если HP врага < 30%
              if (enemy.hp / enemy.maxHp < 0.3) {
                instantKill = true;
                activeSkill = { emoji: skill.emoji, name: skill.name, color: skill.color };
                break;
              }
            } else if (skill.id === "mass_attack") {
              damage = Math.round(damage * skill.effectMult);
              keyChanceMult = 2;
              activeSkill = { emoji: skill.emoji, name: skill.name, color: skill.color };
              break;
            }
          }
        }

        const newHp = instantKill ? 0 : enemy.hp - damage;

        if (newHp > 0) {
          // враг выжил — просто уменьшаем hp
          set({
            battle: {
              ...state.battle,
              currentEnemy: { ...enemy, hp: newHp },
              lastAttackAt: now,
            },
          });
          return;
        }

        // враг убит — расчёт наград с учётом элиты/босса/этажа
        const enemyType = ENEMY_TYPES.find((e) => e.id === enemy.typeId)!;
        const enemyMult = enemy.isBoss ? BOSS_REWARD_MULT : enemy.isElite ? ELITE_REWARD_MULT : 1;
        const floor = getCurrentFloor(state.battle.enemiesKilled);
        const fMult = floorRewardMult(floor);
        const pMult = calculatePrestigeMult(state.prestige.souls);
        // Вторжение демонов — ×5 к наградам
        const invasionMult = state.events.demonInvasionUntil > 0 && Date.now() < state.events.demonInvasionUntil ? EVENT_CONFIG.demonRewardMult : 1;
        const xpGain = Math.round(enemyType.xpReward * enemyMult * fMult * pMult * invasionMult);
        const moneyGain = Math.round(randInt(enemyType.moneyReward[0], enemyType.moneyReward[1]) * enemyMult * fMult * moneyMult * pMult * invasionMult);
        // шанс ключа: босс 50%, элита 2x базовый, иначе базовый
        const baseKeyChance = enemyType.keyDropChance;
        const keyChance = (enemy.isBoss ? BOSS_KEY_DROP_CHANCE : enemy.isElite ? baseKeyChance * 2 : baseKeyChance) * keyChanceMult;
        const keyDrop = Math.random() < keyChance;
        const keyRarity: KeyRarity = enemy.isBoss ? "silver" : enemy.isElite ? "bronze" : "rusty";

        // leveling
        let level = state.battle.heroLevel;
        let xp = state.battle.heroXp + xpGain;
        let xpNext = state.battle.heroXpNext;
        let leveled = false;
        while (xp >= xpNext) {
          xp -= xpNext;
          level++;
          xpNext = xpForLevel(level);
          leveled = true;
        }

        const newKeys = keyDrop
          ? { ...state.keys, [keyRarity]: state.keys[keyRarity] + 1 }
          : state.keys;

        const newEnemiesKilled = state.battle.enemiesKilled + 1;
        const newBossKills = state.stats.bossKills + (enemy.isBoss ? 1 : 0);
        const newEliteKills = state.stats.eliteKills + (enemy.isElite ? 1 : 0);

        set({
          keys: newKeys,
          money: state.money + moneyGain,
          battle: {
            ...state.battle,
            currentEnemy: makeEnemy(newEnemiesKilled, state.events.demonInvasionUntil),
            heroLevel: level,
            heroXp: xp,
            heroXpNext: xpNext,
            enemiesKilled: newEnemiesKilled,
            lastAttackAt: now,
            lastReward: {
              xp: xpGain,
              money: moneyGain,
              key: keyDrop,
              enemyName: (enemy.isBoss ? "БОСС " : enemy.isElite ? "ЭЛИТА " : "") + enemyType.name,
            },
          },
          stats: {
            ...state.stats,
            enemiesKilled: newEnemiesKilled,
            heroLevel: level,
            moneyEarned: state.stats.moneyEarned + moneyGain,
            bossKills: newBossKills,
            eliteKills: newEliteKills,
          },
          lastNotice: activeSkill
            ? {
                id: `skill-${now}`,
                text: `${activeSkill.emoji} ${activeSkill.name}!`,
                color: activeSkill.color,
                emoji: activeSkill.emoji,
              }
            : state.lastNotice,
        });
        void leveled;
      },

      resetGame: () =>
        set({
          keys: { ...initialKeys },
          money: 0,
          selectedKey: "rusty",
          luckBoost: null,
          chests: [],
          inventory: [],
          equipped: {},
          battle: {
            currentEnemy: null,
            heroLevel: 1,
            heroXp: 0,
            heroXpNext: xpForLevel(1),
            enemiesKilled: 0,
            lastAttackAt: 0,
            lastReward: null,
          },
          lastDrop: null,
          lastNotice: null,
          prestige: { souls: 0, count: 0 },
          upgrades: {},
          events: { nextGoldenChest: Date.now() + 60_000, nextDemonInvasion: Date.now() + 600_000, demonInvasionUntil: 0 },
          combo: { count: 0, lastOpenAt: 0 },
          achievements: {},
          dailies: { date: todayStr(), quests: rollDailyQuests() },
          stats: {
            totalClicks: 0,
            chestsOpened: 0,
            itemsFound: 0,
            moneyEarned: 0,
            bestRarityFound: null,
            enemiesKilled: 0,
            heroLevel: 1,
            bossKills: 0,
            eliteKills: 0,
          },
        }),
    }),
    {
      name: "chest-thief-game-v4",
      version: 4,
      // Миграция: заполняем недостающие поля при загрузке старых сейвов
      migrate: (persistedState: any, version: number) => {
        const s = persistedState ?? {};
        // v3 → v4: добавлены bossKills, eliteKills, achievements, dailies, lastNotice, prestige
        if (!s.prestige) s.prestige = { souls: 0, count: 0 };
        if (!s.upgrades) s.upgrades = {};
        if (!s.combo) s.combo = { count: 0, lastOpenAt: 0 };
        if (s.ultCooldownUntil === undefined) s.ultCooldownUntil = 0;
        if (!s.events) s.events = { nextGoldenChest: Date.now() + 60_000, nextDemonInvasion: Date.now() + 600_000, demonInvasionUntil: 0 };
        if (!s.combo) s.combo = { count: 0, lastOpenAt: 0 };
        if (s.ultCooldownUntil === undefined) s.ultCooldownUntil = 0;
        if (s.stats) {
          s.stats.bossKills = s.stats.bossKills ?? 0;
          s.stats.eliteKills = s.stats.eliteKills ?? 0;
        }
        if (!s.achievements) s.achievements = {};
        if (!s.dailies) {
          s.dailies = { date: todayStr(), quests: rollDailyQuests() };
        } else if (s.dailies.date !== todayStr()) {
          // старый день — обновим квесты с baseline = текущее значение метрики
          const stats = s.stats ?? { totalClicks: 0, chestsOpened: 0, itemsFound: 0, moneyEarned: 0, enemiesKilled: 0, heroLevel: 1, bossKills: 0, eliteKills: 0 };
          s.dailies = {
            date: todayStr(),
            quests: rollDailyQuests().map((q) => {
              const def = DAILY_POOL.find((d) => d.id === q.id);
              if (!def) return q;
              const v = (stats as any)[def.metric === "clicks" ? "totalClicks" : def.metric === "heroLevel" ? "heroLevel" : def.metric] ?? 0;
              return { ...q, progress: v };
            }),
          };
        }
        // equipped items: добавляем set если отсутствует (старые сейвы)
        if (s.equipped) {
          for (const k of Object.keys(s.equipped)) {
            const item = s.equipped[k];
            if (item && item.set === undefined) item.set = null;
          }
        }
        // inventory stacks: добавляем set если отсутствует
        if (s.inventory) {
          for (const stack of s.inventory) {
            if (stack && stack.set === undefined) stack.set = null;
          }
        }
        return s;
      },
      partialize: (s) => ({
        keys: s.keys,
        money: s.money,
        selectedKey: s.selectedKey,
        luckBoost: s.luckBoost,
        inventory: s.inventory,
        equipped: s.equipped,
        battle: s.battle,
        stats: s.stats,
        achievements: s.achievements,
        dailies: s.dailies,
        prestige: s.prestige,
        upgrades: s.upgrades,
        events: s.events,
        combo: s.combo,
        combo: s.combo,
        ultCooldownUntil: s.ultCooldownUntil,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
        state?.resetDailiesIfNewDay();
      },
    },
  ),
);

export { RARITY_BY_ID };
