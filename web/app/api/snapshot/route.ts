import { getSnapshot, saveProfile } from "@/lib/data";
import { spawnSync } from "node:child_process";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const rootDir = path.join(process.cwd(), "..");

export async function GET() {
  try {
    const snap = await getSnapshot();
    return Response.json(snap);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = body.name;

    if (name === "demo") {
      const script = path.join("engine", "seed.mjs");
      const result = spawnSync(process.execPath, [script], { cwd: rootDir, stdio: "pipe" });
      if (result.status !== 0) {
        throw new Error(result.stderr?.toString() || "Seed failed");
      }
    } else if (name === "real") {
      const snap = await getSnapshot();
      const profile = snap.profile ?? {};
      await saveProfile({ ...profile, isDemo: false });
    }

    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
