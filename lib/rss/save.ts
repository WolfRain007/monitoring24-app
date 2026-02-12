// lib/rss/save.ts
import { createClient } from "@supabase/supabase-js";
import type { ParsedRssItem } from "./parse";
import { normalizeUrl } from "./normalizeUrl";

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
    { attempted: number; existing_in_db: number; would_insert: number; would_update: number }
  >;
};

export async function saveRssItems(items: ParsedRssItem[]) {
  const rows = items.map((item) => {
    const norm = normalizeUrl(item.link);
    return {
      title: item.title,
      url: norm,
      url_norm: norm,
      published_at: item.published_at ?? null,
      source: item.source_title,
      source_type: "rss",
      source_id: item.source_id,
      lang: item.lang,
    };
  });

  const by_source: SaveReport["by_source"] = {};
  for (const it of items) {
    const k = it.source_id;
    by_source[k] ??= { attempted: 0, existing_in_db: 0, would_insert: 0, would_update: 0 };
    by_source[k].attempted++;
  }

  const norms = rows.map((r) => r.url_norm);
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

  for (const it of items) {
    const norm = normalizeUrl(it.link);
    if (existing.has(norm)) by_source[it.source_id].existing_in_db++;
  }

  const { error } = await supabase
    .from("news_items")
    .upsert(rows, { onConflict: "url_norm" });

  if (error) throw new Error(`Supabase upsert error: ${error.message}`);

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
