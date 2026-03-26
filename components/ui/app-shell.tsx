"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryNav = [
  { href: "/", label: "Dashboard" },
  { href: "/map", label: "Map" },
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
  { href: "/signals", label: "Signals" },
  { href: "/anomalies", label: "Anomalies" },
];

const secondaryNav = [
  { href: "/sectors", label: "Sectors" },
  { href: "/locations", label: "Locations" },
  { href: "/watchlists", label: "Watchlists" },
  { href: "/reports", label: "Reports" },
];

const utilityNav = [
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: { href: string; label: string }[];
  pathname: string;
}) {
  return (
    <div>
      <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        {title}
      </div>

      <nav className="space-y-1.5">
        {items.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center rounded-2xl px-3 py-3 text-sm font-medium transition",
                active
                  ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.10),_transparent_20%),radial-gradient(circle_at_bottom_center,_rgba(168,85,247,0.12),_transparent_28%),linear-gradient(180deg,_#f7fbff_0%,_#eef4fb_48%,_#edf2f7_100%)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[290px] shrink-0 border-r border-white/10 bg-slate-950/92 text-white xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-sky-400 via-cyan-300 to-indigo-500 text-sm font-bold text-slate-950 shadow-lg">
                M24
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                  Monitoring24
                </div>
                <div className="mt-1 text-lg font-semibold text-white">
                  News × Risk
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
            <NavGroup title="Core" items={primaryNav} pathname={pathname} />
            <NavGroup title="Intelligence" items={secondaryNav} pathname={pathname} />
            <NavGroup title="Account" items={utilityNav} pathname={pathname} />
          </div>

          <div className="px-4 pb-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Platform state
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-white">
                  Operational
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Event workspace, feeds and analytical surfaces are available.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/50 bg-white/60 backdrop-blur-2xl">
            <div className="flex h-20 items-center justify-between px-5 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <div className="xl:hidden">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-slate-950 text-sm font-bold text-white">
                    M24
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700/80">
                    Event-first Intelligence Platform
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">
                    Monitoring24 Workspace
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="hidden rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm md:inline-flex"
                >
                  RU / EN
                </button>

                <button
                  type="button"
                  className="hidden rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm md:inline-flex"
                >
                  Light / Dark
                </button>

                <div className="rounded-[20px] border border-white/70 bg-white/75 px-4 py-2 shadow-sm">
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
