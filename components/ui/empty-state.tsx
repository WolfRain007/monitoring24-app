import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  eyebrow,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6",
        className,
      )}
    >
      {eyebrow ? (
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
          {eyebrow}
        </div>
      ) : null}

      <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
        {title}
      </h3>

      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        {description}
      </p>

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
