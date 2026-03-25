import Link from "next/link";
import { headers } from "next/headers";

type EventItem = {
  id: string;
  title: string;
  status: string | null;
  started_at: string | null;
  last_seen_at: string | null;
  event_family_key: string | null;
  city_id: string | null;
  country_code: string | null;
  real_news_count: number;
};

type EventsResponse = {
  items: EventItem[];
  total: number;
  limit: number;
  offset: number;
};

type SearchParams = Promise<{
  q?: string;
  status?: string;
  event_family_key?: string;
  limit?: string;
  offset?: string;
}>;

const EVENT_FAMILY_LABELS: Record<string, string> = {
  military_attack: "Военное столкновение",
  flight_disruption: "Сбои авиасообщения",
  violent_incident: "Опасный инцидент",
  road_accident: "Дорожное происшествие",
  weather_alert: "Погодное предупреждение",
  infrastructure_damage: "Повреждение инфраструктуры",
  power_outage: "Отключение энергии",
  wildfire: "Природный пожар",
  flood: "Наводнение",
  earthquake: "Землетрясение",
  explosion: "Взрыв",
  protest: "Протест",
  evacuation: "Эвакуация",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Активно",
  resolved: "Завершено",
  monitoring: "Мониторинг",
};

function buildQuery(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }

  return search.toString();
}

