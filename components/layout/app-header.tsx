import { StatusBadge } from "@/components/ui/status-badge";

export function AppHeader() {
  return (
    <header className="rounded-[28px] border border-slate-200 bg-white/95 px-5 py-4 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.16)] backdrop-blur sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
            Operations overview
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Monitoring24 control surface
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
            Единая рабочая среда для наблюдения за событиями, потоком публикаций,
            географией сигналов и аналитическим воздействием на ключевые сферы.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label="RSS online" tone="success" />
          <StatusBadge label="Events active" tone="info" />
          <StatusBadge label="Analytics ready" tone="neutral" />
        </div>
      </div>
    </header>
  );
}
