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

async function fetchEvents(): Promise<EventsResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 8000);

  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";

    const res = await fetch(`${protocol}://${host}/api/events?limit=20`, {
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
  switch (status) {
    case "active":
      return "Активно";
    case "resolved":
      return "Завершено";
    case "monitoring":
      return "Мониторинг";
    default:
      return status || "Не указан";
  }
}

function getStatusClasses(status: string | null) {
  switch (status) {
    case "active":
      return "bg-red-50 text-red-700 ring-red-200";
    case "resolved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "monitoring":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

function formatEventFamily(value: string | null) {
  if (!value) return "—";
  return value.replaceAll("_", " ");
}

export default async function EventsPage() {
  try {
    const response = await fetchEvents();
    const events = response.items ?? [];

    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">
              Monitoring24
            </p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  События
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
                  Оперативная лента агрегированных событий с ключевыми
                  параметрами, статусом и количеством связанных новостей.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Всего
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {response.total}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    На странице
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {events.length}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm col-span-2 sm:col-span-1">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Лимит
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {response.limit}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto max-w-md">
                <h2 className="text-xl font-semibold text-slate-900">
                  События пока не найдены
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  В базе пока нет записей, подходящих под текущую выборку.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(
                            event.status
                          )}`}
                        >
                          {getStatusLabel(event.status)}
                        </span>

                        {event.event_family_key && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
                            {formatEventFamily(event.event_family_key)}
                          </span>
                        )}

                        {event.country_code && (
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
                            {event.country_code}
                          </span>
                        )}
                      </div>

                      <h2 className="text-lg font-semibold leading-7 text-slate-900 sm:text-xl">
                        {event.title}
                      </h2>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-xs uppercase tracking-wide text-slate-500">
                            Статус
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-900">
                            {getStatusLabel(event.status)}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-xs uppercase tracking-wide text-slate-500">
                            Начало
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-900">
                            {formatDate(event.started_at)}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-xs uppercase tracking-wide text-slate-500">
                            Последняя активность
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-900">
                            {formatDate(event.last_seen_at)}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-xs uppercase tracking-wide text-slate-500">
                            Связанных новостей
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {event.real_news_count}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:ml-6 lg:w-64">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-500">
                          Технические данные
                        </div>

                        <dl className="mt-3 space-y-3 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <dt className="text-slate-500">ID события</dt>
                            <dd className="max-w-[150px] break-all text-right font-medium text-slate-900">
                              {event.id}
                            </dd>
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <dt className="text-slate-500">City ID</dt>
                            <dd className="max-w-[150px] break-all text-right font-medium text-slate-900">
                              {event.city_id || "—"}
                            </dd>
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <dt className="text-slate-500">Тип события</dt>
                            <dd className="max-w-[150px] text
