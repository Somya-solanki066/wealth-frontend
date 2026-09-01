"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type WorldId = "neutral" | "writer" | "screenwriter" | "student";

export type WorldConfig = {
  id: Exclude<WorldId, "neutral">;
  icon: string;
  label: string;
  shortLabel: string;
  switcherClass: string;
  accentClass: string;
  cta: string;
  footerTagline: string;
  modalTitle: string;
  modalSub: string;
  worldLabel: string;
  selectOptions: string[];
  worldLink: string;
};

export const WORLD_CONFIG: Record<Exclude<WorldId, "neutral">, WorldConfig> = {
  writer: {
    id: "writer",
    icon: "✍️",
    label: "Writer",
    shortLabel: "Writer",
    switcherClass: "nws-w",
    accentClass: "world-writer",
    cta: "Start Writing Free",
    footerTagline: "Write It. Publish It. Earn From It.",
    modalTitle: "Join the Waitlist ✍️",
    modalSub: "Get early access to the Fiction Writer world. Founding member pricing included.",
    worldLabel: "I write for...",
    selectOptions: ["PocketFM", "Dreame", "GoodNovel", "WebNovel", "MegaNovel", "All platforms"],
    worldLink: "WEALTH Engine",
  },
  screenwriter: {
    id: "screenwriter",
    icon: "🎬",
    label: "Script",
    shortLabel: "Script",
    switcherClass: "nws-s",
    accentClass: "world-screenwriter",
    cta: "Start Scripting Free",
    footerTagline: "Script It. Pitch It. Get Produced.",
    modalTitle: "Join the Waitlist 🎬",
    modalSub: "Get early access to the Screenwriter world. Open Calls board, Industry Hub, and Script Marketplace.",
    worldLabel: "I write for...",
    selectOptions: ["Nollywood", "Hollywood", "BBC / UK", "Netflix Africa", "Audio Drama", "All industries"],
    worldLink: "Industry Hub",
  },
  student: {
    id: "student",
    icon: "🎓",
    label: "Student",
    shortLabel: "Student",
    switcherClass: "nws-st",
    accentClass: "world-student",
    cta: "Start Studying Free",
    footerTagline: "Study It. Pass It. Own Your Future.",
    modalTitle: "Join the Waitlist 🎓",
    modalSub: "Get early access to the Student world. JAMB practice, university past questions, Nursing, MBBS and all professional courses.",
    worldLabel: "I am a...",
    selectOptions: [
      "Jambite — preparing for JAMB UTME",
      "University Student (100L to Final Year)",
      "Nursing Student",
      "MBBS / Medical Student",
      "Professional Course Student",
    ],
    worldLink: "Past Questions",
  },
};

type WorldContextValue = {
  world: WorldId;
  setWorld: (world: WorldId) => void;
  config: WorldConfig | null;
  goHome: () => void;
};

const WorldContext = createContext<WorldContextValue | undefined>(undefined);
const STORAGE_KEY = "ink2wealth_world";
const BODY_WORLD_CLASSES = ["world-writer", "world-screenwriter", "world-student"] as const;

function syncBodyWorldClass(world: WorldId) {
  if (typeof document === "undefined") return;
  document.body.classList.remove(...BODY_WORLD_CLASSES);
  if (world === "writer" || world === "screenwriter" || world === "student") {
    document.body.classList.add(`world-${world}`);
  }
}

export function WorldProvider({ children }: { children: React.ReactNode }) {
  const [world, setWorldState] = useState<WorldId>("neutral");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY) as WorldId | null;
      if (saved === "writer" || saved === "screenwriter" || saved === "student") {
        setWorldState(saved);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    syncBodyWorldClass(world);
    return () => {
      document.body.classList.remove(...BODY_WORLD_CLASSES);
    };
  }, [world, hydrated]);

  const setWorld = (next: WorldId) => {
    setWorldState(next);
    try {
      if (next === "neutral") sessionStorage.removeItem(STORAGE_KEY);
      else sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goHome = () => setWorld("neutral");

  const config = world === "neutral" ? null : WORLD_CONFIG[world];

  return (
    <WorldContext.Provider value={{ world, setWorld, config, goHome }}>
      {children}
    </WorldContext.Provider>
  );
}

export function useWorld() {
  const ctx = useContext(WorldContext);
  if (!ctx) throw new Error("useWorld must be used within WorldProvider");
  return ctx;
}
