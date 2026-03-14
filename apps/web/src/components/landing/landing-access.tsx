"use client";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LabifLogo } from "@/components/layout/labif-logo";

interface LandingAccessProps {
  allowStudents: boolean;
  allowExternalUsers: boolean;
}

function buildLoginHint(allowStudents: boolean, allowExternalUsers: boolean): string {
  if (allowExternalUsers) {
    return "Qualquer conta Google está autorizada a acessar este portal.";
  }
  if (allowStudents) {
    return "Use seu e-mail @ifsp.edu.br, @aluno.ifsp.edu.br ou um e-mail com permissão da coordenação.";
  }
  return "É necessário usar seu e-mail @ifsp.edu.br ou um e-mail com permissão da coordenação.";
}

export function LandingAccess({ allowStudents, allowExternalUsers }: LandingAccessProps) {
  const hint = buildLoginHint(allowStudents, allowExternalUsers);

  return (
    <section
      className="relative flex flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-16 sm:py-24"
      id="acesso"
    >
      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-emerald-900/30 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 right-0 h-[360px] w-[360px] rounded-full bg-rose-900/20 blur-[100px]"
      />

      {/* Title */}
      <div className="relative mb-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/50 bg-emerald-950/60 px-3 py-1 text-xs font-medium text-emerald-400">
          Portal de Agendamentos
        </span>
        <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
          Acesse o portal e{" "}
          <span className="text-emerald-400">agende o laboratório</span>
        </h2>
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-sm">
        <div className="rounded-3xl bg-white p-8 shadow-[0_32px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/5">

          <div className="flex justify-center">
            <LabifLogo vertical />
          </div>

          <div className="mt-8 text-center">
            <h3 className="font-display text-xl font-semibold text-slate-900">
              Bem-vindo(a) ao LabIF Maker
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Para acessar o portal de agendamentos, faça login com a sua conta do Google.
            </p>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <GoogleSignInButton institutional={!allowExternalUsers} />
            <p className="mt-4 text-xs leading-5 text-slate-500">{hint}</p>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Ao acessar, você concorda com as regras de uso do laboratório.
          </p>
        </div>
      </div>
    </section>
  );
}
