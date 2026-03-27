import { cn } from "@/lib/utils";

type FilterChipProps = {
  label: string;
  active?: boolean;
};

export function FilterChip({
  label,
  active = false,
}: FilterChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
        active
          ? "border-sky-300 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
      )}
    >
      {label}
    </button>
  );
}
