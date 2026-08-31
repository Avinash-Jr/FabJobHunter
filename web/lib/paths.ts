import path from "node:path";

export const DATA_DIR = process.env.FABJOB_DATA_DIR ?? path.resolve(process.cwd(), "..", "data");

export const paths = {
  dir: DATA_DIR,
  configDir: path.join(DATA_DIR, "config"),
  logDir: path.join(DATA_DIR, "log"),
  queueDir: path.join(DATA_DIR, "queue"),
  cvDir: path.join(DATA_DIR, "cv"),
  profile: path.join(DATA_DIR, "config", "profile.json"),
  prefs: path.join(DATA_DIR, "config", "prefs.json"),
  companies: path.join(DATA_DIR, "companies.json"),
  jobs: path.join(DATA_DIR, "jobs.json"),
  runs: path.join(DATA_DIR, "runs.json"),
  activity: path.join(DATA_DIR, "log", "activity.jsonl"),
  activityLegacy: path.join(DATA_DIR, "activity.json"),
  commands: path.join(DATA_DIR, "queue", "commands.jsonl"),
} as const;
