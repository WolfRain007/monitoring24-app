// lib/rss/save.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceKey);

export type ParsedRssItem = {
  title: string;
  link: string;
  published_at?: string | null;
  source_title: string;
  source_id: string;
  lang: string;
};

export type IngestItem = ParsedRssItem & {
  url_norm: string; // “истинный” url_norm (как в БД)
};

type SaveReport = {
  attempted: number;
  existing_in_db: number;
  would_insert: number;
  would_update: number;
  by_source: Record<
    string,
    { attempted: number; existing_in_db: number; would_insert: number; would_update: number }
  >;
};

export async function saveRssItems(items: IngestItem[]) {
  // 1) rows: отправляем RAW url, url_norm НЕ отправляем (триггер сам).
  // Важно: onConflict по url_norm требует UNIQUE индекса на url_norm (у тебя есть).
  const rows = items.map((item) => ({
    title: item.title,
    url: item.link, // raw
    published_at: item.published_at ?? null,
    source: item.source_title,
    source_type: "rss",
    source_id: item.source_id,
    lang: item.lang,
  }));

  // 2) attempted по источникам
  const by_source: SaveReport["by_source"] = {};
  for (const it of items) {
    const k = it.source_id;
    by_source[k] ??= { attempted: 0, existing_in_db: 0, would_insert: 0, would_update: 0 };
    by_source[k].attempted++;
  }

  // 3) precheck по url_norm (который уже посчитан в route.ts)
  const norms = items.map((it) => it.url_norm);
  const existing = new Set<string>();

  const BATCH = 200;
  for (let i = 0; i < norms.length; i += BATCH) {
    const chunk = norms.slice(i, i + BATCH);

    const { data, error } = await supabase
      .from("news_items")
      .select("url_norm")
      .in("url_norm", chunk);

    if (error) throw new Error(`Supabase precheck error: ${error.message}`);

    for (const r of data ?? []) existing.add(r.url_norm);
  }

  // existing по источникам
  for (const it of items) {
    if (existing.has(it.url_norm)) by_source[it.source_id].existing_in_db++;
  }

  // 4) UPSERT по url_norm
  const { error } = await supabase
    .from("news_items")
    .upsert(rows, { onConflict: "url_norm" });

  if (error) throw new Error(`Supabase upsert error: ${error.message}`);

  // 5) отчёт
  const attempted = rows.length;
  const existing_in_db = existing.size;

  for (const k of Object.keys(by_source)) {
    by_source[k].would_update = by_source[k].existing_in_db;
    by_source[k].would_insert = by_source[k].attempted - by_source[k].existing_in_db;
  }

  return {
    attempted,
    existing_in_db,
    would_insert: attempted - existing_in_db,
    would_update: existing_in_db,
    by_source,
  } satisfies SaveReport;
}
