import { createClient } from "@/lib/supabase/server";

export type EventListItem = {
  id: string;
  title: string;
  description: string | null;
  categoryKey: string;
  cityId: string | null;
  countryCode: string | null;
  status: string | null;
  newsCount: number;
  sourceCount: number;
  lastSeenAt: string | null;
  createdAt: string | null;
  importanceScore: number | null;
  severityScore: number | null;
  confidenceScore: number | null;
};

export async function getEvents() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        description,
        category_key,
        city_id,
        country_code,
        status,
        news_count,
        source_count,
        last_seen_at,
        created_at,
        importance_score,
        severity_score,
        confidence_score
      `)
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .limit(25);

    if (error) {
      console.error("getEvents error:", error);
      return {
        items: [] as EventListItem[],
        error: "Не удалось загрузить события из базы.",
      };
    }

    const items: EventListItem[] = (data ?? []).map((row) => ({
      id: String(row.id),
      title: row.title,
      description: row.description,
      categoryKey: row.category_key,
      cityId: row.city_id ? String(row.city_id) : null,
      countryCode: row.country_code ?? null,
      status: row.status ?? null,
      newsCount: Number(row.news_count ?? 0),
      sourceCount: Number(row.source_count ?? 0),
      lastSeenAt: row.last_seen_at ?? null,
      createdAt: row.created_at ?? null,
      importanceScore:
        row.importance_score !== null ? Number(row.importance_score) : null,
      severityScore:
        row.severity_score !== null ? Number(row.severity_score) : null,
      confidenceScore:
        row.confidence_score !== null ? Number(row.confidence_score) : null,
    }));

    return {
      items,
      error: null as string | null,
    };
  } catch (error) {
    console.error("getEvents unexpected error:", error);
    return {
      items: [] as EventListItem[],
      error: "Произошла непредвиденная ошибка при загрузке событий.",
    };
  }
}
