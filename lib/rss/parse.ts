// lib/rss/parse.ts
import Parser from "rss-parser";
import { RSS_SOURCES } from "./sources";
import { htmlToText } from "html-to-text";

const parser = new Parser({
  headers: {
    "User-Agent": "monitoring24/1.0 (+https://monitoring24.info)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  },
});

export type ParsedRssItem = {
  title: string;
  link: string;
  published_at?: string; // ISO string
  source_id: string;
  source_title: string;
  lang: "ru" | "en";

  categories?: string[];

  // NEW
  content_html?: string;
  content_text?: string;
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

function normalizeCategory(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function pickCategories(item: any): string[] | undefined {
  const out: string[] = [];

  const pushStr = (v: unknown) => {
    if (typeof v !== "string") return;
    const s = normalizeCategory(v);
    if (!s) return;
    out.push(s);
  };

  if (Array.isArray(item?.categories)) {
    for (const c of item.categories) pushStr(c);
  }

  pushStr(item?.category);

  const maybeArr = item?.category;
  if (Array.isArray(maybeArr)) {
    for (const c of maybeArr) {
      if (typeof c === "string") pushStr(c);
      else if (c && typeof c === "object") {
        pushStr((c as any).term);
        pushStr((c as any).name);
        pushStr((c as any).label);
      }
    }
  } else if (maybeArr && typeof maybeArr === "object") {
    pushStr((maybeArr as any).term);
    pushStr((maybeArr as any).name);
    pushStr((maybeArr as any).label);
  }

  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const c of out) {
    const key = c.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(c);
  }

  return deduped.length ? deduped : undefined;
}

function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function pickContentHtml(item: any): string | undefined {
  // rss-parser/фиды могут класть:
  // - content:encoded
  // - content
  // - summary
  // - description
  const raw =
    (typeof item?.["content:encoded"] === "string" && item["content:encoded"]) ||
    (typeof item?.content === "string" && item.content) ||
    (typeof item?.summary === "string" && item.summary) ||
    (typeof item?.description === "string" && item.description);

  if (!raw) return undefined;

  const s = String(raw).trim();
  if (!s) return undefined;

  // ограничим размер (на всякий)
  return s.length > 200_000 ? s.slice(0, 200_000) : s;
}

function pickContentText(item: any): string | undefined {
  // если парсер дал краткий plain-текст
  const snippet = typeof item?.contentSnippet === "string" ? item.contentSnippet.trim() : "";
  if (snippet) return normalizeSpaces(snippet);

  const html = pickContentHtml(item);
  if (!html) return undefined;

  const text = htmlToText(html, {
    wordwrap: false,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
    ],
  });

  const norm = normalizeSpaces(text);
  return norm || undefined;
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
        const categories = pickCategories(it);

        const content_html = pickContentHtml(it);
        const content_text = pickContentText(it);

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
          categories,
          content_html,
          content_text,
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
