import { queue } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_COMMANDS = ["scan_now", "submit", "discard"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type = body.type;
    const payload = body.payload ?? {};

    if (!ALLOWED_COMMANDS.includes(type)) {
      return Response.json({ success: false, error: "Invalid command" }, { status: 400 });
    }

    await queue(type, payload);
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
