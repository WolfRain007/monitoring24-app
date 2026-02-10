// app/api/rss/ingest/route.ts
import { NextResponse } from "next/server";
import { fetchRssItems } from "@/lib/rss/parse";
import { saveRssItems } from "@/lib/rss/save";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-ingest-secret");
    if (!process.env.INGEST_SECRET || secret !== process.env.INGEST_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const items = await fetchRssItems();

    // Уникализация по URL внутри одного прогона
    const map = new Map<string, (typeof items)[number]>();
    for (const it of items) map.set(it.link, it);
    const unique = [...map.values()];

    const report = await saveRssItems(unique);

    return NextResponse.json({
      ok: true,
      fetched: items.length,
      unique: unique.length,
      saved: report,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