async function fetchEvents(params: {
  q?: string;
  status?: string;
  event_family_key?: string;
  limit: number;
  offset: number;
}): Promise<EventsResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";

    const query = buildQuery({
      q: params.q,
      status: params.status,
      event_family_key: params.event_family_key,
      limit: params.limit,
      offset: params.offset,
    });

    const res = await fetch(`${protocol}://${host}/api/events?${query}`, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error("Failed to load events");
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

function getStatusLabel(status: string | null) {
  if (!status) return "Не указан";
  return STATUS_LABELS[status] || status;
}

function getStatusClasses(status: string | null) {
  switch (status) {
    case "active":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "resolved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "monitoring":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getEventFamilyLabel(value: string | null) {
  if (!value) return "Без типа";
  return EVENT_FAMILY_LABELS[value] || value.replaceAll("_", " ");
}

function formatRange(total: number, offset: number, itemsLength: number) {
  if (total === 0 || itemsLength === 0) return "0";
  const from = offset + 1;
  const to = offset + itemsLength;
  return `${from}–${to}`;
}

function FilterSelect({
  name,
  value,
  options,
}: {
  name: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      name={name}
      defaultValue={value || ""}
      className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
    >
      <option value="">Все</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-base font-semibold text-slate-950">{value}</div>
    </div>
  );
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const q = params.q?.trim() || "";
  const status = params.status?.trim() || "";
  const eventFamilyKey = params.event_family_key?.trim() || "";
  const limit = Math.min(Math.max(Number(params.limit || 20), 1), 50);
  const offset = Math.max(Number(params.offset || 0), 0);

  try {
    const response = await fetchEvents({
      q: q || undefined,
      status: status || undefined,
      event_family_key: eventFamilyKey || undefined,
      limit,
      offset,
    });

    const events = response.items ?? [];
    const prevOffset = Math.max(offset - limit, 0);
    const nextOffset = offset + limit;
    const hasPrev = offset > 0;
    const hasNext = nextOffset < response.total;

    const prevHref = `/events?${buildQuery({
      q,
      status,
      event_family_key: eventFamilyKey,
      limit,
      offset: prevOffset,
    })}`;

    const nextHref = `/events?${buildQuery({
      q,
      status,
      event_family_key: eventFamilyKey,
      limit,
      offset: nextOffset,
    })}`;

    const resetHref = "/events";

    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.10),_transparent_26%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_48%,_#f8fafc_100%)] text-slate-900">
        <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10 lg:py-10">
          <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/75 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.08),_transparent_30%)]" />

            <div className="relative border-b border-slate-200/70 px-6 py-8 sm:px-8 lg:px-10">
              <div className="grid gap-8 xl:grid-cols-[1.35fr_0.85fr] xl:items-end">
                <div className="max-w-4xl">
                  <div className="inline-flex items-center rounded-full border border-sky-200/80 bg-sky-50/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
                    Monitoring24 · Events Intelligence
                  </div>

                  <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    Профессиональный
                    <span className="bg-gradient-to-r from-slate-950 via-sky-800 to-indigo-800 bg-clip-text text-transparent">
                      {" "}
                      мониторинг событий
                    </span>
                  </h1>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                    Единая аналитическая витрина для мониторинга ключевых
                    событий, оценки динамики, работы с фильтрами и быстрого
                    перехода к детальному анализу источников и последствий.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
                  <StatCard label="Всего событий" value={response.total} />
                  <StatCard label="На странице" value={events.length} />
                  <StatCard
                    label="Диапазон"
                    value={formatRange(response.total, offset, events.length)}
                  />
                  <StatCard label="Лимит" value={response.limit} />
                </div>
              </div>
            </div>

            <div className="relative px-6 py-6 sm:px-8 lg:px-10">
              <form className="rounded-[28px] border border-slate-200/70 bg-white/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      Фильтры и навигация
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Настрой параметры выборки для быстрого анализа ленты.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-5">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Поиск по названию
                    </label>
                    <input
                      type="text"
                      name="q"
                      defaultValue={q}
                      placeholder="Например: Иран, аэропорт, снегопад..."
                      className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Статус
                    </label>
                    <FilterSelect
                      name="status"
                      value={status}
                      options={[
                        { value: "active", label: "Активно" },
                        { value: "monitoring", label: "Мониторинг" },
                        { value: "resolved", label: "Завершено" },
                      ]}
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Тип события
                    </label>
                    <FilterSelect
                      name="event_family_key"
                      value={eventFamilyKey}
                      options={Object.entries(EVENT_FAMILY_LABELS).map(
                        ([value, label]) => ({
                          value,
                          label,
                        })
                      )}
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
                      className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                </div>

                <input type="hidden" name="offset" value="0" />

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)] transition hover:bg-slate-800"
                  >
                    Применить фильтры
                  </button>

                  <Link
                    href={resetHref}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Сбросить
                  </Link>
                </div>
              </form>
            </div>
          </section>

          <section className="mt-8 space-y-6">
            {events.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-sm backdrop-blur">
                <h2 className="text-2xl font-semibold text-slate-950">
                  События не найдены
                </h2>
                <p className="mt-3 text-sm text-slate-600">
                  Попробуйте изменить параметры фильтрации или сбросить текущие
                  ограничения выборки.
                </p>
              </div>
            ) : (
              events.map((event) => (
                <article
                  key={event.id}
                  className="group relative overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_72px_rgba(15,23,42,0.12)]"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent" />

                  <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-7 lg:py-7">
                    <div className="min-w-0">
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            event.status
                          )}`}
                        >
                          {getStatusLabel(event.status)}
                        </span>

                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          {getEventFamilyLabel(event.event_family_key)}
                        </span>

                        {event.country_code && (
                          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                            {event.country_code}
                          </span>
                        )}
                      </div>

                      <h2 className="max-w-4xl text-[22px] font-semibold leading-8 tracking-tight text-slate-950 sm:text-2xl">
                        {event.title}
                      </h2>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricTile
                          label="Статус"
                          value={getStatusLabel(event.status)}
                        />
                        <MetricTile
                          label="Начало"
                          value={formatDate(event.started_at)}
                        />
                        <MetricTile
                          label="Последняя активность"
                          value={formatDate(event.last_seen_at)}
                        />
                        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50 px-4 py-3">
                          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                            Связанных новостей
                          </div>
                          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                            {event.real_news_count}
                          </div>
                        </div>
                      </div>
                    </div>

                    <aside className="w-full">
                      <div className="h-full rounded-[28px] border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Технические данные
                          </div>
                          <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            Event
                          </div>
                        </div>

                        <dl className="mt-5 space-y-4 text-sm">
                          <div>
                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                              ID события
                            </dt>
                            <dd className="break-all font-medium leading-6 text-slate-900">
                              {event.id}
                            </dd>
                          </div>

                          {event.city_id && (
                            <div>
                              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                                City ID
                              </dt>
                              <dd className="break-all font-medium leading-6 text-slate-900">
                                {event.city_id}
                              </dd>
                            </div>
                          )}

                          <div>
                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                              Тип события
                            </dt>
                            <dd className="font-medium text-slate-900">
                              {getEventFamilyLabel(event.event_family_key)}
                            </dd>
                          </div>

                          {event.country_code && (
                            <div>
                              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                                Страна
                              </dt>
                              <dd className="font-medium text-slate-900">
                                {event.country_code}
                              </dd>
                            </div>
                          )}

                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                              Класс события
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-950">
                              Operational Monitoring
                            </div>
                          </div>
                        </dl>
                      </div>
                    </aside>
                  </div>
                </article>
              ))
            )}
          </section>

          <section className="mt-8 rounded-[32px] border border-white/70 bg-white/85 px-6 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-950">
                  Показано {formatRange(response.total, offset, events.length)}{" "}
                  из {response.total}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Используйте фильтры и пагинацию для детального просмотра
                  полной выборки событий.
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
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)] transition hover:bg-slate-800"
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
      </main>
    );
  } catch {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_48%,_#f8fafc_100%)] text-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
          <div className="rounded-[36px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
            <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
              Monitoring24
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              События временно недоступны
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Не удалось загрузить текущую ленту событий. Повторите попытку
              через несколько секунд или вернитесь позже.
            </p>

            <div className="mt-6">
              <Link
                href="/events"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)] transition hover:bg-slate-800"
              >
                Обновить страницу
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
