import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default function SettingsPage() {
  return (
    <AppShell>
      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Settings"
          title="Настройки платформы"
          description="В будущем здесь будут пользовательские настройки, язык интерфейса, параметры уведомлений, формат отображения данных и административные параметры."
          action={<StatusBadge label="Workspace config" tone="neutral" />}
        />

        <div className="grid gap-4 px-6 pb-6 pt-2 sm:px-8 lg:grid-cols-4">
          <MetricCard
            label="Язык"
            value="RU / EN"
            hint="Переключение языка — обязательный сценарий платформы."
          />
          <MetricCard
            label="Доступ"
            value="User / Admin"
            hint="Права и роли могут управлять видимостью разделов."
          />
          <MetricCard
            label="Профиль"
            value="Workspace"
            hint="Настройки персонального и командного режима работы."
          />
          <MetricCard
            label="Назначение"
            value="Control"
            hint="Управление поведением интерфейса и среды."
          />
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <SectionHeader
          eyebrow="Configuration"
          title="Что стоит добавить позже"
          description="Раздел настроек пригодится для языка, профиля, режимов аналитики, уведомлений и управления API-интеграциями."
        />

        <div className="px-6 pb-6 sm:px-8">
          <EmptyState
            eyebrow="Settings backlog"
            title="Пользовательские настройки пока не подключены"
            description="Следующим шагом мы можем добавить переключатель RU/EN, настройки профиля и базовые предпочтения рабочего пространства."
          />
        </div>
      </Panel>
    </AppShell>
  );
}
