"use client";

import { LogOut } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { signOut, loading } = useAuth();

  return (
    <Button disabled={loading} onClick={() => void signOut()} variant="secondary">
      <LogOut className="h-4 w-4" />
      Sair
    </Button>
  );
}
