// app/api/maintenance/retention/route.ts
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
    const secret = req.headers.get("x-maintenance-secret");
    if (!process.env.MAINTENANCE_SECRET || secret !== process.env.MAINTENANCE_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const DAYS = 60;

    const { data, error } = await supabase.rpc("retention_cleanup_news_items", { days: DAYS });
    if (error) throw new Error(`RPC retention_cleanup_news_items error: ${error.message}`);

    const deleted = Array.isArray(data) ? Number(data[0]?.deleted ?? 0) : 0;

    return NextResponse.json({
      ok: true,
      policy: {
        table: "news_items",
        days: DAYS,
        only_unlinked: true,
        date_basis: "coalesce(published_at, created_at)",
      },
      deleted,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
