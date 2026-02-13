// lib/rss/parse.ts
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

export type RssFetchStats = {
  total_items: number;
  kept: number;
  skipped: number;
  badDate: number;
  ms: number;
  contentType?: string;
  status?: number;
  error?: string;
};

export type RssFetchResult = {
  items: ParsedRssItem[];
  stats_by_source: Record<string, RssFetchStats>;
};

function pickLink(item: any): string | undefined {
  const link =
    (typeof item?.link === "string" && item.link.trim()) ||
    (typeof item?.guid === "string" && item.guid.trim()) ||
    (typeof item?.id === "string" && item.id.trim());

  if (!link) return undefined;
  if (!/^https?:\/\//i.test(link)) return undefined;
  return link;
}

function pickPublishedAt(item: any): { published_at?: string; bad: boolean } {
  const v = item?.isoDate ?? item?.pubDate;

  if (typeof v !== "string") return { published_at: undefined, bad: false };

  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return { published_at: undefined, bad: true };

  return { published_at: d.toISOString(), bad: false };
}

async function fetchFeedXml(
  url: string
): Promise<{ xml: string; contentType?: string; status: number }> {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": "monitoring24/1.0 (+https://monitoring24.info)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    },
    // @ts-ignore
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

export async function fetchRssItems(): Promise<RssFetchResult> {
  const items: ParsedRssItem[] = [];
  const stats_by_source: Record<string, RssFetchStats> = {};

  for (const source of RSS_SOURCES) {
    const started = Date.now();
    let kept = 0;
    let skipped = 0;
    let badDate = 0;

    try {
      const { xml, contentType, status } = await fetchFeedXml(source.url);

      if (status >= 400) {
        stats_by_source[source.id] = {
          total_items: 0,
          kept,
          skipped,
          badDate,
          ms: Date.now() - started,
          contentType,
          status,
          error: `http_${status}`,
        };
        console.error(`[RSS] source=${source.id} status=${status} url=${source.url}`);
        continue;
      }

      if (!looksLikeXml(xml)) {
        stats_by_source[source.id] = {
          total_items: 0,
          kept,
          skipped,
          badDate,
          ms: Date.now() - started,
          contentType,
          status,
          error: "not_xml",
        };
        console.error(
          `[RSS] source=${source.id} not_xml url=${source.url} contentType=${contentType} head=${xml
            .trim()
            .slice(0, 120)}`
        );
        continue;
      }

      const feed = await parser.parseString(xml);
      const total = feed.items?.length ?? 0;

      for (const it of feed.items ?? []) {
        const title = typeof it.title === "string" ? it.title.trim() : "";
        const link = pickLink(it);
        const { published_at, bad } = pickPublishedAt(it);
        if (bad) badDate++;

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
      stats_by_source[source.id] = {
        total_items: total,
        kept,
        skipped,
        badDate,
        ms,
        contentType,
        status,
      };

      console.log(
        `[RSS] source=${source.id} ok total=${total} kept=${kept} skipped=${skipped} badDate=${badDate} ms=${ms} contentType=${contentType}`
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      stats_by_source[source.id] = {
        total_items: 0,
        kept,
        skipped,
        badDate,
        ms: Date.now() - started,
        error: message,
      };
      console.error(`[RSS] source=${source.id} error=${message}`);
    }
  }

  return { items, stats_by_source };
}
