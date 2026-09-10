import { pathToFileURL } from "node:url";
import { P, readJson, getJobs, saveJobs, appendActivity } from "./lib.mjs";
import { makeHttpCtx } from "./providers/_http.mjs";
import greenhouse from "./providers/greenhouse.mjs";
import lever from "./providers/lever.mjs";
import ashby from "./providers/ashby.mjs";
import workable from "./providers/workable.mjs";
const PROVIDERS = { greenhouse, lever, ashby, workable };
const ctx = makeHttpCtx();
const DEFAULT_POS = [ "software engineer", "sde", "software development engineer", "backend", "back-end", "back end", "fullstack", "full-stack", "full stack" ];
const NEG = ["intern ","internship","co-op","apprentice"];
function keywords(profile) {
  const fromRoles = (profile.targetRoles || []).join(" ").toLowerCase().split(/[^a-z0-9+]+/).filter((w) => w.length > 2);
  return Array.from(new Set([...fromRoles, ...DEFAULT_POS]));
}
function lastSeg(url) {
  try { return new URL(url).pathname.split("/").filter(Boolean).pop() || url; } catch { return url; }
}
export async function scan({ perCompany = 8 } = {}) {
  const companies = (await readJson(P.companies, [])).filter((c) => c.enabled);
  const profile = await readJson(P.profile, {});
  const pos = keywords(profile);
  const existing = await getJobs();
  const seen = new Set(existing.map((j) => j.id));
  const now = Date.now();
  const fresh = [];
  let boards = 0;
  for (const c of companies) {
    const provider = PROVIDERS[c.ats];
    if (!provider) continue;
    const entry = { name: c.name, token: c.token, careersUrl: c.careersUrl };
    let list = [];
    try { list = await provider.fetch(entry, ctx); boards++; } catch { continue; }
    const picked = list.filter((j) => {
      const t = (j.title || "").toLowerCase();
      if (!j.title || !j.url) return false;
      if (NEG.some((n) => t.includes(n))) return false;
      return pos.some((p) => t.includes(p));
    }).slice(0, perCompany);
    for (const j of picked) {
      const id = `${c.ats}_${c.token}_${lastSeg(j.url)}`;
      if (seen.has(id)) continue;
      seen.add(id);
      fresh.push({ id, company: c.name, title: j.title, url: j.url, location: j.location || "", ats: c.ats, salary: j.salary || null, postedAt: j.postedAt, discoveredAt: now, updatedAt: now, status: "new" });
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  if (fresh.length) await saveJobs([...fresh, ...existing]);
  await appendActivity({ phase: "scan", level: "info", msg: `Scanned ${boards} ${boards === 1 ? "board" : "boards"}, found ${fresh.length} new ${fresh.length === 1 ? "role" : "roles"}` });
  return { boards, added: fresh.length };
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  scan().then((r) => console.log(JSON.stringify(r))).catch((e) => { console.error(e?.message || e); process.exit(1); });
}
