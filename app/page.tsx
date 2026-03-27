import { PageShell } from "@/components/layout/page-shell";
import { FilterChip } from "@/components/ui/filter-chip";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default function HomePage() {
  return (
    <PageShell>
      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Monitoring24 · What matters now"
          title="Аналитическая платформа мониторинга событий и их последствий"
          description="Monitoring24 агрегирует данные из проверенных источников, связывает публикации в события и помогает видеть, как происходящее влияет на экономику, инфраструктуру, перемещения, общество, путешествия, supply chains и жизненно важные сферы."
          action={<StatusBadge label="System online" tone="success" />}
        />

        <div className="grid gap-4 px-6 pb-6 pt-2 sm:px-8 lg:grid-cols-4">
          <MetricCard
            label="Архитектура"
            value="RSS-first"
            hint="Фокус на надёжных RSS-источниках и дальнейшей event-агрегации."
          />
          <MetricCard
            label="Частота обновления"
            value="до 5 мин"
            hint="Целевой SLA обновления витрин, ленты и аналитических блоков."
          />
          <MetricCard
            label="Интерфейс"
            value="RU / EN"
            hint="Поддержка двуязычного сценария для команды и клиентов."
          />
          <MetricCard
            label="Формат данных"
            value="Event-driven"
            hint="Модель, где одно событие агрегирует множество связанных публикаций."
          />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Panel className="overflow-hidden">
          <SectionHeader
            eyebrow="Situation overview"
            title="Глобальная ситуация по основным направлениям"
            description="Платформа должна помогать быстро понять, где растут риски, где усиливается информационная плотность и какие темы требуют внимания аналитика."
          />

          <div className="space-y-4 px-6 pb-6 sm:px-8">
            <div className="flex flex-wrap gap-2">
              <FilterChip label="Все события" active />
              <FilterChip label="Геополитика" />
              <FilterChip label="Экономика" />
              <FilterChip label="Инфраструктура" />
              <FilterChip label="Миграция" />
              <FilterChip label="Путешествия" />
              <FilterChip label="Логистика" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">
                    Наибольшая плотность сигналов
                  </h3>
                  <StatusBadge label="High attention" tone="warning" />
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li>• Города и регионы с ростом числа связанных публикаций</li>
                  <li>• Темы с повышенной вероятностью вторичных последствий</li>
                  <li>• Кластеры, где требуется ручная аналитическая проверка</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">
                    Приоритет платформы
                  </h3>
                  <StatusBadge label="Operational" tone="info" />
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li>• Быстрая привязка публикаций к событиям и городам</li>
                  <li>• Понимание каскадного влияния на смежные сферы</li>
                  <li>• Переход от новостей к прогнозной аналитике</li>
                </ul>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <SectionHeader
            eyebrow="Platform focus"
            title="Что должно быть в центре Monitoring24"
            description="Не просто лента новостей, а рабочая система аналитика: события, взаимосвязи, влияние, карта, экспорт и отчётность."
          />

          <div className="space-y-4 px-6 pb-6 sm:px-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Ключевые модули
              </h3>
              <div className="mt-4 grid gap-3">
                {[
                  "Event stream и рабочая лента публикаций",
                  "Карта с привязкой событий к городам",
                  "Аналитические витрины по темам и регионам",
                  "Экспорт CSV / PDF для клиентов и внутренних отчётов",
                  "Прогнозный слой влияния на ключевые сферы жизни",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Следующий фокус
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                После стабилизации UI и доменной схемы логично перейти к
                полноценной event-витрине, фильтрам, страницам новостей и
                защищённому кабинету пользователя.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
