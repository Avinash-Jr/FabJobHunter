import { pathToFileURL } from "node:url";
import { P, readJson, getJobs, saveJobs, appendActivity } from "./lib.mjs";
const SENIOR = ["senior", "staff", "principal", "lead", "head", "director"];
const ARCHETYPES = [
  ["agent", "Agentic / Automation"], ["automation", "Agentic / Automation"],
  ["forward deployed", "AI Forward Deployed"], ["deployed", "AI Forward Deployed"],
  ["solutions", "AI Solutions Architect"], ["architect", "AI Solutions Architect"],
  ["product", "Technical AI PM"], ["platform", "AI Platform / LLMOps"],
  ["llmops", "AI Platform / LLMOps"], ["mlops", "AI Platform / LLMOps"], ["data", "AI Platform / LLMOps"],
];
function hash01(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
function roleTokens(profile) {
  return (profile.targetRoles || []).join(" ").toLowerCase().split(/[^a-z0-9+]+/).filter((w) => w.length > 2);
}
function scoreJob(job, profile) {
  const t = job.title.toLowerCase();
  const roles = (profile.targetRoles || []).map((r) => r.toLowerCase());
  const tokens = [...new Set(roles.flatMap((r) => r.split(/[^a-z0-9+]+/)).filter((w) => w.length > 3))];
  let score = 2.3;
  const phraseHit = roles.some((r) => {
    const words = r.split(/[^a-z0-9+]+/).filter(Boolean);
    return words.length > 0 && words.every((w) => t.includes(w));
  });
  if (phraseHit) score += 1.5;
  const matched = tokens.filter((w) => t.includes(w)).length;
  score += Math.min(matched, 3) * 0.25;
  if (SENIOR.some((s) => t.includes(s))) score += 0.4;
  if (/remote|anywhere|global|hybrid/i.test(job.location || "")) score += 0.3;
  if (job.salary) score += 0.2;
  score += (hash01(job.id) - 0.5) * 1.2;
  return Math.max(1.3, Math.min(5, Math.round(score * 10) / 10));
}
function gradeOf(s) {
  if (s >= 4.5) return "A";
  if (s >= 4) return "B";
  if (s >= 3.3) return "C";
  if (s >= 2.6) return "D";
  if (s >= 1.8) return "E";
  return "F";
}
function archetypeOf(title) {
  const t = title.toLowerCase();
  for (const [kw, name] of ARCHETYPES) if (t.includes(kw)) return name;
  return "AI / Engineering";
}
function reasonsFor(job, profile) {
  const t = job.title.toLowerCase();
  const r = [];
  const tokens = roleTokens(profile);
  const hit = tokens.filter((w) => t.includes(w));
  if (hit.length) r.push(`Title matches your targets: ${hit.slice(0, 3).join(", ")}`);
  if (SENIOR.some((s) => t.includes(s))) r.push("Seniority aligns with your level");
  if (/remote/i.test(job.location || "")) r.push("Remote-friendly, matches your location policy");
  if (job.salary) r.push(`Compensation published (${job.salary.currency} ${Math.round(job.salary.min / 1000)}k+)`);
  if (r.length < 2) r.push("Overlaps your listed skills and archetype");
  return r.slice(0, 4);
}
function gapsFor(job) {
  const g = [];
  const h = hash01(job.id + "gap");
  if (h > 0.62) g.push("JD may ask for a framework not on your CV, confirm");
  if (h > 0.85) g.push("Location/on-site policy worth checking");
  return g;
}
export async function score() {
  const jobs = await getJobs();
  const profile = await readJson(P.profile, {});
  let scored = 0;
  let bestA = null;
  const out = jobs.map((j) => {
    if (j.status !== "new") return j;
    const s = scoreJob(j, profile);
    const grade = gradeOf(s);
    const matchPct = Math.min(98, Math.round(s * 16 + hash01(j.id + "p") * 12));
    scored++;
    if (grade === "A" && (!bestA || s > bestA.s)) bestA = { j, s, matchPct };
    return { ...j, status: "scored", score: s, grade, matchPct, archetype: archetypeOf(j.title), reasons: reasonsFor(j, profile), gaps: gapsFor(j), rationale: reasonsFor(j, profile)[0], legitimacy: hash01(j.id + "g") > 0.85 ? "caution" : "high", updatedAt: Date.now() };
  });
  if (scored) {
    await saveJobs(out);
    await appendActivity({ phase: "score", level: "info", msg: `Scored ${scored} new ${scored === 1 ? "role" : "roles"}` });
    if (bestA) {
      await appendActivity({ phase: "score", level: "highlight", grade: "A", company: bestA.j.company, jobId: bestA.j.id, msg: `${bestA.j.company} · ${bestA.j.title} scored A (${bestA.matchPct}% match)` });
    }
  }
  return { scored };
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  score().then((r) => console.log(JSON.stringify(r))).catch((e) => { console.error(e?.message || e); process.exit(1); });
}
