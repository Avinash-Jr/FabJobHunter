import fs from "node:fs/promises";
import path from "node:path";

export const DATA = path.resolve(import.meta.dirname, "..", "data");
export const P = {
  profile: path.join(DATA, "config", "profile.json"),
  prefs: path.join(DATA, "config", "prefs.json"),
  companies: path.join(DATA, "companies.json"),
  jobs: path.join(DATA, "jobs.json"),
  runs: path.join(DATA, "runs.json"),
  activity: path.join(DATA, "log", "activity.jsonl"),
  commands: path.join(DATA, "queue", "commands.jsonl"),
  cvDir: path.join(DATA, "cv"),
};

export async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; }
}

export async function writeJsonAtomic(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const json = JSON.stringify(value, null, 2);
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmp, json, "utf8");
  for (let i = 0; i < 6; i++) {
    try { await fs.rename(tmp, file); return; }
    catch (e) {
      if ((e.code === "EPERM" || e.code === "EBUSY") && i < 5) { await new Promise((r) => setTimeout(r, 60 * (i + 1))); continue; }
      try { await fs.writeFile(file, json, "utf8"); await fs.rm(tmp, { force: true }); return; } catch { throw e; }
    }
  }
}

export async function appendActivity(ev) {
  await fs.mkdir(path.dirname(P.activity), { recursive: true });
  const line = JSON.stringify({ ts: Date.now(), level: "info", ...ev });
  await fs.appendFile(P.activity, line + "\n", "utf8");
}

export const getJobs = () => readJson(P.jobs, []);
export const saveJobs = (jobs) => writeJsonAtomic(P.jobs, jobs);

export async function addRun(run) {
  const runs = await readJson(P.runs, []);
  runs.push(run);
  await writeJsonAtomic(P.runs, runs.slice(-50));
}

export async function updateJob(id, patch) {
  const jobs = await getJobs();
  const next = jobs.map((j) => (j.id === id ? { ...j, ...patch, updatedAt: Date.now() } : j));
  await saveJobs(next);
  return next.find((j) => j.id === id);
}


