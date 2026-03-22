// app/api/events/assign/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceKey);

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-ingest-secret");
    if (!process.env.INGEST_SECRET || secret !== process.env.INGEST_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const batchSize = Number(body?.batch_size ?? 50);
    const maxLoops = Number(body?.max_loops ?? 5);
    const stopWhenUnchangedLoops = Number(body?.stop_when_unchanged_loops ?? 2);
    const geoBackfillLimit = Number(body?.geo_backfill_limit ?? 200);
    const maxAge = String(body?.max_age ?? "30 days");

    const { data: geoData, error: geoError } = await supabase.rpc(
      "backfill_news_item_geo_v1",
      {
        p_limit: geoBackfillLimit,
        p_max_age: maxAge,
      }
    );

    if (geoError) {
      throw new Error(`RPC backfill_news_item_geo_v1 error: ${geoError.message}`);
    }

    const geo_backfilled = Number(geoData ?? 0);

    const { data: assignData, error: assignError } = await supabase.rpc(
      "assign_events_until_done_v8",
      {
        p_batch_size: batchSize,
        p_max_loops: maxLoops,
        p_stop_when_unchanged_loops: stopWhenUnchangedLoops,
        p_max_age: maxAge,
      }
    );

    if (assignError) {
      throw new Error(`RPC assign_events_until_done_v8 error: ${assignError.message}`);
    }

    return NextResponse.json({
      ok: true,
      params: {
        batch_size: batchSize,
        max_loops: maxLoops,
        stop_when_unchanged_loops: stopWhenUnchangedLoops,
        geo_backfill_limit: geoBackfillLimit,
        max_age: maxAge,
      },
      geo_backfilled,
      assign_result: assignData,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
