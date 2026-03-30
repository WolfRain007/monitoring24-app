import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    "Missing env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) / SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabase = createClient(supabaseUrl, serviceKey);

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function normalizeMode(value: unknown): "assign" | "geo_only" | "full" {
  const v = String(value ?? "assign").trim().toLowerCase();

  if (v === "assign" || v === "geo_only" || v === "full") {
    return v;
  }

  return "assign";
}

function normalizeMaxAge(value: unknown): string {
  const s = String(value ?? "30 days").trim();
  return s.length > 0 ? s : "30 days";
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    const secret = req.headers.get("x-ingest-secret");
    if (!process.env.INGEST_SECRET || secret !== process.env.INGEST_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const mode = normalizeMode(body?.mode);
    const batchSize = clampInt(body?.batch_size, 20, 1, 500);
    const maxLoops = clampInt(body?.max_loops, 1, 1, 50);
    const stopWhenUnchangedLoops = clampInt(
      body?.stop_when_unchanged_loops,
      1,
      1,
      10
    );
    const geoBackfillLimit = clampInt(body?.geo_backfill_limit, 0, 0, 1000);
    const maxAge = normalizeMaxAge(body?.max_age);

    let geoAttempted = false;
    let geoSkipped = true;
    let geoBackfilled = 0;
    let geoWarning: string | null = null;
    let assignData: unknown = null;

    const shouldRunGeo = mode === "geo_only" || mode === "full";
    const shouldRunAssign = mode === "assign" || mode === "full";

    if (shouldRunGeo) {
      if (geoBackfillLimit > 0) {
        geoAttempted = true;
        geoSkipped = false;

        const { data: geoData, error: geoError } = await supabase.rpc(
          "backfill_news_item_geo_v2",
          {
            p_limit: geoBackfillLimit,
            p_max_age: maxAge,
          }
        );

        if (geoError) {
          throw new Error(
            `RPC backfill_news_item_geo_v2 error: ${geoError.message}`
          );
        }

        geoBackfilled = Number(geoData ?? 0);
      } else {
        geoWarning = "geo_backfill_limit=0, geo stage skipped";
      }
    }

    if (shouldRunAssign) {
      const { data, error } = await supabase.rpc("assign_events_until_done_v8", {
        p_batch_size: batchSize,
        p_max_loops: maxLoops,
        p_stop_when_unchanged_loops: stopWhenUnchangedLoops,
        p_max_age: maxAge,
      });

      if (error) {
        throw new Error(
          `RPC assign_events_until_done_v8 error: ${error.message}`
        );
      }

      assignData = data;
    }

    return NextResponse.json({
      ok: true,
      mode,
      params: {
        batch_size: batchSize,
        max_loops: maxLoops,
        stop_when_unchanged_loops: stopWhenUnchangedLoops,
        geo_backfill_limit: geoBackfillLimit,
        max_age: maxAge,
      },
      geo: {
        attempted: geoAttempted,
        skipped: geoSkipped,
        backfilled: geoBackfilled,
        warning: geoWarning,
      },
      assign_result: assignData,
      meta: {
        duration_ms: Date.now() - startedAt,
        executed_at: new Date().toISOString(),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);

    return NextResponse.json(
      {
        ok: false,
        error: message,
        meta: {
          duration_ms: Date.now() - startedAt,
          executed_at: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
