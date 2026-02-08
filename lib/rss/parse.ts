import Parser from "rss-parser";
import { RSS_SOURCES } from "./sources";

const parser = new Parser();

export type ParsedRssItem = {
  title: string;
  link: string;
  published_at?: string;
  source_id: string;
  source_title: string;
};

export async function fetchRssItems(): Promise<ParsedRssItem[]> {
  const items: ParsedRssItem[] = [];

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);

      for (const item of feed.items) {
        if (!item.link || !item.title) continue;

        items.push({
          title: item.title,
          link: item.link,
          published_at:
            item.isoDate ?? item.pubDate ?? undefined,
          source_id: source.id,
          source_title: source.title,
        });
      }
    } catch (e) {
      console.error(`RSS error: ${source.id}`, e);
    }
  }

  return items;
}
