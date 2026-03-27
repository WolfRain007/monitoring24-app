import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default function SourcesPage() {
  return (
    <AppShell>
      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Sources"
          title="Источники данных"
          description="Этот раздел должен показывать конфигурацию RSS-источников, состояние обновления, частоту fetch-процессов и качество поступающих данных."
          action={<StatusBadge label="Operational layer" tone="neutral" />}
        />

        <div className="grid gap-4 px-6 pb-6 pt-2 sm:px-8 lg:grid-cols-4">
          <MetricCard
            label="Стратегия"
            value="Verified feeds"
            hint="Платформа строится вокруг проверенных публичных источников."
          />
          <MetricCard
            label="Приоритет"
            value="RSS-first"
            hint="Архитектура больше не зависит от Telegram."
          />
          <MetricCard
            label="Контроль"
            value="Health"
            hint="Важно видеть частоту обновления и сбои по каждому источнику."
          />
          <MetricCard
            label="Назначение"
            value="Input quality"
            hint="Качество источников прямо влияет на качество событий."
          />
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Source registry"
          title="Что может быть здесь"
          description="Таблица источников, last fetch, success/error rate, язык, страна, активность и статус участия в ingest pipeline."
        />

        <div className="px-6 pb-6 sm:px-8">
          <EmptyState
            eyebrow="Registry backlog"
            title="Реестр источников пока не подключён"
            description="Следующим шагом можно вывести список feeds и диагностику ingest/fetch-процессов прямо в интерфейсе."
          />
        </div>
      </Panel>
    </AppShell>
  );
}
