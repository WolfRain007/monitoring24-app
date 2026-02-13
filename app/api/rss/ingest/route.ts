// app/api/rss/ingest/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { fetchRssItems } from "@/lib/rss/parse";
import { saveRssItems, type IngestItem } from "@/lib/rss/save";
import { shouldDrop, type DropReason } from "@/lib/rss/filter";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceKey);

type RejectedRow = {
  source_type: "rss";
  source_id: string | null;
  source: string | null;
  lang: string | null;
  title: string | null;
  url: string | null;
  published_at: string | null; // Supabase сам кастит ISO string -> timestamptz
  dropped_reason: DropReason;
  categories: string[] | null;
  meta: Record<string, any>;
};

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-ingest-secret");
    if (!process.env.INGEST_SECRET || secret !== process.env.INGEST_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { items, stats_by_source } = await fetchRssItems();

    // ====== Шаг 4.1: фильтрация + сбор rejected для аудита ======
    const kept_items: typeof items = [];
    const rejected_rows: RejectedRow[] = [];
    const dropped_by_reason: Record<string, number> = {};

    for (const it of items) {
      const { drop, reason } = shouldDrop(it);

      if (drop && reason) {
        dropped_by_reason[reason] = (dropped_by_reason[reason] ?? 0) + 1;

        rejected_rows.push({
          source_type: "rss",
          source_id: it.source_id ?? null,
          source: it.source_title ?? null,
          lang: it.lang ?? null,
          title: it.title ?? null,
          url: it.link ?? null,
          published_at: it.published_at ?? null,
          dropped_reason: reason,
          categories: it.categories ?? null,
          meta: {},
        });

        continue;
      }

      kept_items.push(it);
    }

    // Пишем rejected в отдельную таблицу. Ошибка не должна ломать ingestion.
    // Safety cap: чтобы случайно не вставить десятки тысяч за раз.
    const REJECTED_CAP = 2000;
    let rejected_logged = 0;

    if (rejected_rows.length) {
      const chunk = rejected_rows.slice(0, REJECTED_CAP);

      const { error: rejErr } = await supabase.from("news_items_rejected").insert(chunk);
      if (rej
