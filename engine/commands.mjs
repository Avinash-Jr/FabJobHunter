import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";
import { P, getJobs, saveJobs, appendActivity } from "./lib.mjs";
export async function processCommands() {
  let raw = "";
  try { raw = await fs.readFile(P.commands, "utf8"); } catch { return { processed: 0, scanRequested: false }; }
  const cmds = raw.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const pending = cmds.filter((c) => !c.done);
  if (!pending.length) return { processed: 0, scanRequested: false };
  let jobs = await getJobs();
  let scanRequested = false;
  for (const c of pending) {
    const jobId = c.payload?.jobId;
    if (c.type === "discard" && jobId) {
      jobs = jobs.map((j) => (j.id === jobId ? { ...j, status: "discarded", updatedAt: Date.now() } : j));
    } else if (c.type === "submit" && jobId) {
      const job = jobs.find((j) => j.id === jobId);
      jobs = jobs.map((j) => j.id === jobId ? { ...j, status: "applied", appliedAt: Date.now(), updatedAt: Date.now() } : j);
      await appendActivity({ phase: "apply", level: "success", company: job?.company, jobId, msg: `Marked applied: ${job?.company ?? ""}` });
    } else if (c.type === "scan_now") { scanRequested = true; }
    else if (c.type === "pause") { scanRequested = false; }
    c.done = true;
  }
  await saveJobs(jobs);
  await fs.writeFile(P.commands, cmds.map((c) => JSON.stringify(c)).join("\n") + "\n", "utf8");
  return { processed: pending.length, scanRequested };
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  processCommands().then((r) => console.log(JSON.stringify(r)));
}
