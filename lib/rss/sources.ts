export type RssSource = {
  id: string;
  title: string;
  url: string;
  language?: string;
};

export const RSS_SOURCES: RssSource[] = [
  {
    id: "tass",
    title: "ТАСС",
    url: "https://tass.ru/rss/v2.xml",
    language: "ru",
  },
  {
    id: "ria",
    title: "РИА Новости",
    url: "https://ria.ru/export/rss2/archive/index.xml",
    language: "ru",
  },
  {
    id: "euronews",
    title: "Euronews",
    url: "https://www.euronews.com/rss",
    language: "en",
  },
];
