import Image from "next/image";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { cookies } from "next/headers";

import { getAccessSettings } from "@/lib/auth/access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingAbout } from "@/components/landing/landing-about";
import { LandingEquipment } from "@/components/landing/landing-equipment";
import { LandingLocation } from "@/components/landing/landing-location";
import { LandingAccess } from "@/components/landing/landing-access";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "labifmaker_session";

export default async function HomePage() {
  const [cookieStore, accessSettings] = await Promise.all([
    cookies(),
    getAccessSettings()
  ]);

  const hasSession = Boolean(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const primaryHref = hasSession ? "/app" : "#acesso";
  const primaryLabel = "Agendar laboratório";

  const navigation = [
    { label: "Início", href: "#inicio" },
    { label: "Sobre", href: "#sobre" },
    { label: "Equipamentos", href: "#equipamentos" },
    { label: "Agendamento", href: "#agendamento" },
    { label: "Regras", href: "#regras" },
    { label: "Localização", href: "#localizacao" },
    ...(!hasSession ? [{ label: "Acesso", href: "#acesso" }] : [])
  ];

  return (
    <div className="bg-[#f5f7f6] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
          <a className="flex items-center gap-3" href="#inicio">
            <Image
              alt="IFSP Jacareí"
              className="h-11 w-auto"
              height={56}
              priority
              src="/landing/logo-ifsp.png"
              width={176}
            />
            <div className="hidden sm:block leading-tight">
              <span className="block font-display text-lg font-semibold text-emerald-700">
                LabIF Maker
              </span>
              <span className="text-xs text-slate-500">IFSP Campus Jacareí</span>
            </div>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {navigation.map((item) => (
              <a
                className="text-sm font-medium text-slate-600 transition hover:text-emerald-700"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {hasSession ? (
            <Button asChild>
              <Link href="/app">{primaryLabel}</Link>
            </Button>
          ) : (
            <Button asChild>
              <a href="#acesso">{primaryLabel}</a>
            </Button>
          )}
        </div>
      </header>

      <main>
        <LandingHero primaryHref={primaryHref} primaryLabel={primaryLabel} />
        <LandingAbout />
        <LandingEquipment />

        <section className="bg-white py-10 sm:py-14" id="regras">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Card className="mx-auto max-w-5xl border-slate-200 bg-white shadow-none">
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose-50">
                  <FileText className="h-7 w-7 text-rose-600" />
                </div>
                <div className="text-center md:text-left">
                  <h2 className="font-display text-2xl font-semibold text-slate-950 sm:text-3xl">
                    Regras de Uso
                  </h2>
                  <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
                    Antes de utilizar o LabIF Maker, é obrigatório conhecer as regras de uso dos
                    equipamentos, normas de segurança e procedimentos do laboratório.
                  </p>
                  <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row md:items-start">
                    <Button className="gap-2" size="lg" type="button">
                      <Download className="h-5 w-5" />
                      Baixar Regulamento (PDF)
                    </Button>
                    <p className="text-sm leading-6 text-slate-500">
                      A leitura e aceite do regulamento é pré-requisito para agendamento.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <LandingLocation />

        {!hasSession && (
          <LandingAccess
            allowExternalUsers={accessSettings.allowExternalUsers}
            allowStudents={accessSettings.allowStudents}
          />
        )}
      </main>

      <footer className="bg-slate-950 py-10 text-white/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white px-3 py-2">
              <Image
                alt="IFSP Jacareí"
                className="h-12 w-auto"
                height={521}
                src="/branding/ifsp-campus-jacarei.png"
                width={450}
              />
            </div>
            <div>
              <span className="block font-display text-lg font-semibold text-white">LabIF Maker</span>
              <span className="text-sm text-white/60">IFSP Campus Jacareí</span>
            </div>
          </div>

          <div className="text-sm leading-7 text-white/70">
            <p>IFSP Campus Jacareí</p>
            <p>Rua Antônio Fogaça de Almeida, 200 - Jardim Elza Maria</p>
            <p>Jacareí - SP, 12322-030</p>
          </div>

          <div className="text-sm leading-7 text-white/70">
            <p>Portal de agendamentos do laboratório</p>
            <p>Desenvolvido pelo LabIF Maker - IFSP Campus Jacareí</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
