// lib/rss/filter.ts
import type { ParsedRssItem } from "./parse";

export type DropReason = "sports" | "culture";

function norm(s: string) {
  return (s ?? "").toLowerCase().trim();
}

function includesAny(haystack: string, needles: string[]) {
  const h = norm(haystack);
  return needles.some((n) => h.includes(n));
}

function anyCategoryMatches(categories: string[] | undefined, needles: string[]) {
  if (!categories?.length) return false;
  const joined = categories.map(norm).join(" | ");
  return needles.some((n) => joined.includes(n));
}

export function getDropReason(it: ParsedRssItem): DropReason | null {
  const title = it.title ?? "";
  const url = it.link ?? "";
  const categories = it.categories;

  // ===== SPORTS =====
  const sportsCat = [
    "спорт",
    "sport",
    "sports",
    "футбол",
    "football",
    "soccer",
    "хоккей",
    "hockey",
    "теннис",
    "tennis",
    "mma",
    "ufc",
    "nba",
    "nhl",
    "формула 1",
    "formula 1",
    "f1",
  ];

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
    "тренер",
    "клуб",
    "дерби",
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
    "ufc",
    "mma",
  ];

  if (
    anyCategoryMatches(categories, sportsCat) ||
    (title && includesAny(title, sportsKw)) ||
    (url && includesAny(url, sportsUrl))
  ) {
    return "sports";
  }

  // ===== CULTURE =====
  const cultureCat = [
    "культура",
    "culture",
    "афиша",
    "afisha",
    "театр",
    "theatre",
    "theater",
    "кино",
    "cinema",
    "film",
    "музыка",
    "music",
    "art",
    "искусство",
    "books",
    "книги",
  ];

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
    "художник",
    "режиссёр",
    "режиссер",
    "актёр",
    "актер",
    "актриса",
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
    "artist",
    "director",
    "actor",
    "actress",
    "literature",
    "book",
  ];

  if (
    anyCategoryMatches(categories, cultureCat) ||
    (title && includesAny(title, cultureKw)) ||
    (url && includesAny(url, cultureUrl))
  ) {
    return "culture";
  }

  return null;
}

export function shouldDrop(it: ParsedRssItem): { drop: boolean; reason: DropReason | null } {
  const reason = getDropReason(it);
  return { drop: Boolean(reason), reason };
}
