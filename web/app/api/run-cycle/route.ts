import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const rootDir = path.join(process.cwd(), "..");
const cycleScript = path.join("engine", "cycle.mjs");

export async function POST() {
  try {
    const lockPath = path.join(rootDir, "data", ".cycle-lock");

    if (fs.existsSync(lockPath)) {
      const stats = fs.statSync(lockPath);
      const isStale = Date.now() - stats.mtimeMs > 6 * 60 * 1000;
      if (!isStale) {
        return Response.json({ success: false, reason: "busy" }, { status: 429 });
      }
    }

    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(lockPath, new Date().toISOString(), "utf8");

    const child = spawn(process.execPath, [cycleScript, "--force"], {
      cwd: rootDir,
      detached: true,
      stdio: "ignore",
    });

    child.unref();

    return Response.json({ success: true, reason: "started" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
