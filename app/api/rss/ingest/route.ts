// app/api/rss/ingest/route.ts
import { NextResponse } from "next/server";
import { fetchRssItems } from "@/lib/rss/parse";
import { saveRssItems } from "@/lib/rss/save";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceKey);

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-ingest-secret");
    if (!process.env.INGEST_SECRET || secret !== process.env.INGEST_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const items = await fetchRssItems();

    // 1) Нормализуем URL "как в БД" пачками через RPC
    const urls = items.map((it) => it.link);
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

    // 2) Дедуп внутри прогона уже по url_norm (идеально)
    // Берём первый встретившийся item для каждого url_norm
    const byNorm = new Map<string, (typeof items)[number]>();
    let skippedNoNorm = 0;

    for (const it of items) {
      const norm = urlToNorm.get(it.link);
      if (!norm) {
        skippedNoNorm++;
        continue;
      }
      if (!byNorm.has(norm)) byNorm.set(norm, it);
    }

    const unique = [...byNorm.values()];

    // 3) Сохраняем
    const report = await saveRssItems(unique);

    return NextResponse.json({
      ok: true,
      fetched: items.length,
      unique: unique.length, // теперь это уникальность по url_norm
      skipped_no_norm: skippedNoNorm,
      saved: report,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
