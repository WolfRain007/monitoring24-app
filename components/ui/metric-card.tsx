import { Panel } from "./panel";

type MetricCardProps = {
  label: string;
  value: string;
  change?: string;
  hint?: string;
};

export function MetricCard({
  label,
  value,
  change,
  hint,
}: MetricCardProps) {
  return (
    <Panel className="p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-3xl font-semibold tracking-tight text-slate-950">
          {value}
        </div>
        {change ? (
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {change}
          </div>
        ) : null}
      </div>

      {hint ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{hint}</p>
      ) : null}
    </Panel>
  );
}
