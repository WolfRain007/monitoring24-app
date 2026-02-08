import { NextResponse } from "next/server";
import { fetchRssItems } from "@/lib/rss/parse";
import { saveRssItems } from "@/lib/rss/save";

export async function POST() {
  try {
    const items = await fetchRssItems();
    await saveRssItems(items);

    return NextResponse.json({
      ok: true,
      count: items.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
