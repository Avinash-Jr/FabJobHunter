import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { paths } from "./paths";
import type { Activity, Board, Job, JobStats, Prefs, Profile, Snapshot } from "./types";

export const DEFAULT_PREFS: Prefs = {
  autonomy: false,
  autoSubmit: true,
  liveApply: false,
  autoSubmitMinScore: 4.0,
  dailyCap: 12,
  perCap: 2,
  scanIntervalMin: 30,
  workingHours: { start: 9, end: 19 },
  theme: "day",
  blockedCompanies: [],
};

export const EMPTY_PROFILE: Profile = {
  fullName: "",
  email: "",
  location: "",
  targetRoles: [],
  comp: { currency: "USD" },
  legal: {},
  onboarded: false,
};

let jobsCache: { sig: string; jobs: Job[] } | null = null;
let snapshotCache: { sig: string; snapshot: Snapshot } | null = null;

function jobsFileSig(): string {
  try {
    const s = fs.statSync(paths.jobs);
    return `${s.mtimeMs}:${s.size}`;
  } catch {
    return "0";
  }
}

function snapshotSig(): string {
  return JSON.stringify(statSig());
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fsp.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function readJsonlTail<T>(file: string, limit: number): Promise<T[]> {
  try {
    const stat = await fsp.stat(file);
    if (stat.size === 0) return [];

    const readSize = Math.min(stat.size, 48 * 1024);
    const fh = await fsp.open(file, "r");
    try {
      const buf = Buffer.alloc(readSize);
      await fh.read(buf, 0, readSize, Math.max(0, stat.size - readSize));
      let text = buf.toString("utf8");
      if (stat.size > readSize) {
        const firstNl = text.indexOf("\n");
        if (firstNl !== -1) text = text.slice(firstNl + 1);
      }
      return text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          try {
            return JSON.parse(l) as T;
          } catch {
            return null;
          }
        })
        .filter((x): x is T => x !== null)
        .slice(-limit);
    } finally {
      await fh.close();
    }
  } catch {
    return [];
  }
}

