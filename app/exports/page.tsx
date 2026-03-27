import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default function ExportsPage() {
  return (
    <AppShell>
      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Exports"
          title="Экспорт и клиентские выгрузки"
          description="Monitoring24 должен уметь превращать события и аналитические витрины в материалы для клиента: CSV, PDF, краткие отчёты и операционные сводки."
          action={<StatusBadge label="Client-ready" tone="success" />}
        />

        <div className="grid gap-4 px-6 pb-6 pt-2 sm:px-8 lg:grid-cols-4">
          <MetricCard
            label="Формат"
            value="CSV / PDF"
            hint="Базовые экспортные форматы уже определены."
          />
          <MetricCard
            label="Источник"
            value="Events"
            hint="Основой выгрузки должны стать события и их агрегированные метрики."
          />
          <MetricCard
            label="Сценарий"
            value="Reporting"
            hint="Внутренние и клиентские отчёты в одном потоке."
          />
          <MetricCard
            label="Цель"
            value="Actionable"
            hint="Материалы должны быть удобны для реального использования."
          />
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Delivery layer"
          title="Что появится здесь"
          description="Здесь логично разместить сценарии экспорта по событиям, регионам, темам и временным диапазонам."
        />

        <div className="px-6 pb-6 sm:px-8">
          <EmptyState
            eyebrow="Export backlog"
            title="Экспорт пока не подключён"
            description="Следующим шагом сюда можно добавить кнопки формирования CSV/PDF и историю экспортных задач."
          />
        </div>
      </Panel>
    </AppShell>
  );
}
