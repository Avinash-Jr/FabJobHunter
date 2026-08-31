// Small hand-operated helper for nudging one job's status from the terminal.
// Nothing else in the engine imports this; it exists for when you want to
// correct the record yourself.
//
//   node engine/mark.mjs cv      <jobId>
//   node engine/mark.mjs applied <jobId>
//   node engine/mark.mjs park    <jobId> <reason> "<note>"
//
import { pathToFileURL } from "node:url";
import { updateJob } from "./lib.mjs";

// Must stay in step with ParkReason in web/lib/types.ts.
const PARK_REASONS = [
  "captcha", "email_verification", "account_wall", "workday",
  "legal_question", "ghost", "low_fit", "unknown_form",
];

const USAGE = [
  "Usage:",
  "  node engine/mark.mjs cv      <jobId>            job is ready to send",
  "  node engine/mark.mjs applied <jobId>            you sent it, stamps the time",
  "  node engine/mark.mjs park    <jobId> <reason> \"<note>\"   needs you to step in",
  "",
  `Park reasons: ${PARK_REASONS.join(", ")}`,
].join("\n");

function fail(message) {
  console.error(`${message}\n\n${USAGE}`);
  process.exit(1);
}

export async function mark(argv) {
  const [action, jobId, ...rest] = argv;
  if (!action) fail("Tell me what to do: cv, applied or park.");
  if (!jobId) fail(`"${action}" needs a job id.`);

  let patch;
  if (action === "cv") {
    patch = { status: "cv_ready" };
  } else if (action === "applied") {
    patch = { status: "applied", appliedAt: Date.now() };
  } else if (action === "park") {
    const [reason, ...noteParts] = rest;
    if (!reason) fail("park needs a reason so the dashboard can group it.");
    if (!PARK_REASONS.includes(reason)) fail(`"${reason}" is not a park reason I know.`);
    const note = noteParts.join(" ").trim();
    patch = { status: "needs_you", parkedReason: reason, ...(note ? { parkedNote: note } : {}) };
  } else {
    fail(`"${action}" is not something I can do.`);
  }

  const job = await updateJob(jobId, patch);
  if (!job) fail(`No job with id "${jobId}" in data/state/jobs.json.`);
  return job;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  mark(process.argv.slice(2))
    .then((j) => {
      const extra = j.parkedReason ? ` (${j.parkedReason}${j.parkedNote ? `: ${j.parkedNote}` : ""})` : "";
      console.log(`${j.company} · ${j.title}\n  ${j.id} -> ${j.status}${extra}`);
    })
    .catch((e) => { console.error(e?.message || e); process.exit(1); });
}
