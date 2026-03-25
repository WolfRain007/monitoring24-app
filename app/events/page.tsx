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
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "resolved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "monitoring":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
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
      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.10),_transparent_28%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff)] text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
          <section className="overflow-hidden rounded-[32px] border border-white/60 bg-white/80 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="border-b border-slate-200/80 px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                    Monitoring24 · Events Intelligence
                  </div>

                  <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    События
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                    Профессиональная витрина агрегированных событий: мониторинг,
                    аналитика, оперативная динамика и ключевые параметры по
                    каждой записи.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Всего событий
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-950">
                      {response.total}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      На странице
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-950">
                      {events.length}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Диапазон
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-950">
                      {formatRange(response.total, offset, events.length)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Лимит
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-950">
                      {response.limit}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <form className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-5">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Поиск по названию
                    </label>
                    <input
                      type="text"
                      name="q"
                      defaultValue={q}
                      placeholder="Например: Иран, аэропорт, снегопад..."
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Лимит
                    </label>
                    <input
                      type="number"
                      name="limit"
                      min={1}
                      max={50}
                      defaultValue={limit}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                </div>

                <input type="hidden" name="offset" value="0" />

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Применить фильтры
                  </button>

                  <Link
                    href={resetHref}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Сбросить
                  </Link>
                </div>
              </form>
            </div>
          </section>

          <section className="mt-8 space-y-5">
            {events.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">
                  События не найдены
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Попробуйте изменить параметры поиска или сбросить фильтры.
                </p>
              </div>
            ) : (
              events.map((event) => (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_15px_50px_rgba(15,23,42,0.06)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_55px_rgba(15,23,42,0.09)]"
                >
                  <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(
                            event.status
                          )}`}
                        >
                          {getStatusLabel(event.status)}
                        </span>

                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                          {getEventFamilyLabel(event.event_family_key)}
                        </span>

                        {event.country_code && (
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
                            {event.country_code}
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl font-semibold leading-8 tracking-tight text-slate-950">
                        {event.title}
                      </h2>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            Статус
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {getStatusLabel(event.status)}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            Начало
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {formatDate(event.started_at)}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            Последняя активность
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {formatDate(event.last_seen_at)}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            Связанных новостей
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {event.real_news_count}
                          </div>
                        </div>
                      </div>
                    </div>

                    <aside className="w-full lg:w-[290px]">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Технические данные
                        </div>

                        <dl className="mt-4 space-y-3 text-sm">
                          <div className="grid grid-cols-[110px_1fr] gap-3">
                            <dt className="text-slate-500">ID события</dt>
                            <dd className="break-all font-medium text-slate-900">
                              {event.id}
                            </dd>
                          </div>

                          {event.city_id && (
                            <div className="grid grid-cols-[110px_1fr] gap-3">
                              <dt className="text-slate-500">City ID</dt>
                              <dd className="break-all font-medium text-slate-900">
                                {event.city_id}
                              </dd>
                            </div>
                          )}

                          {event.country_code && (
                            <div className="grid grid-cols-[110px_1fr] gap-3">
                              <dt className="text-slate-500">Страна</dt>
                              <dd className="font-medium text-slate-900">
                                {event.country_code}
                              </dd>
                            </div>
                          )}

                          <div className="grid grid-cols-[110px_1fr] gap-3">
                            <dt className="text-slate-500">Тип</dt>
                            <dd className="font-medium text-slate-900">
                              {getEventFamilyLabel(event.event_family_key)}
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

          <section className="mt-8 flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 px-6 py-5 shadow-[0_15px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900">
                Показано {formatRange(response.total, offset, events.length)} из{" "}
                {response.total}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Используйте фильтры и
