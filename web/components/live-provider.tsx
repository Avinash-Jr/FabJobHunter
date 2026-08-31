"use client";

import { createContext, useContext, ReactNode } from "react";
import { useLive } from "@/lib/use-live";
import { type Snapshot } from "@/lib/types";

const LiveContext = createContext<Snapshot | null>(null);

export function LiveProvider({ initial, children }: { initial: Snapshot, children: ReactNode }) {
  const data = useLive(initial);
  return (
    <LiveContext.Provider value={data}>
      {children}
    </LiveContext.Provider>
  );
}

export function useSnapshot() {
  const ctx = useContext(LiveContext);
  if (!ctx) {
    throw new Error("useSnapshot must be used within a LiveProvider");
  }
  return ctx;
}
