import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { fetchRssItems } from "@/lib/rss/parse";
import { saveRssItems } from "@/lib/rss/save";

export const runtime = "nodejs";

function dedupeByUrl<T extends { link: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const key = (it.link || "").trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/rss/ingest" });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-ingest-secret");
  if (!process.env.INGEST_SECRET || secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fetched = await fetchRssItems();
    const unique = dedupeByUrl(fetched);
    const saveResult = await saveRssItems(unique);

    return NextResponse.json({
      ok: true,
      fetched: fetched.length,
      unique: unique.length,
      saved_attempted: saveResult.attempted,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
