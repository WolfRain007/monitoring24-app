import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DataTable,
  DataTableCell,
  DataTableRow,
} from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
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

export default async function EventsPage() {
  const { items, error } = await getEvents();

  const eventsWithCity = items.filter((item) => item.cityId).length;
  const totalNews = items.reduce((sum, item) => sum + item.newsCount, 0);
  const totalSources = items.reduce((sum, item) => sum + item.sourceCount, 0);

  return (
    <AppShell>
      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Events"
          title="Рабочая витрина событий"
          description="Реальные события из таблицы events: заголовок, категория, статус, плотность новостей, источники и аналитические scores."
          action={<StatusBadge label="Live data" tone="success" />}
        />

        <div className="grid gap-4 px-6 pb-6 pt-2 sm:px-8 lg:grid-cols-4">
          <MetricCard
            label="Событий в выборке"
            value={String(items.length)}
            hint="Текущий объём событий, выведенных из базы."
          />
          <MetricCard
            label="С геопривязкой"
            value={String(eventsWithCity)}
            hint="Сколько событий уже имеют city_id."
          />
          <MetricCard
            label="Связанных публикаций"
            value={String(totalNews)}
            hint="Сумма news_count по текущей выборке."
          />
          <MetricCard
            label="Источников"
            value={String(totalSources)}
            hint="Суммарный source_count в текущем окне."
          />
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Event registry"
          title="Последние события"
          description="Следом можно добавить фильтры по category_key, country_code, status, score и периоду активности."
        />

        <div className="px-6 pb-6 sm:px-8">
          {error ? (
            <EmptyState
              eyebrow="Data error"
              title="Не удалось загрузить события"
              description={error}
            />
          ) : items.length === 0 ? (
            <EmptyState
              eyebrow="No data"
              title="События не найдены"
              description="Таблица events вернула пустой результат."
            />
          ) : (
            <DataTable
              columns={[
                { key: "title", label: "Событие" },
                { key: "category", label: "Категория" },
                { key: "status", label: "Статус" },
                { key: "geo", label: "Гео" },
                { key: "counts", label: "Плотность" },
                { key: "scores", label: "Scores" },
                { key: "lastSeen", label: "Last seen" },
              ]}
            >
              {items.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell>
                    <div className="font-medium text-slate-900">
                      {item.title}
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-500">
                      {shortId(item.id)}
                    </div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">
                      {formatText(item.description)}
                    </div>
                  </DataTableCell>

                  <DataTableCell>
                    <div className="text-sm font-medium text-slate-800">
                      {item.categoryKey}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      country: {item.countryCode ?? "—"}
                    </div>
                  </DataTableCell>

                  <DataTableCell>
                    <StatusBadge
                      label={item.status ?? "unknown"}
                      tone={getStatusTone(item.status)}
                    />
                  </DataTableCell>

                  <DataTableCell>
                    <div className="text-sm text-slate-800">
                      city: {item.cityId ? shortId(item.cityId) : "—"}
                    </div>
                  </DataTableCell>

                  <DataTableCell>
                    <div className="text-sm text-slate-800">
                      news: {item.newsCount}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      sources: {item.sourceCount}
                    </div>
                  </DataTableCell>

                  <DataTableCell>
                    <div className="text-sm text-slate-800">
                      importance: {formatScore(item.importanceScore)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      severity: {formatScore(item.severityScore)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      confidence: {formatScore(item.confidenceScore)}
                    </div>
                  </DataTableCell>

                  <DataTableCell>
                    <div className="text-sm text-slate-800">
                      {formatDateTime(item.lastSeenAt)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      created: {formatDateTime(item.createdAt)}
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTable>
          )}
        </div>
      </Panel>
    </AppShell>
  );
}
