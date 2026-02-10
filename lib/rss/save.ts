import { createClient } from "@supabase/supabase-js";
import type { ParsedRssItem } from "./parse";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    "Supabase env variables are missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
  );
}

const supabase = createClient(supabaseUrl, serviceKey);

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

  const { error } = await supabase
    .from("news_items")
    .upsert(rows, { onConflict: "url", ignoreDuplicates: true });

  if (error) throw new Error(`Supabase upsert error: ${error.message}`);

  return { attempted: rows.length };
}
