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
import { StatusBadge } from "@/components/ui/status-badge";
import { getNewsItems } from "@/lib/data/news";
import { formatDateTime, formatText, shortId } from "@/lib/format";

function getAssignmentTone(value: string | null) {
  if (!value) return "neutral";
  if (value === "assigned") return "success";
  if (value === "no_city_match") return "warning";
  if (value === "rejected") return "danger";
  return "info";
}

export default async function NewsPage() {
  const { items, error } = await getNewsItems();

  const withCity = items.filter((item) => item.cityId).length;
  const withEvent = items.filter((item) => item.eventId).length;
  const assigned = items.filter((item) => item.assignmentStatus === "assigned").length;

  return (
    <AppShell>
      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="News stream"
          title="Поток публикаций"
          description="Реальные записи из news_items: источник, язык, assignment status, наличие city_id / event_id и состояние контентного пайплайна."
          action={<StatusBadge label="Live ingest data" tone="success" />}
        />

        <div className="grid gap-4 px-6 pb-6 pt-2 sm:px-8 lg:grid-cols-4">
          <MetricCard
            label="Публикаций в выборке"
            value={String(items.length)}
            hint="Количество news items в текущем окне."
          />
          <MetricCard
            label="С city_id"
            value={String(withCity)}
            hint="Сколько материалов уже получили географическую привязку."
          />
          <MetricCard
            label="С event_id"
            value={String(withEvent)}
            hint="Сколько материалов уже связаны с событиями."
          />
          <MetricCard
            label="Assigned"
            value={String(assigned)}
            hint="Сколько записей имеют assignment_status = assigned."
          />
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="News items"
          title="Последние публикации"
          description="Следующий шаг — добавить фильтры по source, lang, status, assignment_status, content_status и периоду публикации."
        />

        <div className="px-6 pb-6 sm:px-8">
          {error ? (
            <EmptyState
              eyebrow="Data error"
              title="Не удалось загрузить публикации"
              description={error}
            />
          ) : items.length === 0 ? (
            <EmptyState
              eyebrow="No data"
              title="Публикации не найдены"
              description="Таблица news_items вернула пустой результат."
            />
          ) : (
            <DataTable
              columns={[
                { key: "title", label: "Публикация" },
                { key: "source", label: "Источник" },
                { key: "lang", label: "Lang" },
                { key: "assignment", label: "Assignment" },
                { key: "links", label: "Связи" },
                { key: "pipeline", label: "Pipeline" },
                { key: "published", label: "Published" },
              ]}
            >
              {items.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell>
                    <div className="font-medium text-slate-900">
                      {formatText(item.title)}
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-500">
                      {shortId(item.id)}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      category: {item.categoryKey}
                    </div>
                  </DataTableCell>

                  <DataTableCell>
                    <div className="text-sm font-medium text-slate-800">
                      {item.source}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      source_id: {item.sourceId}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      country: {item.countryCode ?? "—"}
                    </div>
                  </DataTableCell>

                  <DataTableCell>{item.lang}</DataTableCell>

                  <DataTableCell>
                    <StatusBadge
                      label={item.assignmentStatus ?? "unknown"}
                      tone={getAssignmentTone(item.assignmentStatus)}
                    />
                    <div className="mt-2 text-xs text-slate-500">
                      confidence: {item.assignmentConfidence ?? "—"}
                    </div>
                  </DataTableCell>

                  <DataTableCell>
                    <div className="text-sm text-slate-800">
                      city: {item.cityId ? shortId(item.cityId) : "—"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      event: {item.eventId ? shortId(item.eventId) : "—"}
                    </div>
                  </DataTableCell>

                  <DataTableCell>
                    <div className="text-sm text-slate-800">
                      status: {item.status}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      content: {item.contentStatus}
                    </div>
                  </DataTableCell>

                  <DataTableCell>
                    <div className="text-sm text-slate-800">
                      {formatDateTime(item.publishedAt)}
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
