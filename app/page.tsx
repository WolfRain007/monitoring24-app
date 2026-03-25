import Link from "next/link";

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "blue" | "emerald" | "amber";
}) {
  const toneClasses =
    tone === "blue"
      ? "from-sky-50 to-blue-50 border-sky-100"
      : tone === "emerald"
      ? "from-emerald-50 to-teal-50 border-emerald-100"
      : tone === "amber"
      ? "from-amber-50 to-orange-50 border-amber-100"
      : "from-white to-slate-50 border-slate-200";

  return (
    <div
      className={`rounded-[28px] border bg-gradient-to-br ${toneClasses} px-5 py-5 shadow-sm`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <h3 className="text-lg font-semibold tracking-tight text-slate-950">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function QuickLinkCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-950 transition group-hover:text-sky-700">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500 transition group-hover:bg-sky-50 group-hover:text-sky-700">
          →
        </div>
      </div>
    </Link>
  );
}

function OverviewItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
      <div className="text-sm font-semibold text-slate-950">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{description}</div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/75 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.10),_transparent_28%)]" />

        <div className="relative px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
            <div className="max-w-4xl">
              <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-700">
                Monitoring24 · Global Intelligence Platform
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Аналитическая платформа
                <span className="bg-gradient-to-r from-slate-950 via-sky-800 to-indigo-800 bg-clip-text text-transparent">
                  {" "}
                  мониторинга событий
                </span>
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">
                Monitoring24 собирает информацию из проверенных источников,
                агрегирует события, помогает анализировать взаимосвязи и
                оценивать влияние на экономику, инфраструктуру, миграцию,
                общество, путешествия, питание, рынки и другие ключевые сферы.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/events"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)] transition hover:bg-slate-800"
                >
                  Открыть ленту событий
                </Link>

                <Link
                  href="/analytics"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Перейти к аналитике
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SummaryCard label="Статус платформы" value="Online" tone="blue" />
              <SummaryCard label="Источники" value="RSS First" tone="emerald" />
              <SummaryCard label="Обновление" value="до 5 мин" tone="amber" />
              <SummaryCard label="Интерфейс" value="RU / EN" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Operational Overview
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Что делает платформа
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <OverviewItem
              title="Сбор и агрегация"
              description="Платформа принимает поток материалов из проверенных RSS-источников и объединяет новости в единые события."
            />
            <OverviewItem
              title="Географическая привязка"
              description="События связываются с городами и отображаются в аналитическом пространстве для дальнейшей визуализации."
            />
            <OverviewItem
              title="Анализ последствий"
              description="Monitoring24 помогает оценивать влияние событий на мир, экономику, инфраструктуру и повседневную жизнь."
            />
            <OverviewItem
              title="Экспорт и отчёты"
              description="Результаты можно использовать для дашбордов, отчетности, аналитики и выгрузок в CSV/PDF."
            />
          </div>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
            Mission
          </div>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Monitoring24 — это не просто новостная лента
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            Это аналитическая среда, в которой события рассматриваются как
            взаимосвязанные сигналы: что произошло, где это произошло, какие
            последствия это запускает и на какие жизненные направления это
            влияет.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-sm font-semibold text-white">
                Влияние на мир и экономику
              </div>
              <div className="mt-1 text-sm text-slate-300">
                От кризисов и ограничений до транспортных, энергетических и
                рыночных эффектов.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-sm font-semibold text-white">
                Влияние на общество и миграцию
              </div>
              <div className="mt-1 text-sm text-slate-300">
                Оценка изменения условий жизни, перемещений, рисков и нагрузки
                на инфраструктуру.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-sm font-semibold text-white">
                Влияние на повседневность
              </div>
              <div className="mt-1 text-sm text-slate-300">
                Путешествия, питание, цены, доступность услуг и другие ключевые
                жизненные контексты.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Workspace
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Быстрые переходы
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <QuickLinkCard
            href="/events"
            title="События"
            description="Работа с агрегированными событиями, статусами, временными метками и связанными новостями."
          />

          <QuickLinkCard
            href="/news"
            title="Новости"
            description="Просмотр исходных материалов и входящих сигналов из подключенных проверенных источников."
          />

          <QuickLinkCard
            href="/map"
            title="Карта"
            description="Географическое представление событий и анализ пространственного распределения влияния."
          />

          <QuickLinkCard
            href="/analytics"
            title="Аналитика"
            description="Сводки, тренды, корреляции, последствия и тематические срезы по направлениям влияния."
          />

          <QuickLinkCard
            href="/sources"
            title="Источники"
            description="Управление и контроль качества источников, потоков, каналов обновления и структуры ingest."
          />

          <QuickLinkCard
            href="/events"
            title="Оперативный мониторинг"
            description="Быстрый вход в текущую ленту событий для работы в режиме реального времени."
          />
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        <FeatureCard
          title="Мир и геополитика"
          description="Отслеживание международных конфликтов, кризисов, дипломатических изменений и событий с глобальными последствиями."
        />

        <FeatureCard
          title="Экономика и инфраструктура"
          description="Мониторинг логистики, транспорта, энергетики, производственных цепочек, ограничений и сбоев."
        />

        <FeatureCard
          title="Общество и образ жизни"
          description="Анализ влияния событий на миграцию, безопасность, доступность услуг, путешествия, питание и ежедневные решения."
        />
      </section>
    </div>
  );
}
