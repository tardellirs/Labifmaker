"use client";

import { startTransition, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

interface AccessSettingsManagerProps {
  allowStudents: boolean;
  allowExternalUsers: boolean;
}

export function AccessSettingsManager({
  allowStudents: initialAllowStudents,
  allowExternalUsers: initialAllowExternalUsers
}: AccessSettingsManagerProps) {
  const router = useRouter();
  const [allowStudents, setAllowStudents] = useState(initialAllowStudents);
  const [allowExternalUsers, setAllowExternalUsers] = useState(initialAllowExternalUsers);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);

    try {
      const response = await fetch("/api/access-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowStudents, allowExternalUsers })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao salvar configurações.");
      }

      toast.success("Configurações de acesso atualizadas.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <Badge variant="brand">Acesso ampliado</Badge>
      <CardTitle className="mt-4">Quem pode fazer login no portal</CardTitle>
      <CardDescription className="mt-3">
        Por padrão, apenas professores com e-mail <strong>@ifsp.edu.br</strong> ou coordenadores
        cadastrados têm acesso. Use as opções abaixo para ampliar o acesso.
      </CardDescription>

      <div className="mt-6 space-y-4">
        <label className="flex cursor-pointer items-start gap-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300">
          <input
            checked={allowStudents}
            className="mt-0.5 h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-100"
            onChange={(event) => setAllowStudents(event.target.checked)}
            type="checkbox"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">Permitir acesso a alunos</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Alunos com e-mail <strong>@aluno.ifsp.edu.br</strong> poderão fazer login e solicitar
              agendamentos. O acesso é equivalente ao de professores.
            </p>
          </div>
        </label>

        <label className="flex cursor-pointer items-start gap-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300">
          <input
            checked={allowExternalUsers}
            className="mt-0.5 h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-100"
            onChange={(event) => setAllowExternalUsers(event.target.checked)}
            type="checkbox"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">Permitir acesso a usuários externos</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Qualquer conta Google poderá fazer login, independente do domínio do e-mail. Use com
              cautela — o acesso é equivalente ao de professores. O botão de login na tela de entrada
              passará a exibir <strong>&quot;Entrar com o Google&quot;</strong>.
            </p>
          </div>
        </label>
      </div>

      <Button
        className="mt-6"
        disabled={saving}
        onClick={() => void handleSave()}
        type="button"
      >
        {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar configurações de acesso
      </Button>
    </Card>
  );
}
