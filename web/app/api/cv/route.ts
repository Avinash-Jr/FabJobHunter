import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cvDir = path.join(process.cwd(), "..", "data", "cv");

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id") ?? "base";
    const filePath = path.join(cvDir, `${id}.md`);

    try {
      const content = await fs.readFile(filePath, "utf8");
      return new Response(content, { headers: { "Content-Type": "text/plain" } });
    } catch {
      return new Response("", { status: 404 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, markdown } = body;

    if (!id || markdown === undefined) {
      return Response.json({ success: false, error: "Missing id or markdown" }, { status: 400 });
    }

    await fs.mkdir(cvDir, { recursive: true });
    await fs.writeFile(path.join(cvDir, `${id}.md`), markdown, "utf8");

    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
