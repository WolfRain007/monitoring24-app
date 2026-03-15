import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceKey);

function toPositiveInt(value: unknown, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-ingest-secret");
    if (!process.env.INGEST_SECRET || secret !== process.env.INGEST_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const batch_size = toPositiveInt(body.batch_size, 200);
    const max_loops = toPositiveInt(body.max_loops, 10);
    const stop_when_unchanged_loops = toPositiveInt(
      body.stop_when_unchanged_loops,
      2
    );

    const { data, error } = await supabase.rpc("assign_events_until_done", {
      p_batch_size: batch_size,
      p_max_loops: max_loops,
      p_stop_when_unchanged_loops: stop_when_unchanged_loops,
    });

    if (error) {
      console.error("assign_events_until_done rpc failed:", error.message);

      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          params: {
            batch_size,
            max_loops,
            stop_when_unchanged_loops,
          },
        },
        { status: 500 }
      );
    }

    const result = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);

    return NextResponse.json({
      ok: true,
      params: {
        batch_size,
        max_loops,
        stop_when_unchanged_loops,
      },
      result,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
