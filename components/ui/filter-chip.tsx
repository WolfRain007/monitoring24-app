type FilterChipProps = {
  label: string;
  active?: boolean;
};

export function FilterChip({ label, active = false }: FilterChipProps) {
  return (
    <button
      type="button"
      className={[
        "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-sky-300 bg-sky-500/10 text-sky-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          : "border-white/70 bg-white/70 text-slate-600 hover:bg-white hover:text-slate-900",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
