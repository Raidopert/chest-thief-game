"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGameStore } from "@/lib/game/store";

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
    if (saved && (VALID_TABS as readonly string[]).includes(saved)) return saved as TabId;
  } catch {}
  return "hunt";
}

export default function GameTabs({ huntTab, heroTab, lootTab }: Props) {
  const chestsCount = useGameStore((s) => s.chests.length);
  const inventoryCount = useGameStore((s) => s.inventory.length);
  const heroLevel = useGameStore((s) => s.battle.heroLevel);
  const enemiesKilled = useGameStore((s) => s.battle.enemiesKilled);
  const lastDrop = useGameStore((s) => s.lastDrop);
  const [tab, setTab] = useState<TabId>(getInitialTab);
  const [lootBadge, setLootBadge] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      if ((VALID_TABS as readonly string[]).includes(detail)) {
        setTab(detail as TabId);
        try { localStorage.setItem(STORAGE_KEY, detail); } catch {}
      }
    };
    window.addEventListener("switch-tab", handler);
    return () => window.removeEventListener("switch-tab", handler);
  }, []);

  // Бейдж на вкладке Лут когда новый предмет
  useEffect(() => {
    if (lastDrop && tab !== "loot") {
      requestAnimationFrame(() => setLootBadge(true));
    }
    if (tab === "loot") requestAnimationFrame(() => setLootBadge(false));
  }, [lastDrop, tab]);

  const handleTabChange = (value: string) => {
    if ((VALID_TABS as readonly string[]).includes(value)) {
      setTab(value as TabId);
      try { localStorage.setItem(STORAGE_KEY, value); } catch {}
    }
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
      <TabsList
        className={`w-full h-auto grid grid-cols-3 rounded-xl p-1 gap-1 ${isMobile ? "fixed bottom-0 left-0 right-0 z-30 rounded-none border-t" : ""}`}
        style={{
          background: "linear-gradient(135deg, rgba(28,25,35,0.95), rgba(15,13,21,0.95))",
          border: "2px solid rgba(168,85,247,0.25)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4), inset 0 0 12px rgba(0,0,0,0.3)",
        }}
      >
        <TabsTrigger
          value="hunt"
          className="gothic-ornate-btn gothic-font flex flex-col items-center gap-0.5 py-3 rounded-lg data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-200 text-zinc-400 transition-all"
        >
          <span className="text-xs font-bold tracking-wide">🏹 Добыча</span>
          <span className="text-[10px] font-mono text-zinc-500">{chestsCount} сунд.</span>
        </TabsTrigger>
        <TabsTrigger
          value="hero"
          className="gothic-ornate-btn gothic-font flex flex-col items-center gap-0.5 py-3 rounded-lg data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-200 text-zinc-400 transition-all"
        >
          <span className="text-xs font-bold tracking-wide">⚔ Герой</span>
          <span className="text-[10px] font-mono text-zinc-500">ур.{heroLevel} · {enemiesKilled}</span>
        </TabsTrigger>
        <TabsTrigger
          value="loot"
          className="gothic-ornate-btn gothic-font flex flex-col items-center gap-0.5 py-3 rounded-lg data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-200 text-zinc-400 transition-all relative"
        >
          <span className="text-xs font-bold tracking-wide">🎒 Лут</span>
          <span className="text-[10px] font-mono text-zinc-500">{inventoryCount} шт</span>
          {lootBadge && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="hunt" className="mt-3 tab-content-enter">
        {huntTab}
      </TabsContent>
      <TabsContent value="hero" className="mt-3 tab-content-enter">
        {heroTab}
      </TabsContent>
      <TabsContent value="loot" className="mt-3 tab-content-enter">
        {lootTab}
      </TabsContent>
    </Tabs>
  );
}
