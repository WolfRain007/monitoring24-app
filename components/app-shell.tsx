import { ReactNode } from "react";
import Link from "next/link";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
  { href: "/map", label: "Map" },
];

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef4fb_50%,_#edf2f7_100%)] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 border-r border-slate-200 bg-slate-950 text-white xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-white">
                M24
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  Monitoring24
                </div>
                <div className="mt-1 text-lg font-semibold text-white">
                  Intelligence Suite
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6">
            <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Navigation
            </div>

            <div className="space-y-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-white/60 bg-white/80 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-5 sm:px-6 lg:px-8">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Monitoring24 Platform
                </div>
                <div className="text-lg font-semibold text-slate-950">
                  Global Monitoring Workspace
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  RU / EN
                </button>
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
                  RSS · Event Intelligence · Analytics
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
