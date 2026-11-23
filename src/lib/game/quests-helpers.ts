// Хелпер для получения значения метрики из GameStats.
// Дублирует getMetricValue из store.ts, но доступен для импорта в компонентах.

import type { GameStats } from "@/lib/game/store";
import type { Achievement } from "@/lib/game/config";

// Определяем расширенный тип для метрик дейликов (без bossKills/eliteKills)
type DailyMetric = "clicks" | "chestsOpened" | "enemiesKilled" | "itemsFound" | "moneyEarned";

export function getMetricValueHelper(
  stats: GameStats,
  metric: Achievement["metric"] | DailyMetric,
): number {
  switch (metric) {
    case "clicks": return stats.totalClicks;
    case "chestsOpened": return stats.chestsOpened;
    case "itemsFound": return stats.itemsFound;
    case "enemiesKilled": return stats.enemiesKilled;
    case "heroLevel": return stats.heroLevel;
    case "bossKills": return stats.bossKills;
    case "eliteKills": return stats.eliteKills;
    case "moneyEarned": return stats.moneyEarned;
    default: return 0;
  }
}

// Только для тех метрик, что есть в DailyQuest
export function getDailyMetricValue(stats: GameStats, metric: DailyMetric): number {
  return getMetricValueHelper(stats, metric);
}
