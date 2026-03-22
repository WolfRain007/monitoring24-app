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

    const batchSize = Number(body?.batch_size ?? 100);
    const maxLoops = Number(body?.max_loops ?? 20);
    const maxSeconds = Number(body?.max_seconds ?? 45);

    const { data, error } = await supabase.rpc("assign_events_until_done_vnext", {
      p_batch_size: batchSize,
      p_max_loops: maxLoops,
      p_max_seconds: maxSeconds,
    });

    if (error) {
      throw new Error(`RPC assign_events_until_done_vnext error: ${error.message}`);
    }

    return NextResponse.json({
      ok: true,
      params: {
        batch_size: batchSize,
        max_loops: maxLoops,
        max_seconds: maxSeconds,
      },
      result: data,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
