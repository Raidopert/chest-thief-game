"use client";

import { useEffect, useRef, useState } from "react";

// Звуковая система — процедурные звуки через WebAudio API
// Без внешних файлов, генерируется на лету

let ctx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setSoundEnabled(val: boolean) {
  enabled = val;
}

export function isSoundEnabled() {
  return enabled;
}

// Базовый тон
function tone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

// Звуки
export const Sounds = {
  click: () => tone(200, 0.08, "square", 0.08),
  keyDrop: () => {
    tone(440, 0.1, "triangle", 0.12);
    setTimeout(() => tone(660, 0.15, "triangle", 0.1), 60);
  },
  chestOpen: () => {
    tone(150, 0.15, "sawtooth", 0.1);
    setTimeout(() => tone(300, 0.2, "triangle", 0.08), 80);
    setTimeout(() => tone(500, 0.3, "sine", 0.06), 160);
  },
  hit: () => tone(100, 0.05, "sawtooth", 0.1),
  enemyKill: () => {
    tone(80, 0.1, "sawtooth", 0.15);
    setTimeout(() => tone(40, 0.2, "sine", 0.1), 50);
  },
  levelUp: () => {
    tone(523, 0.1, "triangle", 0.12);
    setTimeout(() => tone(659, 0.1, "triangle", 0.12), 80);
    setTimeout(() => tone(784, 0.2, "triangle", 0.12), 160);
  },
  lootRare: () => {
    tone(660, 0.1, "sine", 0.1);
    setTimeout(() => tone(880, 0.15, "sine", 0.1), 60);
    setTimeout(() => tone(1100, 0.2, "sine", 0.08), 120);
  },
  ult: () => {
    tone(200, 0.05, "sawtooth", 0.15);
    setTimeout(() => tone(100, 0.3, "sawtooth", 0.15), 30);
  },
  prestige: () => {
    tone(300, 0.2, "sine", 0.1);
    setTimeout(() => tone(400, 0.2, "sine", 0.1), 150);
    setTimeout(() => tone(500, 0.3, "sine", 0.1), 300);
    setTimeout(() => tone(600, 0.4, "sine", 0.08), 450);
  },
};

// React компонент — кнопка вкл/выкл звук
export function SoundToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    enabled = on;
  }, [on]);

  return (
    <button
      onClick={() => setOn(!on)}
      className="fixed top-3 right-3 z-30 w-10 h-10 rounded-full bg-black/60 border border-zinc-700 backdrop-blur-md flex items-center justify-center text-lg hover:bg-black/80 transition-colors"
      aria-label={on ? "Выключить звук" : "Включить звук"}
      title={on ? "Звук вкл" : "Звук выкл"}
    >
      {on ? "🔊" : "🔇"}
    </button>
  );
}
