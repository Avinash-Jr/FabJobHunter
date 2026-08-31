import { getCompanies, saveCompanies } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const companies = [...(await getCompanies())];

    if (body.add) {
      companies.push(body.add);
    } else if (body.toggle) {
      const idx = companies.findIndex(
        (c) => c.name === body.toggle.name && c.token === body.toggle.token
      );
      if (idx !== -1) {
        companies[idx] = { ...companies[idx], enabled: body.toggle.enabled };
      }
    }

    await saveCompanies(companies);
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
