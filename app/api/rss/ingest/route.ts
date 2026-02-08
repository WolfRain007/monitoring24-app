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

export async function POST() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("news_items")
      .insert({
        event_id: null,
        source: "test",
        url: "https://example.com",
        published_at: new Date().toISOString(),
        source_type: "rss",
      });

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { status: "ok" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("INGEST ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
