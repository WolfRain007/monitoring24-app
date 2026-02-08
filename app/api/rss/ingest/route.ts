export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { fetchRssItems } from "@/lib/rss/parse";
import { saveRssItems } from "@/lib/rss/save";

export async function POST() {
  console.log("RSS INGEST CRON STARTED");

  try {
    const items = await fetchRssItems();
    console.log("Fetched items:", items.length);

    await saveRssItems(items);
    console.log("Saved items");

    return NextResponse.json({
      ok: true,
      count: items.length,
    });
  } catch (e: any) {
    console.error("RSS INGEST ERROR:", e);
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
