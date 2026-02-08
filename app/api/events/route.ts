import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Supabase env variables are missing");
}

const supabase = createClient(supabaseUrl, serviceKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        description,
        started_at,
        cities (
          name,
          country
        )
      `)
      .order("started_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Server error" },
      { status: 500 }
    );
  }
}
