import Parser from "rss-parser";
import { RSS_SOURCES } from "./sources";

const parser = new Parser({
  headers: {
    "User-Agent": "monitoring24/1.0 (+https://monitoring24.info)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  },
});

export type ParsedRssItem = {
  title: string;
  link: string;
  published_at?: string;
  source_id: string;
  source_title: string;
  lang: "ru" | "en";
};

function pickLink(item: any): string | undefined {
  const link =
    (typeof item?.link === "string" && item.link.trim()) ||
    (typeof item?.guid === "string" && item.guid.trim()) ||
    (typeof item?.id === "string" && item.id.trim());

  // Иногда guid/id не URL. Отфильтруем очевидный мусор.
  if (!link) return undefined;
  if (!/^https?:\/\//i.test(link)) return undefined;
  return link;
}

function pickPublishedAt(item: any): string | undefined {
  // rss-parser обычно кладёт isoDate; но у некоторых есть pubDate
  const v = item?.isoDate ?? item?.pubDate;
  return typeof v === "string" ? v : undefined;
}

async function fetchFeedXml(url: string): Promise<{ xml: string; contentType?: string; status: number }> {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": "monitoring24/1.0 (+https://monitoring24.info)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    },
    // @ts-ignore - в Node runtime поддерживается
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? undefined;
  const xml = await res.text();
  return { xml, contentType, status: res.status };
}

function looksLikeXml(text: string): boolean {
  const t = text.trim().slice(0, 200).toLowerCase();
  return t.startsWith("<?xml") || t.includes("<rss") || t.includes("<feed") || t.includes("<rdf");
}

export async function fetchRssItems(): Promise<ParsedRssItem[]> {
  const items: ParsedRssItem[] = [];

  for (const source of RSS_SOURCES) {
    const started = Date.now();
    let kept = 0;
    let skipped = 0;

    try {
      // 1) Скачиваем XML руками (для Euronews часто надёжнее)
      const { xml, contentType, status } = await fetchFeedXml(source.url);

      if (status >= 400) {
        console.error(`[RSS] source=${source.id} status=${status} url=${source.url}`);
        continue;
      }

      if (!looksLikeXml(xml)) {
        console.error(
          `[RSS] source=${source.id} not_xml url=${source.url} contentType=${contentType} head=${xml
            .trim()
            .slice(0, 120)}`
        );
        continue;
      }

      // 2) Парсим строку
      const feed = await parser.parseString(xml);
      const total = feed.items?.length ?? 0;

      // 3) Нормализуем items
      for (const it of feed.items ?? []) {
        const title = typeof it.title === "string" ? it.title.trim() : "";
        const link = pickLink(it);
        const published_at = pickPublishedAt(it);

        if (!title || !link) {
          skipped++;
          continue;
        }

        items.push({
          title,
          link,
          published_at,
          source_id: source.id,
          source_title: source.title,
          lang: source.language,
        });
        kept++;
      }

      const ms = Date.now() - started;
      console.log(
        `[RSS] source=${source.id} ok total=${total} kept=${kept} skipped=${skipped} ms=${ms} contentType=${contentType}`
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[RSS] source=${source.id} error=${message}`);
    }
  }

  return items;
}
