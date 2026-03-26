import { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  dark?: boolean;
};

export function Panel({
  children,
  className = "",
  strong = false,
  dark = false,
}: PanelProps) {
  if (dark) {
    return (
      <div
        className={[
          "rounded-[28px] border border-white/10 bg-slate-950/70 backdrop-blur-xl",
          "shadow-[0_24px_80px_rgba(15,23,42,0.18)]",
          className,
        ].join(" ")}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={[
        "rounded-[28px] border backdrop-blur-xl",
        strong
          ? "border-white/70 bg-white/90 shadow-[0_18px_60px_rgba(148,163,184,0.18)]"
          : "border-white/60 bg-white/75 shadow-[0_14px_50px_rgba(148,163,184,0.16)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
