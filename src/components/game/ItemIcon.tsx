"use client";

import { getIconId } from "@/lib/game/items";
import { RARITY_BY_ID } from "@/lib/game/config";

export function ItemIcon({ emoji, rarity, size = 24 }: { emoji: string; rarity: string; size?: number }) {
  const iconId = getIconId(emoji);
  if (!iconId) return <span style={{ fontSize: size * 0.8 }}>{emoji}</span>;
  const color = RARITY_BY_ID[rarity as keyof typeof RARITY_BY_ID]?.color ?? '#9ca3af';
  return (
    <svg width={size} height={size} style={{ color, filter: `drop-shadow(0 0 4px ${color}88)` }}>
      <use href={`/icons/items.svg#icon-${iconId}`} />
    </svg>
  );
}
