"use client";

import { useEffect, useState } from "react";
import type { Snapshot } from "./types";

const SSE_POLL_DEFER_MS = 1500;
const FULL_FETCH_DEFER_MS = 0;

function scheduleIdle(task: () => void, timeoutMs: number) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const id = window.requestIdleCallback(task, { timeout: timeoutMs });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(task, FULL_FETCH_DEFER_MS);
  return () => clearTimeout(id);
}

export function useLive(initial: Snapshot) {
  const [data, setData] = useState<Snapshot>(initial);

  // Load full job list after first paint (shell has stats only).
  useEffect(() => {
    if (initial.jobs.length > 0) return;

    let cancelled = false;
    const cancelSchedule = scheduleIdle(async () => {
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const snap = (await res.json()) as Snapshot;
        if (!cancelled) setData(snap);
      } catch (err) {
        console.error("Failed to load snapshot", err);
      }
    }, 2000);

    return () => {
      cancelled = true;
      cancelSchedule();
    };
  }, [initial.jobs.length]);

  // Live updates  deferred so initial render isn't competing with SSE setup.
  useEffect(() => {
    let sse: EventSource | null = null;
    const timer = setTimeout(() => {
      sse = new EventSource("/api/stream");

      sse.addEventListener("update", (e) => {
        try {
          setData(JSON.parse(e.data) as Snapshot);
        } catch (err) {
          console.error("Failed to parse update", err);
        }
      });
    }, SSE_POLL_DEFER_MS);

    return () => {
      clearTimeout(timer);
      sse?.close();
    };
  }, []);

  return data;
}

export function useNow(intervalMs: number = 30000) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}

export async function sendCommand(type: string, payload: Record<string, unknown> = {}) {
  const res = await fetch("/api/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
  if (!res.ok) throw new Error("Command failed");
  return res.json();
}

export async function savePrefs(patch: Partial<Snapshot["prefs"]>) {
  const res = await fetch("/api/prefs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Save prefs failed");
  return res.json();
}

