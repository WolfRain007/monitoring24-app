import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default function NewsPage() {
  return (
    <AppShell>
      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="News stream"
          title="Поток публикаций"
          description="Здесь будет живая лента news items: источник, заголовок, язык, дата, связь с событием, статус геопривязки и дальнейший путь в аналитический pipeline."
          action={<StatusBadge label="Ingest layer" tone="success" />}
        />

        <div className="grid gap-4 px-6 pb-6 pt-2 sm:px-8 lg:grid-cols-4">
          <MetricCard
            label="Источник"
            value="RSS"
            hint="Основной поток данных строится на RSS и публичных проверенных источниках."
          />
          <MetricCard
            label="Статус"
            value="Ingest-first"
            hint="Публикации сначала попадают в поток, затем связываются с событиями."
          />
          <MetricCard
            label="Поля"
            value="Title / Body"
            hint="Для city resolution нужно использовать не только title, но и description/content."
          />
          <MetricCard
            label="Роль"
            value="Foundation"
            hint="Это базовый слой для последующей event-агрегации."
          />
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Queue"
          title="Что появится здесь"
          description="Мы можем построить news table с фильтрами по источнику, языку, привязке к городу, наличию event_id и времени публикации."
        />

        <div className="px-6 pb-6 sm:px-8">
          <EmptyState
            eyebrow="Pipeline"
            title="Лента публикаций пока не подключена"
            description="Следующий шаг — вывести реальные записи news_items из базы, показать, какие записи не получили city_id / event_id, и сделать видимой работу pipeline."
          />
        </div>
      </Panel>
    </AppShell>
  );
}
