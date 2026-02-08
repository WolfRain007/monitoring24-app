import { createClient } from "@supabase/supabase-js";
import { ParsedRssItem } from "./parse";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Supabase env variables are missing");
}

const supabase = createClient(supabaseUrl, serviceKey);

export async function saveRssItems(
  items: ParsedRssItem[]
) {
  for (const item of items) {
    const { error } = await supabase
      .from("news_items")
      .insert({
        title: item.title,
        url: item.link,
        published_at: item.published_at,
        source: item.source_title,
        source_type: "rss",
      });

    // дедупликация по unique url
    if (error && !error.message.includes("duplicate")) {
      console.error("Insert error:", error.message);
    }
  }
}
