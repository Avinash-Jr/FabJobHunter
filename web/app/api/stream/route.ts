import { getSnapshot, statSig } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_MS = 3000;

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let poll: ReturnType<typeof setInterval> | undefined;
  let beat: ReturnType<typeof setInterval> | undefined;
  let lastSig = "";

  const cleanup = () => {
    if (poll) clearInterval(poll);
    if (beat) clearInterval(beat);
  };

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          cleanup();
        }
      };

      try {
        lastSig = JSON.stringify(statSig());

        poll = setInterval(async () => {
          try {
            const sig = JSON.stringify(statSig());
            if (sig !== lastSig) {
              lastSig = sig;
              send("update", await getSnapshot());
            }
          } catch {
            /* ignore transient read errors */
          }
        }, POLL_MS);

        beat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            cleanup();
          }
        }, 30000);
      } catch {
        cleanup();
        controller.close();
      }
    },
    cancel() {
      cleanup();
    },
  });

  req.signal.addEventListener("abort", cleanup);

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
