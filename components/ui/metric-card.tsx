import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  trend?: ReactNode;
  className?: string;
};

export function MetricCard({
  label,
  value,
  hint,
  trend,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-slate-50/80 p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-slate-500">{label}</div>
        {trend ? <div className="shrink-0">{trend}</div> : null}
      </div>

      <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
        {value}
      </div>

      {hint ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{hint}</p>
      ) : null}
    </div>
  );
}
