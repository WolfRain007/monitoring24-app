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
  published_at: string | null; // ISO string ok -> timestamptz
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

    // 1) Фильтрация + сбор rejected
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

    // 2) Пишем rejected в отдельную таблицу (не ломаем ingestion если упало)
    const REJECTED_CAP = 2000;
    let rejected_logged = 0;

    if (rejected_rows.length) {
      const chunk = rejected_rows.slice(0, REJECTED_CAP);
      const { error: rejErr } = await supabase.from("news_items_rejected").insert(chunk);

      if (rejErr) {
        console.warn("news_items_rejected insert failed:", rejErr.message);
      } else {
        rejected_logged = chunk.length;
      }
    }

    // 3) RPC нормализации URL только для kept_items
    const urls = kept_items.map((it) => it.link);
    const BATCH = 200;

    const urlToNorm = new Map<string, string>();

    for (let i = 0; i < urls.length; i += BATCH) {
      const chunk = urls.slice(i, i + BATCH);

      const { data, error } = await supabase.rpc("normalize_url_pg_many", { urls: chunk });
      if (error) throw new Error(`RPC normalize_url_pg_many error: ${error.message}`);

      for (const r of data ?? []) {
        if (r?.url && r?.url_norm) urlToNorm.set(r.url, r.url_norm);
      }
    }

    // 4) Дедуп по url_norm + подготовка к saveRssItems
    const byNorm = new Map<string, IngestItem>();
    let skipped_no_norm = 0;

    for (const it of kept_items) {
      const norm = urlToNorm.get(it.link);
      if (!norm) {
        skipped_no_norm++;
        continue;
      }
      if (!byNorm.has(norm)) byNorm.set(norm, { ...it, url_norm: norm });
    }

    const unique = [...byNorm.values()];

    // 5) Сохранение в news_items
    const report = await saveRssItems(unique);

    // 6) Суммарная статистика по RSS источникам (как было)
    const rss_stats_total = Object.values(stats_by_source).reduce(
      (acc, s) => {
        acc.total_items += s.total_items ?? 0;
        acc.kept += s.kept ?? 0;
        acc.skipped += s.skipped ?? 0;
        acc.badDate += s.badDate ?? 0;
        acc.ms += s.ms ?? 0;
        return acc;
      },
      { total_items: 0, kept: 0, skipped: 0, badDate: 0, ms: 0 }
    );

    return NextResponse.json({
      ok: true,

      fetched: items.length,
      kept_after_filter: kept_items.length,
      dropped_total: items.length - kept_items.length,
      dropped_by_reason,

      rejected_total: rejected_rows.length,
      rejected_logged,

      unique: unique.length,
      skipped_no_norm,

      rss_stats: stats_by_source,
      rss_stats_total,

      saved: report,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
