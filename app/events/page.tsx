import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default function EventsPage() {
  return (
    <AppShell>
      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Events"
          title="Рабочая витрина событий"
          description="Здесь будет основной слой Monitoring24: агрегированные события, связанные публикации, плотность сигналов, статус привязки к городам и аналитическая приоритизация."
          action={<StatusBadge label="Core module" tone="info" />}
        />

        <div className="grid gap-4 px-6 pb-6 pt-2 sm:px-8 lg:grid-cols-4">
          <MetricCard
            label="Главная сущность"
            value="Event"
            hint="Много публикаций объединяются в одно наблюдаемое событие."
          />
          <MetricCard
            label="Геопривязка"
            value="City-first"
            hint="События привязываются к городам как базовым точкам карты."
          />
          <MetricCard
            label="Сигналы"
            value="Clustered"
            hint="Похожие новости собираются в общую аналитическую структуру."
          />
          <MetricCard
            label="Приоритет"
            value="High"
            hint="Это основной экран будущей операционной работы."
          />
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Backlog"
          title="Что должно появиться следующим"
          description="Сначала сюда логично вывести реальные события из базы, затем фильтры по странам, городам, темам, severity и времени."
        />

        <div className="px-6 pb-6 sm:px-8">
          <EmptyState
            eyebrow="Next step"
            title="Список событий пока не подключён"
            description="Следующим этапом мы можем подключить реальные данные из Supabase: events, news_count, last_seen_at, city, source density, severity и карточки события с drill-down."
          />
        </div>
      </Panel>
    </AppShell>
  );
}
