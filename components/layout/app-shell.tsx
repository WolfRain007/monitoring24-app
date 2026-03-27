import { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <AppSidebar />

      <div className="min-w-0 flex-1 space-y-6">
        <AppHeader />
        {children}
      </div>
    </main>
  );
}
