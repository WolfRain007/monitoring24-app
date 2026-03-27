"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  badge?: string;
};

const primaryNav: NavItem[] = [
  { label: "Обзор", href: "/" },
  { label: "События", href: "/events", badge: "core" },
  { label: "Новости", href: "/news" },
  { label: "Карта", href: "/map" },
  { label: "Аналитика", href: "/analytics", badge: "beta" },
];

const secondaryNav: NavItem[] = [
  { label: "Источники", href: "/sources" },
  { label: "Экспорт", href: "/exports" },
  { label: "Настройки", href: "/settings" },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      )}
    >
      <span>{item.label}</span>

      {item.badge ? (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
            active
              ? "bg-white/15 text-white"
              : "bg-slate-200 text-slate-600",
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-full max-w-[280px] shrink-0 xl:block">
      <div className="sticky top-6 space-y-6 rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.16)] backdrop-blur">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
            Monitoring24
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Event intelligence workspace
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Аналитическая платформа для мониторинга событий, сигналов и их
            последствий.
          </p>
        </div>

        <nav className="space-y-2">
          <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Основное
          </div>
          {primaryNav.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              active={pathname === item.href}
            />
          ))}
        </nav>

        <nav className="space-y-2">
          <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Управление
          </div>
          {secondaryNav.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              active={pathname === item.href}
            />
          ))}
        </nav>

        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
          <div className="text-sm font-semibold text-slate-900">
            Статус данных
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            RSS-first ingest, event assignment и витрины должны работать как
            единый цикл обновления.
          </p>
        </div>
      </div>
    </aside>
  );
}
