import { createClient } from "@/lib/supabase/server";

export type NewsListItem = {
  id: string;
  title: string | null;
  source: string;
  sourceId: string;
  lang: string;
  cityId: string | null;
  eventId: string | null;
  publishedAt: string | null;
  createdAt: string | null;
  assignmentStatus: string | null;
  assignmentConfidence: string | null;
  status: string;
  contentStatus: string;
  categoryKey: string;
  countryCode: string | null;
};

export async function getNewsItems() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("news_items")
      .select(`
        id,
        title,
        source,
        source_id,
        lang,
        city_id,
        event_id,
        published_at,
        created_at,
        assignment_status,
        assignment_confidence,
        status,
        content_status,
        category_key,
        country_code
      `)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(40);

    if (error) {
      console.error("getNewsItems error:", error);
      return {
        items: [] as NewsListItem[],
        error: "Не удалось загрузить публикации из базы.",
      };
    }

    const items: NewsListItem[] = (data ?? []).map((row) => ({
      id: String(row.id),
      title: row.title,
      source: row.source,
      sourceId: row.source_id,
      lang: row.lang,
      cityId: row.city_id ? String(row.city_id) : null,
      eventId: row.event_id ? String(row.event_id) : null,
      publishedAt: row.published_at ?? null,
      createdAt: row.created_at ?? null,
      assignmentStatus: row.assignment_status ?? null,
      assignmentConfidence: row.assignment_confidence ?? null,
      status: row.status,
      contentStatus: row.content_status,
      categoryKey: row.category_key,
      countryCode: row.country_code ?? null,
    }));

    return {
      items,
      error: null as string | null,
    };
  } catch (error) {
    console.error("getNewsItems unexpected error:", error);
    return {
      items: [] as NewsListItem[],
      error: "Произошла непредвиденная ошибка при загрузке публикаций.",
    };
  }
}
