// lib/rss/filter.ts
import type { ParsedRssItem } from "./parse";

function norm(s: string) {
  return (s ?? "").toLowerCase();
}

function hasSportsInUrl(url: string) {
  const u = norm(url);
  return [
    "/sport",
    "/sports",
    "/football",
    "/soccer",
    "/hockey",
    "/tennis",
    "/basketball",
    "/volleyball",
    "/mma",
    "/ufc",
    "/nba",
    "/nhl",
    "/f1",
    "/formula-1",
  ].some((p) => u.includes(p));
}

function hasSportsKeywords(text: string) {
  const t = norm(text);
  const kw = [
    // RU
    "спорт",
    "матч",
    "чемпионат",
    "турнир",
    "лига",
    "кубок",
    "гол",
    "плей-офф",
    "олимпиад",
    "футбол",
    "хоккей",
    "теннис",
    "баскетбол",
    "волейбол",
    "ufc",
    "mma",
    // EN
    "sport",
    "match",
    "tournament",
    "league",
    "cup",
    "goal",
    "playoff",
    "olympic",
    "football",
    "soccer",
    "hockey",
    "tennis",
    "basketball",
    "volleyball",
    "ufc",
    "mma",
    "nba",
    "nhl",
    "formula 1",
  ];
  return kw.some((k) => t.includes(k));
}

export function isSportsItem(it: ParsedRssItem): boolean {
  const title = it.title ?? "";
  const link = it.link ?? "";
  if (title && hasSportsKeywords(title)) return true;
  if (link && hasSportsInUrl(link)) return true;
  return false;
}
