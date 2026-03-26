import { ReactNode } from "react";
import Link from "next/link";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/map", label: "Map" },
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
  { href: "/signals", label: "Signals" },
  { href: "/anomalies", label: "Anomalies" },
  { href: "/sectors", label: "Sectors" },
  { href: "/locations", label: "Locations" },
  { href: "/watchlists", label: "Watchlists" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" },
];

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.10),_transparent_20%),radial-gradient(circle_at_bottom_center,_rgba(168,85,247,0.12),_transparent_28%),linear-gradient(180deg,_#f7fbff_0%,_#eef4fb_48%,_#edf2f7_100%)] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] shrink-0 border-r border-slate-200/70 bg-slate-950 text-white xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Monitoring24
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
              News × Risk
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Event-first intelligence workspace.
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-5">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="border-t border-white/10 px-4 py-4">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Workspace
              </div>
              <div className="mt-2 text-sm font-medium text-white">
                Operational
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/50 bg-white/70 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-5 sm:px-6 lg:px-8">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700/80">
                  Monitoring24
                </div>
                <div className="text-lg font-semibold tracking-tight text-slate-950">
                  Intelligence Workspace
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  RU / EN
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Light / Dark
                </button>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
