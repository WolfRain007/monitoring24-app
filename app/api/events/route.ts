import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("SUPABASE_URL exists:", !!url);
  console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!key);

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
    const status = searchParams.get("status")?.trim() || null;
    const eventFamilyKey = searchParams.get("event_family_key")?.trim() || null;
    const dateFrom = searchParams.get("date_from")?.trim() || null;
    const dateTo = searchParams.get("date_to")?.trim() || null;
    const sortBy = searchParams.get("sort_by")?.trim() || "last_seen_desc";

    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || 20), 1),
      100
    );
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    const { data, error } = await supabase.rpc("api_events_list", {
      p_q: q,
      p_status: status,
      p_event_family_key: eventFamilyKey,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_sort_by: sortBy,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error("Supabase RPC error:", error);

      return NextResponse.json(
        {
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    console.log("api_events_list typeof data:", typeof data);
    console.log("api_events_list isArray:", Array.isArray(data));
    console.log(
      "api_events_list sample:",
      JSON.stringify(data)?.slice(0, 1000)
    );

    const rows = Array.isArray(data) ? data : [];
    const total = rows.length > 0 ? Number(rows[0]?.total_count || 0) : 0;

    const items = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      started_at: row.started_at,
      last_seen_at: row.last_seen_at,
      event_family_key: row.event_family_key,
      city_id: row.city_id,
      country_code: row.country_code,
      real_news_count: row.real_news_count,
    }));

    return NextResponse.json({
      items,
      total,
      limit,
      offset,
    });
  } catch (err: any) {
    console.error("GET /api/events failed:", err);

    return NextResponse.json(
      {
        error: err?.message || "Internal server error",
        stack: err?.stack || null,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();

    const { data, error } = await supabase
      .from("events")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("POST /api/events insert failed:", error);

      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/events failed:", err);

    return NextResponse.json(
      {
        error: err?.message || "Internal server error",
        stack: err?.stack || null,
      },
      { status: 500 }
    );
  }
}
