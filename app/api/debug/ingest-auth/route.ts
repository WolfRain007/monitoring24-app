import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const headerSecret = req.headers.get("x-ingest-secret");
  const envSecret = process.env.INGEST_SECRET ?? "";

  return NextResponse.json({
    ok: true,
    has_env_secret: envSecret.length > 0,
    env_secret_length: envSecret.length,
    header_present: headerSecret !== null,
    header_length: headerSecret?.length ?? 0,
    matches: headerSecret === envSecret,
  });
}
