import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // healthcheck: чтобы в браузере видеть что роут живой
  return NextResponse.json({ ok: true, route: "/api/rss/ingest" });
}

export async function POST(req: NextRequest) {
  // 1) Проверяем секрет
  const secret = req.headers.get("x-ingest-secret");
  if (!process.env.INGEST_SECRET || secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2) Здесь потом будет реальный ingest-код
  return NextResponse.json({ ok: true, did: "stub" });
}
