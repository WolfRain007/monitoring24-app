import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default function MapPage() {
  return (
    <AppShell>
      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Map"
          title="Географическая витрина событий"
          description="Карта должна показывать не просто точки, а связанные события, плотность информационного потока и возможные зоны нарастающего влияния."
          action={<StatusBadge label="City-based" tone="info" />}
        />

        <div className="grid gap-4 px-6 pb-6 pt-2 sm:px-8 lg:grid-cols-4">
          <MetricCard
            label="Единица"
            value="City"
            hint="События привязываются только к городам как к точкам."
          />
          <MetricCard
            label="Визуализация"
            value="Signals"
            hint="На карте будут плотность, приоритет и динамика событий."
          />
          <MetricCard
            label="Основа"
            value="Event links"
            hint="Точка должна вести в карточку события и список публикаций."
          />
          <MetricCard
            label="Цель"
            value="Clarity"
            hint="Быстрое визуальное понимание глобальной картины."
          />
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Geospatial layer"
          title="Что нужно подключить"
          description="Сначала мы можем сделать статический контейнер карты, затем подключить точки городов, кластеры, popups и переходы к событиям."
        />

        <div className="px-6 pb-6 sm:px-8">
          <EmptyState
            eyebrow="Map backlog"
            title="Карта пока не подключена"
            description="Следующий шаг — выбрать стек карты, подать city coordinates, event density и построить первый интерактивный слой Monitoring24."
          />
        </div>
      </Panel>
    </AppShell>
  );
}
