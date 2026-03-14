import { LoaderCircle } from "lucide-react";

export default function ProtectedLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoaderCircle className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-sm text-slate-500">Carregando...</p>
      </div>
    </div>
  );
}
