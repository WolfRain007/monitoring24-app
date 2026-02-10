// lib/rss/save.ts
import { createClient } from "@supabase/supabase-js";
import type { ParsedRssItem } from "./parse";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceKey);

type SaveReport = {
  attempted: number;
  existing_in_db: number;
  would_insert: number;
  would_update: number;
  by_source: Record<
    string,
    {
      attempted: number;
      existing_in_db: number;
      would_insert: number;
      would_update: number;
    }
  >;
};

export async function saveRssItems(items: ParsedRssItem[]) {
  const rows = items.map((item) => ({
    title: item.title,
    url: item.link,
    published_at: item.published_at ?? null,
    source: item.source_title,
    source_type: "rss",
    source_id: item.source_id,
    lang: item.lang,
  }));

  // 1) breakdown по источникам (по входным данным)
  const by_source: SaveReport["by_source"] = {};
  for (const it of items) {
    const k = it.source_id;
    by_source[k] ??= { attempted: 0, existing_in_db: 0, would_insert: 0, would_update: 0 };
    by_source[k].attempted++;
  }

  // 2) Узнаём какие URL уже есть в БД (оценка insert/update)
  // Важно: supabase .in() имеет лимиты по длине запроса, поэтому батчим.
  const urls = rows.map((r) => r.url);
  const existing = new Set<string>();

  const BATCH = 200; // безопасный размер
  for (let i = 0; i < urls.length; i += BATCH) {
    const chunk = urls.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from("news_items")
      .select("url")
      .in("url", chunk);

    if (error) throw new Error(`Supabase precheck error: ${error.message}`);
    for (const r of data ?? []) existing.add(r.url);
  }

  // считаем existing по источникам
  for (const it of items) {
    if (existing.has(it.link)) {
      by_source[it.source_id].existing_in_db++;
    }
  }

  // 3) Сам upsert (обновляет поля при дубле url)
  const { error } = await supabase
    .from("news_items")
    .upsert(rows, { onConflict: "url" });

  if (error) throw new Error(`Supabase upsert error: ${error.message}`);

  // 4) Финальные числа (оценочные, но полезные)
  const existing_in_db = existing.size;
  const attempted = rows.length;
  const would_insert = attempted - existing_in_db;
  const would_update = existing_in_db;

  for (const k of Object.keys(by_source)) {
    by_source[k].would_update = by_source[k].existing_in_db;
    by_source[k].would_insert = by_source[k].attempted - by_source[k].existing_in_db;
  }

  const report: SaveReport = {
    attempted,
    existing_in_db,
    would_insert,
    would_update,
    by_source,
  };

  return report;
}
