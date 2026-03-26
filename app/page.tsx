import { MetricCard } from "@/components/ui/metric-card";
import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { FilterChip } from "@/components/ui/filter-chip";

const topEvents = [
  {
    title: "Ограничения в портовой логистике усиливают давление на supply chains",
    location: "Европа · Средиземноморье",
    risk: "Высокий",
    summary:
      "Рост задержек в узловых портах влияет на сроки поставок, стоимость маршрутов и доступность инфраструктурных коридоров.",
  },
  {
    title: "Скачок погодных аномалий увеличивает нагрузку на энергосистемы",
    location: "Южная Европа · Ближний Восток",
    risk: "Средний",
    summary:
      "Температурные экстремумы повышают спрос на охлаждение, усиливают нагрузку на сети и меняют локальный профиль риска.",
  },
  {
    title: "Изменение регуляторной среды влияет на инвестиционные потоки",
    location: "США · ЕС · Азия",
    risk: "Средний",
    summary:
      "Сигналы регуляторных изменений отражаются на секторах роста, ожиданиях бизнеса и стратегиях перераспределения капитала.",
  },
];

const hotspots = [
  { name: "Стамбул", value: "18 сигналов", tone: "warning" as const },
  { name: "Роттердам", value: "12 событий", tone: "danger" as const },
  { name: "Дубай", value: "9 изменений", tone: "info" as const },
  { name: "Сингапур", value: "7 сигналов", tone: "success" as const },
];

const anomalies = [
  "Рост плотности публикаций по инфраструктуре выше baseline",
  "Смена source distribution в международной логистике",
  "Необычная комбинация погодных и ценовых сигналов",
];

const domainCards = [
  {
    title: "Экономика и рынки",
    text: "Отслеживание макроизменений, инвестиционных рисков и изменений в глобальных потоках капитала.",
  },
  {
    title: "Инфраструктура и логистика",
    text: "Сбои цепочек поставок, транспортные узлы, порты, энергетические и критические системы.",
  },
  {
    title: "Миграция и общество",
    text: "Сигналы социальной напряжённости, мобильности населения и изменений повседневной среды.",
  },
  {
    title: "Путешествия и релокация",
    text: "Практическая оценка условий для перемещения, жизни, работы и локальной устойчивости.",
  },
];

export default function HomePage() {
  return (
    <PageShell>
      <div className="space-y-8">
        <Panel className="overflow-hidden p-6 sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
            <div>
              <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                Monitoring24 · What matters now
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Аналитическая панель глобального мониторинга событий
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Monitoring24 превращает поток публикаций из проверенных источников
                в события, сигналы и аналитические выводы, которые помогают
                понимать риски, последствия и точки возможностей.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <FilterChip label="Top events" active />
                <FilterChip label="Hotspots" />
                <FilterChip label="Anomalies" />
                <FilterChip label="Weak signals" />
                <FilterChip label="Impacts" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                label="Статус платформы"
                value="Online"
                hint="RSS ingest, event workspace и аналитический слой доступны."
              />
              <MetricCard
                label="Источники"
                value="RSS-first"
                hint="Архитектура сфокусирована на RSS и проверенных публичных источниках."
              />
              <MetricCard
                label="Обновление"
                value="до 5 мин"
                hint="Целевая частота обновления событий и витрин платформы."
              />
              <MetricCard
                label="Интерфейс"
                value="RU / EN"
                hint="Поддержка двуязычного сценария использования."
              />
            </div>
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel className="p-6">
            <SectionHeader
              eyebrow="Priority feed"
              title="Ключевые события"
              description="События с наибольшим влиянием на экономику, инфраструктуру, мобильность и повседневные решения."
            />

            <div className="mt-6 space-y-4">
              {topEvents.map((event) => (
                <div
                  key={event.title}
                  className="rounded-[24px] border border-slate-200/80 bg-white/80 p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge tone="warning">{event.risk}</StatusBadge>
                    <span className="text-sm text-slate-500">{event.location}</span>
                  </div>

                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                    {event.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {event.summary}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel className="p-6">
              <SectionHeader
                eyebrow="Geo focus"
                title="Географические hotspot-зоны"
                description="Локации с повышенной плотностью событий, сигналов и заметных изменений."
              />

              <div className="mt-6 space-y-3">
                {hotspots.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-[20px] border border-slate-200/80 bg-white/80 px-4 py-4"
                  >
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <StatusBadge tone={item.tone}>{item.value}</StatusBadge>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel dark className="p-6 text-white">
              <SectionHeader
                eyebrow="Anomaly preview"
                title="Аномалии и ранние изменения"
                description="Предварительные сигналы, которые могут указывать на нестандартную динамику."
              />

              <div className="mt-6 space-y-3">
                {anomalies.map((item) => (
                  <div
                    key={item}
                    className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <Panel className="p-6">
          <SectionHeader
            eyebrow="Decision domains"
            title="Что анализирует платформа"
            description="Monitoring24 нужен не для просмотра новостей, а для понимания того, как события меняют жизнь, рынки и возможности."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {domainCards.map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-slate-200/80 bg-white/80 p-5"
              >
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
