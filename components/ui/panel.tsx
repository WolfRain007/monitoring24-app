import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.18)] backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}
