import { pathToFileURL } from "node:url";
import path from "node:path";
import { spawn } from "node:child_process";
import { P, readJson, addRun, appendActivity, getJobs } from "./lib.mjs";
import { scan } from "./scan.mjs";
import { score } from "./score.mjs";
import { tailorAuto } from "./tailor.mjs";
import { processCommands } from "./commands.mjs";
export async function cycle({ force = false } = {}) {
  const cmd = await processCommands();
  const prefs = await readJson(P.prefs, { autonomy: false });
  if (!prefs.autonomy && !force && !cmd.scanRequested) {
    return { skipped: true, reason: "autonomy is off", commands: cmd.processed };
  }
  const startedAt = Date.now();
  await appendActivity({ phase: "system", msg: "Hunt cycle started" });
  const s = await scan();
  const sc = await score();
  const profile = await readJson(P.profile, {});
  if (prefs.autonomy && !profile.isDemo) {
    try { await tailorAuto(8); } catch { /* tailoring is best-effort */ }
  }
  const jobs = await getJobs();
  const cvs = jobs.filter((j) => j.cvPath).length;
  const applied = jobs.filter((j) => ["applied", "interview", "offer"].includes(j.status)).length;
  const parked = jobs.filter((j) => j.status === "needs_you").length;
  const run = { id: `run_${startedAt.toString(36)}`, startedAt, endedAt: Date.now(), boardsScanned: s.boards, newJobs: s.added, scored: sc.scored, cvsGenerated: cvs, applied, parked };
  await addRun(run);
  await appendActivity({ phase: "system", level: "success", msg: `Cycle done · ${s.added} new · ${sc.scored} scored` });
  if (prefs.autonomy && prefs.autoSubmit && !profile.isDemo) {
    try {
      const applyScript = path.join(import.meta.dirname, "apply.mjs");
      const args = prefs.liveApply ? ["--live"] : [];
      spawn(process.execPath, [applyScript, ...args], { detached: true, stdio: "ignore", cwd: path.resolve(import.meta.dirname, "..") }).unref();
      await appendActivity({ phase: "apply", level: "info", msg: prefs.liveApply ? "Starting live applications" : "Preparing applications (dry run)" });
    } catch { /* apply runner failed to spawn */ }
  }
  return { ...s, ...sc };
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const force = process.argv.includes("--force");
  cycle({ force }).then((r) => console.log(JSON.stringify(r))).catch((e) => { console.error(e?.message || e); process.exit(1); });
}
