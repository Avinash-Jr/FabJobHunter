import { pathToFileURL } from "node:url";
import { P, readJson, getJobs, updateJob, appendActivity } from "./lib.mjs";

export async function apply({ live = false } = {}) {
  const prefs = await readJson(P.prefs, { autonomy: false, liveApply: false });
  const jobs = await getJobs();
  const pending = jobs.filter((j) => j.status === "cv_ready" && !j.parked);

  await appendActivity({
    phase: "apply",
    level: "info",
    msg: live
      ? `Live apply requested for ${pending.length} ready job(s)`
      : `Dry-run apply checked ${pending.length} ready job(s)`,
  });

  return { checked: pending.length, live };
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const live = process.argv.includes("--live");
  apply({ live })
    .then((r) => console.log(JSON.stringify(r)))
    .catch((e) => {
      console.error(e?.message || e);
      process.exit(1);
    });
}
