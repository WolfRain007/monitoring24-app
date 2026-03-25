import Link from "next/link";
import { headers } from "next/headers";

type NewsItem = {
  id: string;
  title: string;
  source_name: string | null;
  published_at: string | null;
  language: string | null;
  country_code: string | null;
  url: string | null;
  event_id: string | null;
  city_id: string | null;
  content_text: string | null;
};

type NewsResponse = {
  items: NewsItem[];
  total: number;
  limit: number;
  offset: number;
};

type SearchParams = Promise<{
  q?: string;
  language?: string;
  source_name?: string;
  limit?: string;
  offset?: string;
}>;

function buildQuery(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }

  return search.toString();
}

async function fetchNews(params: {
  q?: string;
  language?: string;
  source_name?: string;
  limit: number;
  offset: number;
}): Promise<NewsResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";

    const query = buildQuery({
      q: params.q,
      language: params.language,
      source_name: params.source_name,
      limit: params.limit,
      offset: params.offset,
    });

    const res = await fetch(`${protocol}://${host}/api/news?${query}`, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error("Failed to load news");
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function formatDate(value: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatRange(total: number, offset: number, itemsLength: number) {
  if (total === 0 || itemsLength === 0) return "0";
  const from = offset + 1;
  const to = offset + itemsLength;
  return `${from}–${to}`;
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </div>
    </div>
  );
}

function LanguageBadge({ value }: { value: string | null }) {
  const label = value?.toUpperCase() || "N/A";

  return (
    <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
      {label}
    </span>
  );
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const q = params.q?.trim() || "";
  const language = params.language?.trim() || "";
  const sourceName = params.source_name?.trim() || "";
  const limit = Math.min(Math.max(Number(params.limit || 20), 1), 50);
  const offset = Math.max(Number(params.offset || 0), 0);

  try {
    const response = await fetchNews({
      q: q || undefined,
      language: language || undefined,
      source_name: sourceName || undefined,
      limit,
      offset,
    });

    const items = response.items ?? [];
    const prevOffset = Math.max(offset - limit, 0);
    const nextOffset = offset + limit;
    const hasPrev = offset > 0;
    const hasNext = nextOffset < response.total;

    const prevHref = `/news?${buildQuery({
      q,
      language,
      source_name: sourceName,
      limit,
      offset: prevOffset,
    })}`;

    const nextHref = `/news?${buildQuery({
      q,
      language,
      source_name: sourceName,
      limit,
      offset: nextOffset,
    })}`;

    return (
      <div className="px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-[32px] border border-white/70 bg-white/75 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="border-b border-slate-200/70 px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                  News Intelligence
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Новости и входящие сигналы
                </h1>

                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  Поток исходных материалов из проверенных источников для
                  оперативного мониторинга, анализа и связывания с событиями.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Всего новостей" value={response.total} />
                <StatCard label="На странице" value={items.length} />
                <StatCard
                  label="Диапазон"
                  value={formatRange(response.total, offset, items.length)}
                />
                <StatCard label="Лимит" value={response.limit} />
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <form className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Поиск по заголовку / тексту
                  </label>
                  <input
                    type="text"
                    name="q"
                    defaultValue={q}
                    placeholder="Например: Иран, аэропорт, экономика..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Язык
                  </label>
                  <select
                    name="language"
                    defaultValue={language}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="">Все</option>
                    <option value="ru">RU</option>
                    <option value="en">EN</option>
                    <option value="es">ES</option>
                    <option value="de">DE</option>
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Источник
                  </label>
                  <input
                    type="text"
                    name="source_name"
                    defaultValue={sourceName}
                    placeholder="Reuters, ТАСС..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Лимит
                  </label>
                  <input
                    type="number"
                    name="limit"
                    min={1}
                    max={50}
                    defaultValue={limit}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              <input type="hidden" name="offset" value="0" />

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.15)] transition hover:bg-slate-800"
                >
                  Применить фильтры
                </button>

                <Link
                  href="/news"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Сбросить
                </Link>
              </div>
            </form>
          </div>
        </section>

        <section className="mt-8 space-y-5">
          {items.length === 0 ? (
            <div className="rounded-[30px] border border-white/70 bg-white/85 px-6 py-10 text-center shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <h2 className="text-2xl font-semibold text-slate-950">
                Новости не найдены
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Попробуйте изменить фильтры или уточнить поисковый запрос.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-[30px] border border-white/70 bg-white/85 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur"
              >
                <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="min-w-0">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <LanguageBadge value={item.language} />

                      {item.country_code && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          {item.country_code}
                        </span>
                      )}

                      {item.source_name && (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {item.source_name}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-semibold leading-8 tracking-tight text-slate-950 sm:text-2xl">
                      {item.title}
                    </h2>

                    {item.content_text && (
                      <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">
                        {item.content_text}
                      </p>
                    )}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          Источник
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {item.source_name || "—"}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          Опубликовано
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDate(item.published_at)}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          Язык
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {item.language?.toUpperCase() || "—"}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 px-4 py-3">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          Связь с событием
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900 break-all">
                          {item.event_id || "Не связано"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.15)] transition hover:bg-slate-800"
                        >
                          Открыть оригинал
                        </a>
                      )}

                      {item.event_id && (
                        <Link
                          href={`/events`}
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          Перейти к событиям
                        </Link>
                      )}
                    </div>
                  </div>

                  <aside>
                    <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Технические данные
                      </div>

                      <dl className="mt-4 space-y-4 text-sm">
                        <div>
                          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                            ID новости
                          </dt>
                          <dd className="break-all font-medium text-slate-900">
                            {item.id}
                          </dd>
                        </div>

                        {item.event_id && (
                          <div>
                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                              Event ID
                            </dt>
                            <dd className="break-all font-medium text-slate-900">
                              {item.event_id}
                            </dd>
                          </div>
                        )}

                        {item.city_id && (
                          <div>
                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                              City ID
                            </dt>
                            <dd className="break-all font-medium text-slate-900">
                              {item.city_id}
                            </dd>
                          </div>
                        )}

                        <div>
                          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Страна
                          </dt>
                          <dd className="font-medium text-slate-900">
                            {item.country_code || "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </aside>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="mt-8 rounded-[30px] border border-white/70 bg-white/85 px-6 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-950">
                Показано {formatRange(response.total, offset, items.length)} из{" "}
                {response.total}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Используйте пагинацию для просмотра полной ленты новостей.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {hasPrev ? (
                <Link
                  href={prevHref}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  ← Назад
                </Link>
              ) : (
                <span className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-6 text-sm font-semibold text-slate-400">
                  ← Назад
                </span>
              )}

              {hasNext ? (
                <Link
                  href={nextHref}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.15)] transition hover:bg-slate-800"
                >
                  Вперёд →
                </Link>
              ) : (
                <span className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-200 px-6 text-sm font-semibold text-slate-500">
                  Вперёд →
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  } catch {
    return (
      <div className="px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-[32px] border border-amber-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
            Monitoring24
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Новости временно недоступны
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Не удалось загрузить новостную ленту. Попробуйте обновить страницу
            через несколько секунд.
          </p>

          <div className="mt-6">
            <Link
              href="/news"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white"
            >
              Обновить страницу
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
