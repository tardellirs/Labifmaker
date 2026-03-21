import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAccessSettings } from "@/lib/auth/access";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LabifLogo } from "@/components/layout/labif-logo";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

function buildLoginHint(allowStudents: boolean, allowExternalUsers: boolean): string {
  if (allowExternalUsers) {
    return "Qualquer conta Google está autorizada a acessar este portal.";
  }
  if (allowStudents) {
    return "Use seu e-mail @ifsp.edu.br, @aluno.ifsp.edu.br ou um e-mail com permissão da coordenação.";
  }
  return "Lembre-se: é necessário usar seu e-mail @ifsp.edu.br ou um e-mail com permissão da coordenação.";
}

export default async function LoginPage() {
  const accessSettings = await getAccessSettings();

  const { allowStudents, allowExternalUsers } = accessSettings;
  const hint = buildLoginHint(allowStudents, allowExternalUsers);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-6">
      <Card className="w-full max-w-sm">
        <Link
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
          href="/"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o início
        </Link>

        <div className="mt-6 flex justify-center">
          <LabifLogo vertical />
        </div>

        <CardTitle className="mt-6 text-xl">Bem-vindo(a) ao LabIF Maker</CardTitle>
        <CardDescription className="mt-2">
          Para acessar o portal de agendamentos, faça login com a sua conta do Google.
        </CardDescription>

        <div className="mt-6 rounded-[20px] bg-slate-50 p-4">
          <GoogleSignInButton institutional={!allowExternalUsers} />
          <p className="mt-4 text-xs leading-5 text-slate-500">{hint}</p>
        </div>
      </Card>
    </div>
  );
}
