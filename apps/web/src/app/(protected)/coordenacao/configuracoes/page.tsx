import { AccessSettingsManager } from "@/components/coordinator/access-settings-manager";
import { CoordinatorEmailManager } from "@/components/coordinator/coordinator-email-manager";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAccessSettings } from "@/lib/auth/access";
import { getCoordinatorSettingsData } from "@/lib/coordinator/dashboard-data";

export default async function CoordinatorSettingsPage() {
  const [{ coordinatorEmails, notificationRecipients }, accessSettings] = await Promise.all([
    getCoordinatorSettingsData(),
    getAccessSettings()
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <Badge variant="brand">Configurações</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">
          Acessos e notificações da coordenação.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Gerencie quem pode entrar como coordenador (qualquer e-mail), amplie o acesso para alunos
          ou usuários externos, e selecione quais contas recebem os e-mails do sistema.
        </p>
      </Card>

      <AccessSettingsManager
        allowExternalUsers={accessSettings.allowExternalUsers}
        allowStudents={accessSettings.allowStudents}
      />

      <CoordinatorEmailManager
        emails={coordinatorEmails}
        notificationRecipients={notificationRecipients}
      />
    </div>
  );
}
