// Zustand store с полной игровой логикой: кликер, сундуки, лут, магазин.

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ATTACK_INTERVAL_BASE_MS,
  ATTACK_INTERVAL_MIN_MS,
  BOSS_INTERVAL,
  BOSS_HP_MULT,
  BOSS_KEY_DROP_CHANCE,
  BOSS_REWARD_MULT,
  CHEST_FADE_MS_MAX,
  CHEST_FADE_MS_MIN,
  CHEST_HIDDEN_TIERS,
  CHEST_LIFE_MS_MAX,
  CHEST_LIFE_MS_MIN,
  CHEST_VISUALS,
  ELITE_CHANCE,
  ELITE_HP_MULT,
  ELITE_REWARD_MULT,
  ENEMY_TYPES,
  EQUIP_SLOTS,
  HERO_BASE,
  KEY_BY_ID,
  KEY_DROP_RATE_PER_CLICK,
  KEY_TYPES,
  MAX_CHESTS_ON_SCREEN,
  RARITIES,
  RARITY_BY_ID,
  SHOP_BOOSTERS,
  xpForLevel,
  type BattleEnemy,
  type BattleState,
  type ChestVisualKind,
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
}

type EquippedMap = Partial<Record<EquipSlotId, EquippedItem>>;

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

function rollKeyFromClick(): KeyRarity | null {
  // сначала проверим, упадёт ли вообще ключ
  if (Math.random() > KEY_DROP_RATE_PER_CLICK) return null;
  // если упал — выбираем редкость по dropChance
  const total = KEY_TYPES.reduce((s, k) => s + k.dropChance, 0);
  let r = Math.random() * total;
  for (const k of KEY_TYPES) {
    r -= k.dropChance;
    if (r <= 0) return k.id;
  }
  return "rusty";
}

// Ролл редкости лута с учётом ключа, скрытого тира сундука и буста удачи
function rollLootRarity(
  keyRarity: KeyRarity,
  hiddenTier: number,
  luckBoost: LuckBoost | null,
): RarityId {
  const key = KEY_BY_ID[keyRarity];
  const keyQ = key.qualityBoost;
  const chestQ = ((hiddenTier - 1) / (CHEST_HIDDEN_TIERS - 1)) * 0.45; // 0..0.45
  const boostQ = (luckBoost?.multiplier ?? 0) * 0.4;
  const q = Math.min(0.95, keyQ + chestQ + boostQ);

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
function makeEnemy(enemiesKilled: number): BattleEnemy {
  const t = pickRandom(ENEMY_TYPES);
  const isBoss = enemiesKilled > 0 && enemiesKilled % BOSS_INTERVAL === 0;
  const isElite = !isBoss && Math.random() < ELITE_CHANCE;
  let hp = t.hp;
  if (isBoss) hp = Math.round(t.hp * BOSS_HP_MULT);
  else if (isElite) hp = Math.round(t.hp * ELITE_HP_MULT);
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

// Суммарные статы героя
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
  return { attack: atk, defense: def, speed: spd, luck: luk };
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
      stats: {
        totalClicks: 0,
        chestsOpened: 0,
        itemsFound: 0,
        moneyEarned: 0,
        bestRarityFound: null,
        enemiesKilled: 0,
        heroLevel: 1,
      },

      clickClicker: () => {
        const state = get();
        const droppedKey = rollKeyFromClick();
        if (droppedKey) {
          set({
            keys: { ...state.keys, [droppedKey]: state.keys[droppedKey] + 1 },
            stats: { ...state.stats, totalClicks: state.stats.totalClicks + 1 },
          });
        } else {
          set({ stats: { ...state.stats, totalClicks: state.stats.totalClicks + 1 } });
        }
        return { droppedKey, clickPower: 1 };
      },

      spawnChestTick: () => {
        const state = get();
        if (state.chests.length >= MAX_CHESTS_ON_SCREEN) return;
        const visual: ChestVisualKind = pickRandom(CHEST_VISUALS).id;
        const visualDef = CHEST_VISUALS.find((v) => v.id === visual)!;
        const size = Math.round(randRange(visualDef.sizeRange[0], visualDef.sizeRange[1]));

        // Ищем позицию, не пересекающуюся с существующими сундуками.
        // Используем отдельные минимальные расстояния по X и Y в процентах,
        // потому что поле шире чем выше (700x400px типично). Учитываем
        // размер самого большого сундука (130px) с запасом.
        const MIN_DIST_X = 26; // % по горизонтали
        const MIN_DIST_Y = 32; // % по вертикали (поле короче)
        let chosenX = 0;
        let chosenY = 0;
        let foundValid = false;
        const activeChests = state.chests.filter((c) => !c.opened);
        for (let attempt = 0; attempt < 30; attempt++) {
          const x = randRange(10, 78);
          const y = randRange(14, 78);
          let ok = true;
          for (const c of activeChests) {
            const dx = Math.abs(c.x - x);
            const dy = Math.abs(c.y - y);
            // пересечение только если оба расстояния меньше минимальных
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
        const rarity = rollLootRarity(keyRarity, chest.hiddenTier, state.luckBoost);
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

      // ========== АВТО-БОЙ ==========

      spawnEnemy: () => {
        const state = get();
        if (state.battle.currentEnemy) return;
        set({
          battle: {
            ...state.battle,
            currentEnemy: makeEnemy(state.battle.enemiesKilled),
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
              currentEnemy: makeEnemy(state.battle.enemiesKilled),
              lastAttackAt: now,
            },
          });
          return;
        }
        const interval = state.computeAttackIntervalMs();
        if (now - state.battle.lastAttackAt < interval) return;

        const heroStats = state.computeHeroStats();
        const enemy = state.battle.currentEnemy;
        const newHp = enemy.hp - heroStats.attack;

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

        // враг убит — расчёт наград с учётом элиты/босса
        const enemyType = ENEMY_TYPES.find((e) => e.id === enemy.typeId)!;
        const rewardMult = enemy.isBoss ? BOSS_REWARD_MULT : enemy.isElite ? ELITE_REWARD_MULT : 1;
        const xpGain = enemyType.xpReward * rewardMult;
        const moneyGain = randInt(enemyType.moneyReward[0], enemyType.moneyReward[1]) * rewardMult;
        // шанс ключа: для босса — BOSS_KEY_DROP_CHANCE, для элиты — 2x базовый, иначе базовый
        const baseKeyChance = enemyType.keyDropChance;
        const keyChance = enemy.isBoss ? BOSS_KEY_DROP_CHANCE : enemy.isElite ? baseKeyChance * 2 : baseKeyChance;
        const keyDrop = Math.random() < keyChance;
        // тип выпавшего ключа: босс — серебряный, элита — бронзовый, обычный — ржавый
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

        set({
          keys: newKeys,
          money: state.money + moneyGain,
          battle: {
            ...state.battle,
            currentEnemy: makeEnemy(newEnemiesKilled),
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
          },
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
          stats: {
            totalClicks: 0,
            chestsOpened: 0,
            itemsFound: 0,
            moneyEarned: 0,
            bestRarityFound: null,
            enemiesKilled: 0,
            heroLevel: 1,
          },
        }),
    }),
    {
      name: "chest-thief-game-v2",
      partialize: (s) => ({
        keys: s.keys,
        money: s.money,
        selectedKey: s.selectedKey,
        luckBoost: s.luckBoost,
        inventory: s.inventory,
        equipped: s.equipped,
        battle: s.battle,
        stats: s.stats,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export { RARITY_BY_ID };
