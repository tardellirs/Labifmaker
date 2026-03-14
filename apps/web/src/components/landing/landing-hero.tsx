import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface LandingHeroProps {
  primaryHref: string;
  primaryLabel: string;
}

export function LandingHero({ primaryHref, primaryLabel }: LandingHeroProps) {
  return (
    <section className="relative flex min-h-[60vh] items-center overflow-hidden" id="inicio">
      <div className="absolute inset-0">
        <Image
          alt="Laboratorio Maker"
          className="h-full w-full object-cover"
          fill
          priority
          src="/landing/hero-makerspace.jpg"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,22,34,0.9)_0%,rgba(11,22,34,0.72)_45%,rgba(11,22,34,0.35)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <Badge className="mb-5 bg-rose-600 text-white hover:bg-rose-600" variant="neutral">
            Fabricação digital, governança e agendamento institucional
          </Badge>
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Transforme ideias em protótipos com o <span className="text-emerald-400">LabIF Maker</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
            Um portal único para professores e coordenadores gerenciarem uso do laboratório,
            solicitações técnicas, disponibilidade e aprovações com clareza.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#equipamentos">Ver equipamentos</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
