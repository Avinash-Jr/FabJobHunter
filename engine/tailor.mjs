import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";
import { DATA, getJobs, updateJob, appendActivity } from "./lib.mjs";
function focusOf(title) {
  const t = title.toLowerCase();
  if (/aero|propuls|cfd|mechanic|avionic|thermal|structural|spacecraft|rocket|manufactur|hardware|cad|aerodynam|fluid|stress|integrat/.test(t)) return "aerospace";
  if (/market|content|seo|social|growth|brand|community/.test(t)) return "media";
  if (/operation|business|founder|chief|strategy|capture|program|supply|account|finance/.test(t)) return "ops";
  return "software";
}
const SUMMARY = {
  aerospace: (c, r) => `Engineer targeting ${r} at ${c}, leading with the propulsion, simulation, and test-engineering delivery your CV already proves.`,
  software: (c, r) => `Engineer-builder who ships products end to end, targeting ${r} at ${c}, leading with the delivery and problem-solving your CV already shows.`,
  media: (c, r) => `Media and growth operator targeting ${r} at ${c}, leading with the audience-growth and SEO results your CV already lists.`,
  ops: (c, r) => `Founder and operator targeting ${r} at ${c}, leading with the cross-functional delivery your CV already shows.`,
};
async function tailorOne(job, base) {
  const idx = base.indexOf("## Experience");
  const head = idx >= 0 ? base.slice(0, idx).trim() : `# Application for ${job.company}`;
  const body = idx >= 0 ? base.slice(idx).trim() : base.trim();
  const focus = focusOf(job.title);
  const summary = `## Summary\n${SUMMARY[focus](job.company, job.title)}\n\n`;
  const reasons = (job.reasons || []).slice(0, 2).join(". ");
  const why = `\n\n## Why ${job.company}\n${reasons || "Strong overlap between my background and this role."}\n\n_Tailored by FabJobHunter for ${job.title} · ${job.matchPct}% match · grade ${job.grade}_\n`;
  const md = head + "\n\n" + summary + body + why;
  await fs.writeFile(path.join(DATA, "cv", `${job.id}.md`), md, "utf8");
  await updateJob(job.id, { status: "cv_ready", cvPath: `cv/${job.id}.md`, pdfPath: `cv/${job.id}.pdf` });
  await appendActivity({ phase: "cv", company: job.company, jobId: job.id, msg: `Tailored CV for ${job.company} · ${job.title}` });
}
export async function tailorAuto(limit = 8) {
  const base = await fs.readFile(path.join(DATA, "cv", "base.md"), "utf8");
  const jobs = await getJobs();
  const targets = jobs.filter((j) => ["A", "B"].includes(j.grade) && j.status === "scored" && !j.cvPath)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, limit);
  for (const j of targets) await tailorOne(j, base);
  return targets.length;
}
async function main() {
  const base = await fs.readFile(path.join(DATA, "cv", "base.md"), "utf8");
  const jobs = await getJobs();
  const topArg = process.argv.find((a) => a.startsWith("--top="));
  let targets;
  if (topArg) {
    const n = Number(topArg.split("=")[1]) || 8;
    targets = jobs.filter((j) => j.grade === "A").sort((a, b) => b.score - a.score).slice(0, n);
  } else {
    const ids = process.argv.slice(2).filter((a) => !a.startsWith("--"));
    targets = jobs.filter((j) => ids.includes(j.id));
  }
  for (const j of targets) await tailorOne(j, base);
  console.log(`tailored ${targets.length} CVs`);
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((e) => { console.error(e?.message || e); process.exit(1); });
}
