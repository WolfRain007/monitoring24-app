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

    const NEWS_ITEMS_DAYS = 60;     // как было
    const REJECTED_DAYS = 14;       // как ты выбрал

    // 1) Чистим news_items (как было)
    const { data: dataNews, error: errNews } = await supabase.rpc(
      "retention_cleanup_news_items",
      { days: NEWS_ITEMS_DAYS }
    );
    if (errNews) throw new Error(`RPC retention_cleanup_news_items error: ${errNews.message}`);

    const deleted_news_items = Array.isArray(dataNews) ? Number(dataNews[0]?.deleted ?? 0) : 0;

    // 2) Чистим news_items_rejected (новое)
    const { data: dataRejected, error: errRejected } = await supabase.rpc(
      "retention_cleanup_news_items_rejected",
      { days: REJECTED_DAYS }
    );
    if (errRejected) {
      throw new Error(`RPC retention_cleanup_news_items_rejected error: ${errRejected.message}`);
    }

    const deleted_rejected = Array.isArray(dataRejected)
      ? Number(dataRejected[0]?.deleted ?? 0)
      : 0;

    return NextResponse.json({
      ok: true,
      policy: {
        news_items: {
          table: "news_items",
          days: NEWS_ITEMS_DAYS,
          only_unlinked: true,
          date_basis: "coalesce(published_at, created_at)",
          rpc: "retention_cleanup_news_items",
        },
        news_items_rejected: {
          table: "news_items_rejected",
          days: REJECTED_DAYS,
          date_basis: "created_at",
          rpc: "retention_cleanup_news_items_rejected",
        },
      },
      deleted: {
        news_items: deleted_news_items,
        news_items_rejected: deleted_rejected,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
