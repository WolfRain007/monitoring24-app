// lib/rss/filter.ts
import type { ParsedRssItem } from "./parse";

export type DropReason =
  | "sports"
  | "culture"
  | "entertainment"
  | "other_noise";

function norm(s: string) {
  return (s ?? "").toLowerCase().trim();
}

function includesAny(haystack: string, needles: string[]) {
  return needles.some((n) => haystack.includes(n));
}

function matchUrl(url: string, patterns: string[]) {
  const u = norm(url);
  return includesAny(u, patterns);
}

function matchTitle(title: string, keywords: string[]) {
  const t = norm(title);
  return includesAny(t, keywords);
}

/**
 * Возвращает причину дропа или null если оставляем.
 * Работает без категорий RSS (только title+url), т.к. в текущем ParsedRssItem
 * категории могут отсутствовать.
 */
export function getDropReason(it: ParsedRssItem): DropReason | null {
  const title = it.title ?? "";
  const url = it.link ?? "";

  // --- SPORTS ---
  const sportsUrl = [
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
  ];

  const sportsKw = [
    // RU
    "спорт",
    "матч",
    "чемпионат",
    "турнир",
    "лига",
    "кубок",
    "плей-офф",
    "олимпиад",
    "сборная",
    "футбол",
    "хоккей",
    "теннис",
    "баскетбол",
    "волейбол",
    "чемпион",
    "тренер",
    "клуб",
    "дерби",
    "ufc",
    "mma",
    // EN
    "sport",
    "match",
    "tournament",
    "league",
    "cup",
    "playoff",
    "olympic",
    "team",
    "coach",
    "football",
    "soccer",
    "hockey",
    "tennis",
    "basketball",
    "volleyball",
    "nba",
    "nhl",
    "formula 1",
  ];

  if ((title && matchTitle(title, sportsKw)) || (url && matchUrl(url, sportsUrl))) {
    return "sports";
  }

  // --- CULTURE ---
  const cultureUrl = [
    "/culture",
    "/kultura",
    "/afisha",
    "/theatre",
    "/theater",
    "/cinema",
    "/movie",
    "/movies",
    "/music",
    "/art",
    "/books",
    "/literature",
  ];

  const cultureKw = [
    // RU
    "культура",
    "выставк",
    "музе",
    "театр",
    "спектакл",
    "премьера",
    "кино",
    "фильм",
    "сериал",
    "концерт",
    "фестиваль",
    "певец",
    "актёр",
    "актриса",
    "режиссёр",
    "художник",
    "литератур",
    "книга",
    "поэт",
    // EN
    "culture",
    "exhibition",
    "museum",
    "theatre",
    "theater",
    "cinema",
    "movie",
    "film",
    "series",
    "concert",
    "festival",
    "singer",
    "actor",
    "actress",
    "director",
    "artist",
    "book",
    "literature",
  ];

  if ((title && matchTitle(title, cultureKw)) || (url && matchUrl(url, cultureUrl))) {
    return "culture";
  }

  // --- ENTERTAINMENT / SHOWBIZ (часто тоже шум для city-events) ---
  // Если не хочешь резать это — скажи, уберу этот блок.
  const entUrl = ["/showbiz", "/stars", "/celebr", "/entertainment"];
  const entKw = [
    // RU
    "шоу-бизнес",
    "знаменит",
    "звезд",
    "селебр",
    "скандал",
    // EN
    "celebr",
    "showbiz",
    "entertainment",
  ];

  if ((title && matchTitle(title, entKw)) || (url && matchUrl(url, entUrl))) {
    return "entertainment";
  }

  return null;
}

export function shouldDrop(it: ParsedRssItem): { drop: boolean; reason: DropReason | null } {
  const reason = getDropReason(it);
  return { drop: Boolean(reason), reason };
}
