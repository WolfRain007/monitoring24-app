import { AppShell } from "@/components/layout/app-shell";
import {
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/ui/status-badge";
import { getEvents } from "@/lib/data/events";
import {
  formatDateTime,
  formatScore,
  formatText,
  shortId,
} from "@/lib/format";

function getStatusTone(status: string | null): StatusBadgeTone {
  if (!status) return "neutral";
  if (status === "active") return "success";
  if (status === "draft") return "warning";
  if (status === "closed") return "neutral";
  return "info";
}

function MetricPill({
  label,
  value,
  accent = "sky",
}: {
  label: string;
  value: string;
  accent?: "sky" | "violet" | "emerald" | "amber";
}) {
  const accentMap = {
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-full border border-white/70 bg-white/80 px-4 py-3 shadow-[0_8px_30px_-16px_rgba(15,23,42,0.22)] backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div
        className={`mt-1 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${accentMap[accent]}`}
      >
        {value}
      </div>
    </div>
  );
}

function ScoreChip({
  label,
  value,
  tone = "sky",
}: {
  label: string;
  value: string;
  tone?: "sky" | "violet" | "emerald";
}) {
  const toneMap = {
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <div className={`rounded-2xl border px-3 py-2 ${toneMap[tone]}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

export default async function EventsPage() {
  const { items, error } = await getEvents();

  const eventsWithCity = items.filter((item) => item.cityId).length;
  const totalNews = items.reduce((sum, item) => sum + item.newsCount, 0);
  const totalSources = items.reduce((sum, item) => sum + item.sourceCount, 0);

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.24),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(196,181,253,0.22),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.82))] p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.22)] backdrop-blur sm:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.24),transparent_18%,transparent_82%,rgba(255,255,255,0.18))]" />

          <div className="relative">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                  Events intelligence
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Рабочая витрина событий
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                  Живой слой Monitoring24: сигналы, агрегированные события,
                  статус назначения, плотность публикаций и аналитические оценки
                  влияния.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge label="Live data" tone="success" />
                  <StatusBadge label="City-based assignment" tone="info" />
                  <StatusBadge label="Risk workspace" tone="neutral" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
                <MetricPill
                  label="Событий в выборке"
                  value={String(items.length)}
                  accent="sky"
                />
                <MetricPill
                  label="С геопривязкой"
                  value={String(eventsWithCity)}
                  accent="emerald"
                />
                <MetricPill
                  label="Связанных публикаций"
                  value={String(totalNews)}
                  accent="violet"
                />
                <MetricPill
                  label="Источников"
                  value={String(totalSources)}
                  accent="amber"
                />
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-[28px] border border-rose-200 bg-white/80 p-6 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.16)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-600">
              Data error
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              Не удалось загрузить события
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{error}</p>
          </section>
        ) : items.length === 0 ? (
          <section className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.16)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              No data
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              События не найдены
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Таблица events вернула пустой результат.
            </p>
          </section>
        ) : (
          <section className="space-y-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Event registry
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Последние события
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                Карточная витрина в логике intelligence workspace. На следующем
                шаге добавим фильтры, состояние пайплайна и переход в карточку
                события.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.88))] p-5 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_-24px_rgba(15,23,42,0.28)]"
                >
                  <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_52%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_46%)]" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {item.categoryKey}
                        </div>

                        <h3 className="mt-2 text-xl font-semibold leading-tight tracking-tight text-slate-950">
                          {item.title}
                        </h3>

                        <div className="mt-2 font-mono text-xs text-slate-400">
                          {shortId(item.id)}
                        </div>
                      </div>

                      <StatusBadge
                        label={item.status ?? "unknown"}
                        tone={getStatusTone(item.status)}
                      />
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {formatText(item.description)}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
                        city: {item.cityId ? shortId(item.cityId) : "—"}
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
                        country: {item.countryCode ?? "—"}
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
                        news: {item.newsCount}
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
                        sources: {item.sourceCount}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <ScoreChip
                        label="Importance"
                        value={formatScore(item.importanceScore)}
                        tone="sky"
                      />
                      <ScoreChip
                        label="Severity"
                        value={formatScore(item.severityScore)}
                        tone="violet"
                      />
                      <ScoreChip
                        label="Confidence"
                        value={formatScore(item.confidenceScore)}
                        tone="emerald"
                      />
                    </div>

                    <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Last seen
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-800">
                          {formatDateTime(item.lastSeenAt)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Created
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-800">
                          {formatDateTime(item.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
