"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Snapshot = {
  jobs: Job[];
  activity: ActivityEvent[];
  stats?: Record<string, unknown>;
  prefs?: Record<string, unknown>;
  user?: { firstName?: string | null } | null;
  boards?: string[];
  [key: string]: unknown;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  url?: string;
  status: string;
  score?: number | null;
  grade?: string | null;
  matchPercent?: number | null;
  parked?: boolean;
  parkReason?: string | null;
  discoveredAt?: number | null;
  currency?: string | null;
  salary?: number | null;
  [key: string]: unknown;
};

export type ActivityEvent = {
  id: string;
  phase: "scan" | "score" | "cv" | "apply" | "park" | "interview" | "system";
  level: "info" | "success" | "warn" | "highlight";
  message: string;
  ts: number;
};

/**
 * Starts from the server snapshot, then subscribes to /api/stream.
 * Merges "snapshot" (full replace) and "update" (shallow patch) events.
 */
export function useLive(initial: Snapshot) {
  const [snapshot, setSnapshot] = useState<Snapshot>(initial);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    esRef.current = es;

    const onSnapshot = (e: MessageEvent) => {
      try {
        setSnapshot(JSON.parse(e.data) as Snapshot);
      } catch {
        /* ignore malformed frame */
      }
    };

    const onUpdate = (e: MessageEvent) => {
      try {
        const patch = JSON.parse(e.data) as Partial<Snapshot>;
        setSnapshot((prev) => ({ ...prev, ...patch }));
      } catch {
        /* ignore malformed frame */
      }
    };

    es.addEventListener("snapshot", onSnapshot);
    es.addEventListener("update", onUpdate);

    return () => {
      es.removeEventListener("snapshot", onSnapshot);
      es.removeEventListener("update", onUpdate);
      es.close();
      esRef.current = null;
    };
  }, []);

  return snapshot;
}

/** Ticks every `ms` so relative-time labels refresh on their own. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Fire-and-report a command to the backend. */
export async function sendCommand(type: string, payload?: unknown) {
  const res = await fetch("/api/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
  if (!res.ok) throw new Error(`command ${type} failed: ${res.status}`);
  return res.json().catch(() => ({}));
}

/** Persist a partial preferences patch. */
export async function savePrefs(patch: Record<string, unknown>) {
  const res = await fetch("/api/prefs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`savePrefs failed: ${res.status}`);
  return res.json().catch(() => ({}));
}