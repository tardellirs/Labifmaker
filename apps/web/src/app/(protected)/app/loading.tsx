import { LoaderCircle } from "lucide-react";

import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="animate-pulse">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="mt-3 h-6 w-48 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-full max-w-md rounded bg-slate-200" />
        </Card>
        <Card className="animate-pulse bg-[linear-gradient(180deg,#163423_0%,#1f4d2f_100%)]">
          <div className="h-4 w-28 rounded bg-white/20" />
          <div className="mt-3 h-4 w-full max-w-xs rounded bg-white/20" />
        </Card>
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card className="animate-pulse" key={i}>
            <div className="h-4 w-20 rounded bg-slate-200" />
            <div className="mt-4 h-8 w-12 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-40 rounded bg-slate-200" />
          </Card>
        ))}
      </section>
      <Card className="flex items-center justify-center py-12">
        <LoaderCircle className="h-6 w-6 animate-spin text-brand-600" />
      </Card>
    </div>
  );
}
