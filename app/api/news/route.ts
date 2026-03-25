import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase env variables are missing");
  }

  return createClient(url, key);
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q")?.trim() || null;
    const language = searchParams.get("language")?.trim() || null;
    const sourceName = searchParams.get("source_name")?.trim() || null;

    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || 20), 1),
      100
    );
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    let query = supabase
      .from("news_items")
      .select(
        `
          id,
          title,
          source,
          published_at,
          lang,
          country_code,
          url,
          event_id,
          city_id,
          content_text
        `,
        { count: "exact" }
      )
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (q) {
      const safeQ = q.replace(/,/g, " ");
      query = query.or(`title.ilike.%${safeQ}%,content_text.ilike.%${safeQ}%`);
    }

    if (language) {
      query = query.eq("lang", language);
    }

    if (sourceName) {
      query = query.ilike("source", `%${sourceName}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("GET /api/news query failed:", error);

      return NextResponse.json(
        {
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    const rows = Array.isArray(data) ? data : [];

    const items = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      source_name: row.source,
      published_at: row.published_at,
      language: row.lang,
      country_code: row.country_code,
      url: row.url,
      event_id: row.event_id,
      city_id: row.city_id,
      content_text: row.content_text,
    }));

    return NextResponse.json({
      items,
      total: count || 0,
      limit,
      offset,
    });
  } catch (err: any) {
    console.error("GET /api/news failed:", err);

    return NextResponse.json(
      {
        error: err?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