async function writeJsonAtomic(file: string, value: unknown): Promise<void> {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Math.round(performance.now())}`;
  await fsp.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fsp.rename(tmp, file);
  snapshotCache = null;
  if (file === paths.jobs) jobsCache = null;
}

async function appendJsonl(file: string, value: unknown): Promise<void> {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.appendFile(file, JSON.stringify(value) + "\n", "utf8");
  snapshotCache = null;
}

function normalizePrefs(raw: Record<string, unknown> = {}): Prefs {
  const autonomy = (raw.autonomy ?? raw.autoHunt ?? DEFAULT_PREFS.autonomy) as boolean;
  const liveApply = (raw.liveApply ?? raw.liveSubmit ?? DEFAULT_PREFS.liveApply) as boolean;
  const autoSubmitMinScore = (raw.autoSubmitMinScore ?? raw.minAutoScore ?? DEFAULT_PREFS.autoSubmitMinScore) as number;
  const perCap = (raw.perCap ?? raw.companyCap ?? DEFAULT_PREFS.perCap) as number;
  const scanIntervalMin = (raw.scanIntervalMin ?? raw.scanInterval ?? DEFAULT_PREFS.scanIntervalMin) as number;

  return {
    ...DEFAULT_PREFS,
    ...raw,
    autonomy,
    liveApply,
    autoSubmitMinScore,
    perCap,
    scanIntervalMin,
    autoHunt: autonomy,
    liveSubmit: liveApply,
    minAutoScore: autoSubmitMinScore,
    companyCap: perCap,
    scanInterval: scanIntervalMin,
  };
}

function normalizeActivity(raw: Record<string, unknown>, index: number): Activity {
  const ts = (raw.timestamp ?? raw.ts ?? Date.now()) as number;
  return {
    id: String(raw.id ?? `act_${ts}_${index}`),
    timestamp: ts,
    phase: (raw.phase ?? "system") as Activity["phase"],
    level: (raw.level ?? "info") as Activity["level"],
    message: String(raw.message ?? raw.msg ?? ""),
  };
}

function slimJob(job: Job): Job {
  const { reasons: _r, gaps: _g, legitimacy: _l, ...rest } = job;
  return rest;
}

function buildJobStats(jobs: Job[]): JobStats {
  const byStatus: Record<string, number> = {};
  let parked = 0;
  const companies = new Set<string>();

  for (const job of jobs) {
    byStatus[job.status] = (byStatus[job.status] ?? 0) + 1;
    if (job.parked) parked += 1;
    companies.add(job.company);
  }

  return {
    total: jobs.length,
    byStatus,
    parked,
    companies: companies.size,
  };
}

function countRolesByCompany(jobs: Job[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    counts.set(job.company, (counts.get(job.company) ?? 0) + 1);
  }
  return counts;
}

function toBoards(companies: Array<Record<string, unknown>>, roleCounts: Map<string, number>): Board[] {
  return companies.map((c, i) => ({
    id: String(c.token ?? c.id ?? i),
    name: String(c.name ?? ""),
    ats: c.ats as Board["ats"],
    enabled: c.enabled !== false,
    rolesFound: roleCounts.get(String(c.name)) ?? 0,
    token: c.token as string | undefined,
  }));
}

export const getProfile = () => readJson<Profile>(paths.profile, EMPTY_PROFILE);

export async function getPrefs(): Promise<Prefs> {
  const raw = await readJson<Record<string, unknown>>(paths.prefs, {});
  return normalizePrefs(raw);
}

export const getCompanies = () => readJson<Array<Record<string, unknown>>>(paths.companies, []);

export async function getJobs(): Promise<Job[]> {
  const sig = jobsFileSig();
  if (jobsCache?.sig === sig) return jobsCache.jobs;

  const jobs = await readJson<Job[]>(paths.jobs, []);
  jobsCache = { sig, jobs };
  return jobs;
}

export async function getActivity(limit = 80): Promise<Activity[]> {
  const jsonl = await readJsonlTail<Record<string, unknown>>(paths.activity, limit);
  if (jsonl.length > 0) {
    return jsonl.map(normalizeActivity);
  }

  const legacy = await readJson<Array<Record<string, unknown>>>(paths.activityLegacy, []);
  return legacy.slice(-limit).map(normalizeActivity);
}

async function buildSnapshot(): Promise<Snapshot> {
  const [profile, prefs, jobs, activity, companies] = await Promise.all([
    getProfile(),
    getPrefs(),
    getJobs(),
    getActivity(80),
    getCompanies(),
  ]);

  const roleCounts = countRolesByCompany(jobs);
  const boards = toBoards(companies, roleCounts);

  return {
    profile,
    prefs,
    jobs: jobs.map(slimJob),
    activity,
    boards,
    autonomy: prefs.autonomy ?? false,
    jobStats: buildJobStats(jobs),
  };
}

export async function getSnapshot(): Promise<Snapshot> {
  const sig = snapshotSig();
  if (snapshotCache?.sig === sig) return snapshotCache.snapshot;

  const snapshot = await buildSnapshot();
  snapshotCache = { sig, snapshot };
  return snapshot;
}

/** Lightweight payload for first paint — no job list in the HTML. */
export async function getShellSnapshot(): Promise<Snapshot> {
  const full = await getSnapshot();
  return {
    profile: full.profile,
    prefs: full.prefs,
    activity: full.activity.slice(0, 30),
    boards: full.boards,
    autonomy: full.autonomy,
    jobStats: full.jobStats,
    jobs: [],
  };
}

export async function savePrefs(patch: Partial<Prefs>) {
  const current = await getPrefs();
  const merged = normalizePrefs({ ...current, ...patch });

  if (patch.autoHunt !== undefined) merged.autonomy = patch.autoHunt;
  if (patch.liveSubmit !== undefined) merged.liveApply = patch.liveSubmit;
  if (patch.minAutoScore !== undefined) merged.autoSubmitMinScore = patch.minAutoScore;
  if (patch.companyCap !== undefined) merged.perCap = patch.companyCap;
  if (patch.scanInterval !== undefined) merged.scanIntervalMin = patch.scanInterval;

  await writeJsonAtomic(paths.prefs, merged);
}

export async function saveProfile(profile: Profile) {
  await writeJsonAtomic(paths.profile, { ...profile, updatedAt: Date.now() });
}

export async function saveCompanies(companies: unknown[]) {
  await writeJsonAtomic(paths.companies, companies);
}

export async function queue(type: string, payload: Record<string, unknown> = {}) {
  await appendJsonl(paths.commands, { type, payload, done: false, ts: Date.now() });
}

export function statSig(): Record<string, number> {
  const sig: Record<string, number> = {};
  for (const f of [paths.jobs, paths.companies, paths.activity, paths.prefs, paths.profile, paths.commands]) {
    try {
      const s = fs.statSync(f);
      sig[f] = s.mtimeMs * 1e6 + s.size;
    } catch {
      sig[f] = 0;
    }
  }
  return sig;
}

export { paths };
