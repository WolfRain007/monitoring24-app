// lib/rss/save.ts
import { createClient } from "@supabase/supabase-js";
import type { ParsedRssItem } from "./parse";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceKey);

export type IngestItem = ParsedRssItem & {
  url_norm: string;
};

export type SaveReport = {
  attempted: number;

  // precheck (оценка до записи)
  existing_in_db: number; // сколько url_norm уже есть в БД
  would_insert: number; // сколько новых (attempted - existing_in_db)

  // факт (из RPC)
  inserted: number;
  updated: number;

  by_source: Record<
    string,
    {
      attempted: number;
      existing_in_db: number;
      would_insert: number;
    }
  >;
};

export async function saveRssItems(items: IngestItem[]): Promise<SaveReport> {
  const attempted = items.length;

  if (attempted === 0) {
    return {
      attempted: 0,
      existing_in_db: 0,
      would_insert: 0,
      inserted: 0,
      updated: 0,
      by_source: {},
    };
  }

  // init stats by source
  const by_source: SaveReport["by_source"] = {};
  for (const it of items) {
    const k = it.source_id;
    by_source[k] ??= { attempted: 0, existing_in_db: 0, would_insert: 0 };
    by_source[k].attempted++;
  }

  // ===== precheck: существующие url_norm =====
  const norms = items.map((it) => it.url_norm);
  const existing = new Set<string>();

  const BATCH = 200;
  for (let i = 0; i < norms.length; i += BATCH) {
    const chunk = norms.slice(i, i + BATCH);

    const { data, error } = await supabase.from("news_items").select("url_norm").in("url_norm", chunk);

    if (error) throw new Error(`Supabase precheck error: ${error.message}`);
    for (const r of data ?? []) existing.add(r.url_norm);
  }

  for (const it of items) {
    if (existing.has(it.url_norm)) by_source[it.source_id].existing_in_db++;
  }
  for (const k of Object.keys(by_source)) {
    by_source[k].would_insert = by_source[k].attempted - by_source[k].existing_in_db;
  }

  const existing_in_db = existing.size;
  const would_insert = attempted - existing_in_db;

  // ===== bulk-upsert через RPC =====
  // url_norm НЕ отправляем: он заполняется триггером в БД из url
  const payload = items.map((it) => ({
    title: it.title,
    url: it.link,
    published_at: it.published_at ?? null,
    source: it.source_title,
    source_type: "rss",
    source_id: it.source_id,
    lang: it.lang,

    // NEW: контент
    content_html: it.content_html ?? null,
    content_text: it.content_text ?? null,
  }));

  const { data: upData, error: upErr } = await supabase.rpc("upsert_news_items_rss", {
    items: payload,
  });

  if (upErr) throw new Error(`Supabase RPC upsert_news_items_rss error: ${upErr.message}`);

  const inserted = Array.isArray(upData) ? Number(upData[0]?.inserted ?? 0) : 0;
  const updated = Array.isArray(upData) ? Number(upData[0]?.updated ?? 0) : 0;

  return {
    attempted,
    existing_in_db,
    would_insert,
    inserted,
    updated,
    by_source,
  };
}
