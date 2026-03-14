import { BookOpen, Lightbulb, Users } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const aboutItems = [
  {
    icon: Lightbulb,
    title: "Inovação",
    text: "Espaço voltado para prototipagem, pesquisa aplicada e desenvolvimento de novas soluções."
  },
  {
    icon: Users,
    title: "Comunidade",
    text: "Ambiente para docentes, coordenadores e projetos institucionais conectados ao campus."
  },
  {
    icon: BookOpen,
    title: "Aprendizado",
    text: "Cultura de aprender fazendo, com uso orientado de fabricação digital e experimentação."
  }
];

export function LandingAbout() {
  return (
    <section className="bg-white py-10 sm:py-14" id="sobre">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-semibold text-slate-950 sm:text-4xl">
            Sobre o <span className="text-emerald-700">LabIF Maker</span>
          </h2>
          <div className="mx-auto mt-4 h-1.5 w-16 rounded-full bg-rose-600" />
          <p className="mt-5 text-lg leading-8 text-slate-600">
            O LabIF Maker é um laboratório de fabricação digital do IFSP Jacareí voltado à
            experimentação, prototipagem e apoio a projetos acadêmicos com foco em inovação,
            cultura maker e aprendizado prático.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {aboutItems.map((item) => (
            <Card className="border-slate-200 bg-slate-50/70 text-center shadow-none" key={item.title}>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <item.icon className="h-7 w-7 text-emerald-700" />
              </div>
              <CardTitle className="mt-4">{item.title}</CardTitle>
              <CardDescription className="mt-2">{item.text}</CardDescription>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
