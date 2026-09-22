"use client";

import { Chrome, LoaderCircle } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  const { signInWithGoogle, loading, signingIn } = useAuth();

  if (signingIn) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <LoaderCircle className="h-6 w-6 animate-spin text-brand-600" />
        <p className="text-sm font-medium text-slate-700">Entrando no portal...</p>
        <p className="text-xs text-slate-400">Isso pode levar alguns segundos</p>
      </div>
    );
  }

  return (
    <Button
      className="w-full"
      disabled={loading}
      onClick={() => void signInWithGoogle()}
      size="lg"
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
      Entrar com o Google
    </Button>
  );
}
