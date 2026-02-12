// lib/rss/normalizeUrl.ts
export function normalizeUrl(raw: string): string {
  let u: URL;

  try {
    u = new URL(raw);
  } catch {
    // Не валим ingest из-за битого URL — просто возвращаем как есть
    return raw;
  }

  // 1) убираем якорь
  u.hash = "";

  // 2) убираем www.
  u.hostname = u.hostname.replace(/^www\./i, "");

  // 3) убираем trailing slash (кроме корня)
  if (u.pathname !== "/" && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.slice(0, -1);
  }

  // 4) чистим трекинг-параметры
  const dropExact = new Set([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_id",
    "utm_reader",
    "utm_name",
    "utm_referrer",

    "gclid",
    "gbraid",
    "wbraid",
    "yclid",
    "fbclid",
    "mc_cid",
    "mc_eid",

    "ref",
    "referrer",
    "cmpid",
    "smid",
    "s",
    "sr",
    "spm",
    "mkt_tok",
    "ito",
    "icid",
    "ocid",
  ]);

  for (const key of [...u.searchParams.keys()]) {
    const k = key.toLowerCase();
    if (dropExact.has(k) || k.startsWith("utm_")) {
      u.searchParams.delete(key);
    }
  }

  // 5) сортируем query-параметры (стабильность строки)
  const entries = [...u.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
  u.search = "";
  for (const [k, v] of entries) u.searchParams.append(k, v);

  return u.toString();
}
