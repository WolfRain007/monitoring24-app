import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AnalyticsPage() {
  return (
    <AppShell>
      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Analytics"
          title="Аналитический и прогнозный слой"
          description="Этот раздел должен отвечать на главный вопрос Monitoring24: как события влияют на экономику, инфраструктуру, миграцию, общество, маршруты, питание, рынки и повседневную жизнь."
          action={<StatusBadge label="Beta" tone="warning" />}
        />

        <div className="grid gap-4 px-6 pb-6 pt-2 sm:px-8 lg:grid-cols-4">
          <MetricCard
            label="Фокус"
            value="Impact"
            hint="Не только факт события, но и вектор его последствий."
          />
          <MetricCard
            label="Модель"
            value="Cross-domain"
            hint="Одна тема может влиять на несколько жизненных направлений."
          />
          <MetricCard
            label="Выход"
            value="Insights"
            hint="Клиент должен получать не поток ссылок, а выводы и сигналы."
          />
          <MetricCard
            label="Формат"
            value="Dashboards"
            hint="Витрины, индикаторы, отчёты и прогнозные блоки."
          />
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Future layer"
          title="Что стоит реализовать здесь"
          description="Здесь будут аналитические карточки влияния, индекс плотности сигналов, оценка последствий по доменам и экспорт клиентских обзоров."
        />

        <div className="px-6 pb-6 sm:px-8">
          <EmptyState
            eyebrow="Analysis backlog"
            title="Аналитические витрины пока не подключены"
            description="Следующим шагом сюда можно добавить impact score, доменные теги влияния, риск-матрицы и клиентские отчётные блоки."
          />
        </div>
      </Panel>
    </AppShell>
  );
}
