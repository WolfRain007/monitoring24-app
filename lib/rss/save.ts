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

  existing_in_db: number;
  would_insert: number;

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

  const by_source: SaveReport["by_source"] = {};
  for (const it of items) {
    const k = it.source_id;
    by_source[k] ??= { attempted: 0, existing_in_db: 0, would_insert: 0 };
    by_source[k].attempted++;
  }
