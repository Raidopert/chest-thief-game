"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGameStore } from "@/lib/game/store";
import { useState } from "react";

interface Props {
  huntTab: React.ReactNode;
  heroTab: React.ReactNode;
  lootTab: React.ReactNode;
}

const STORAGE_KEY = "chest-thief-tab";
const VALID_TABS = ["hunt", "hero", "loot"] as const;
type TabId = (typeof VALID_TABS)[number];

function getInitialTab(): TabId {
  if (typeof window === "undefined") return "hunt";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (VALID_TABS as readonly string[]).includes(saved)) {
      return saved as TabId;
    }
  } catch {
    // ignore
  }
  return "hunt";
}

export default function GameTabs({ huntTab, heroTab, lootTab }: Props) {
  const chestsCount = useGameStore((s) => s.chests.length);
  const inventoryCount = useGameStore((s) => s.inventory.length);
  const heroLevel = useGameStore((s) => s.battle.heroLevel);
  const enemiesKilled = useGameStore((s) => s.battle.enemiesKilled);

  const [tab, setTab] = useState<TabId>(getInitialTab);

  const handleTabChange = (value: string) => {
    if ((VALID_TABS as readonly string[]).includes(value)) {
      setTab(value as TabId);
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch {
        // ignore
      }
    }
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full h-auto grid grid-cols-3 bg-[#15131c]/95 border border-zinc-700 p-1 gap-1">
        <TabsTrigger
          value="hunt"
          className="flex flex-col items-center gap-0.5 py-2 data-[state=active]:bg-red-950/40 data-[state=active]:text-zinc-300 text-zinc-400"
        >
          <span className="text-xs font-bold tracking-wide">🏹 Добыча</span>
          <span className="text-[9px] font-mono text-zinc-500">
            сундуков: {chestsCount}
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="hero"
          className="flex flex-col items-center gap-0.5 py-2 data-[state=active]:bg-red-950/40 data-[state=active]:text-zinc-300 text-zinc-400"
        >
          <span className="text-xs font-bold tracking-wide">⚔ Герой</span>
          <span className="text-[9px] font-mono text-zinc-500">
            ур. {heroLevel} · убито {enemiesKilled}
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="loot"
          className="flex flex-col items-center gap-0.5 py-2 data-[state=active]:bg-red-950/40 data-[state=active]:text-zinc-300 text-zinc-400"
        >
          <span className="text-xs font-bold tracking-wide">🎒 Лут</span>
          <span className="text-[9px] font-mono text-zinc-500">
            стэков: {inventoryCount}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="hunt" className="mt-3">
        {huntTab}
      </TabsContent>
      <TabsContent value="hero" className="mt-3">
        {heroTab}
      </TabsContent>
      <TabsContent value="loot" className="mt-3">
        {lootTab}
      </TabsContent>
    </Tabs>
  );
}
