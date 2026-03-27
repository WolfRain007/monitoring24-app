import { AppShell } from "@/components/layout/app-shell";
import { FilterChip } from "@/components/ui/filter-chip";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default function HomePage() {
  return (
    <AppShell>
      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Platform overview"
          title="Ситуационная картина Monitoring24"
          description="Платформа объединяет поток публикаций, агрегирует их в события, связывает с географией и помогает видеть операционные, социальные и экономические последствия."
          action={<StatusBadge label="Live platform" tone="success" />}
        />

        <div className="grid gap-4 px-6 pb-6 pt-2 sm:px-8 lg:grid-cols-4">
          <MetricCard
            label="Модель данных"
            value="Event-driven"
            hint="Событие агрегирует множество связанных публикаций и аналитических сигналов."
          />
          <MetricCard
            label="Источник"
            value="RSS-first"
            hint="Приоритет проверенным RSS-источникам и устойчивой схеме обновления."
          />
          <MetricCard
            label="Обновление"
            value="до 5 мин"
            hint="Целевой цикл перерасчёта публикаций, событий и витрин."
          />
          <MetricCard
            label="Режим"
            value="RU / EN"
            hint="Двуязычная работа платформы для локальных и международных сценариев."
          />
        </div>
      </Panel>

      <div className="grid gap-6 2xl:grid-cols-[1.3fr_1fr]">
        <Panel className="overflow-hidden">
          <SectionHeader
            eyebrow="Priority workspace"
            title="Приоритеты аналитической команды"
            description="Ключевая задача — быстро увидеть плотность сигналов, важные узлы событий и сферы, где последствия могут нарастать каскадно."
          />

          <div className="space-y-5 px-6 pb-6 sm:px-8">
            <div className="flex flex-wrap gap-2">
              <FilterChip label="Все" active />
              <FilterChip label="Экономика" />
              <FilterChip label="Инфраструктура" />
              <FilterChip label="Общество" />
              <FilterChip label="Миграция" />
              <FilterChip label="Логистика" />
              <FilterChip label="Путешествия" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">
                    Сигналы, требующие внимания
                  </h3>
                  <StatusBadge label="High attention" tone="warning" />
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    "Рост числа публикаций вокруг связанных городских кластеров",
                    "Темы с вероятными вторичными последствиями для инфраструктуры",
                    "Узлы событий, где полезно включать ручную аналитическую интерпретацию",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">
                    Ближайший продуктовый фокус
                  </h3>
                  <StatusBadge label="Execution" tone="info" />
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    "Устойчивое присвоение news items к events",
                    "Улучшение city resolution из title, description и content",
                    "Сборка витрин событий, новостей, карты и экспорта",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <SectionHeader
            eyebrow="Operating model"
            title="Ядро платформы"
            description="Monitoring24 должен помогать не только видеть новости, но и понимать их взаимосвязь, силу влияния и развитие во времени."
          />

          <div className="space-y-4 px-6 pb-6 sm:px-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Базовые контуры
              </h3>

              <div className="mt-4 grid gap-3">
                {[
                  "Event stream как главный объект анализа",
                  "Город как минимальная географическая единица на карте",
                  "Много NewsItem внутри одного Event",
                  "Экспорт CSV / PDF для внешнего использования",
                  "Аналитический и прогнозный слой поверх потока событий",
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
                Что дальше
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Следующий шаг — превратить этот shell в реальные страницы
                продукта: события, новости, карта, аналитика, защищённый кабинет
                и рабочий сценарий пользователя.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
