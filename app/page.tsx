export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
          Monitoring24 · What matters now
        </div>

        <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Аналитическая панель глобального мониторинга событий
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          Monitoring24 превращает поток публикаций из проверенных источников
          в события, сигналы и аналитические выводы, которые помогают понимать
          риски, последствия и точки возможностей.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm text-slate-500">Статус платформы</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">Online</div>
            <p className="mt-2 text-sm text-slate-600">
              RSS ingest, event workspace и аналитический слой доступны.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm text-slate-500">Источники</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">RSS-first</div>
            <p className="mt-2 text-sm text-slate-600">
              Архитектура сфокусирована на RSS и проверенных публичных источниках.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm text-slate-500">Обновление</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">до 5 мин</div>
            <p className="mt-2 text-sm text-slate-600">
              Целевая частота обновления событий и витрин платформы.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm text-slate-500">Интерфейс</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">RU / EN</div>
            <p className="mt-2 text-sm text-slate-600">
              Поддержка двуязычного сценария использования.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
