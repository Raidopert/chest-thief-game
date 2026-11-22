// Zustand store с полной игровой логикой: кликер, сундуки, лут, магазин.

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CHEST_FADE_MS_MAX,
  CHEST_FADE_MS_MIN,
  CHEST_HIDDEN_TIERS,
  CHEST_LIFE_MS_MAX,
  CHEST_LIFE_MS_MIN,
  CHEST_VISUALS,
  KEY_BY_ID,
  KEY_DROP_RATE_PER_CLICK,
  KEY_TYPES,
  MAX_CHESTS_ON_SCREEN,
  RARITIES,
  RARITY_BY_ID,
  SHOP_BOOSTERS,
  type ChestVisualKind,
  type InventoryStack,
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
      lastDrop: null,
      stats: {
        totalClicks: 0,
        chestsOpened: 0,
        itemsFound: 0,
        moneyEarned: 0,
        bestRarityFound: null,
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
        // occasionally also keep spawn chance even if not full
        const visual: ChestVisualKind = pickRandom(CHEST_VISUALS).id;
        const visualDef = CHEST_VISUALS.find((v) => v.id === visual)!;
        const size = Math.round(randRange(visualDef.sizeRange[0], visualDef.sizeRange[1]));
        // позиция в % — не у краёв
        const x = randRange(8, 78);
        const y = randRange(12, 80);
        // скрытый тир 1..7 — НЕ зависит от визуала (игрок не знает)
        const hiddenTier = randInt(1, CHEST_HIDDEN_TIERS);
        const fadeMs = Math.round(randRange(CHEST_FADE_MS_MIN, CHEST_FADE_MS_MAX));
        const lifeMs = Math.round(randRange(CHEST_LIFE_MS_MIN, CHEST_LIFE_MS_MAX));
        const chest: SpawnedChest = {
          id: newChestId(),
          visual,
          size,
          x,
          y,
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

      resetGame: () =>
        set({
          keys: { ...initialKeys },
          money: 0,
          selectedKey: "rusty",
          luckBoost: null,
          chests: [],
          inventory: [],
          lastDrop: null,
          stats: {
            totalClicks: 0,
            chestsOpened: 0,
            itemsFound: 0,
            moneyEarned: 0,
            bestRarityFound: null,
          },
        }),
    }),
    {
      name: "chest-thief-game-v1",
      partialize: (s) => ({
        keys: s.keys,
        money: s.money,
        selectedKey: s.selectedKey,
        luckBoost: s.luckBoost,
        inventory: s.inventory,
        stats: s.stats,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export { RARITY_BY_ID };
