import { requireAuth } from "@/lib/dal/auth";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import { ChangePasswordForm } from "./_components/change-password-form";

export default async function AccountSettingsPage() {
  await requireAuth();
  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Ustawienia konta" description="Zarządzaj swoim hasłem i preferencjami" />
      <div className="max-w-lg">
        <GlassCard>
          <div className="px-6 py-6">
            <h2 className="text-sm font-semibold text-aether-text mb-4">Zmiana hasła</h2>
            <ChangePasswordForm />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
