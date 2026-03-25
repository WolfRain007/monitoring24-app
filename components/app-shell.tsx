"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
  { href: "/map", label: "Map" },
  { href: "/analytics", label: "Analytics" },
  { href: "/sources", label: "Sources" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.10),_transparent_22%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_48%,_#edf2f9_100%)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] shrink-0 border-r border-white/50 bg-slate-950 text-white xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-white shadow-lg">
                M24
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                  Monitoring24
                </div>
                <div className="mt-1 text-lg font-semibold text-white">
                  Intelligence Suite
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-6">
            <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Navigation
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center rounded-2xl px-3 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto px-4 pb-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                System status
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-white">
                  Operational
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                RSS ingestion, aggregation and analytics workspace are available.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/50 bg-white/70 backdrop-blur-xl">
            <div className="flex h-20 items-center justify-between px-5 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <div className="xl:hidden">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                    M24
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                    Monitoring24 Platform
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">
                    Global Monitoring Workspace
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm md:flex">
                  RSS · Event Intelligence · Analytics
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                  <div className="text-xs text-slate-500">Signed in as</div>
                  <div className="text-sm font-semibold text-slate-900">
                    livepresent@yandex.ru
                  </div>
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
